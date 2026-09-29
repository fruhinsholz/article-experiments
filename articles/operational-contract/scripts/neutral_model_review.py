#!/usr/bin/env python3
"""Run manifest-driven neutral review calls against model provider APIs.

The script writes exact request payloads and raw responses, excluding secret
headers. It does not read chat history, Space material, or local memory.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_RESULTS_DIR = ROOT / "neutral-reviews" / "results"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1"
ANTHROPIC_VERSION = "2023-06-01"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a neutral review manifest.")
    parser.add_argument("--manifest", required=True, help="Path to review manifest JSON.")
    parser.add_argument("--results-dir", default=str(DEFAULT_RESULTS_DIR))
    parser.add_argument("--label", default=None)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def slug(value: str) -> str:
    safe = "".join(ch.lower() if ch.isalnum() else "-" for ch in value)
    while "--" in safe:
        safe = safe.replace("--", "-")
    return safe.strip("-")[:80] or "run"


def read_json(path: pathlib.Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: pathlib.Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def append_jsonl(path: pathlib.Path, value: Any) -> None:
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(value, ensure_ascii=False) + "\n")


def git_commit() -> str | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout.strip()
    except Exception:
        return None


def post_json(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        text = response.read().decode("utf-8", errors="replace")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"rawText": text}


def get_json(url: str, headers: dict[str, str], timeout: int) -> dict[str, Any]:
    request = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        text = response.read().decode("utf-8", errors="replace")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"rawText": text}


def extract_openai_text(response: dict[str, Any]) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"].strip()
    chunks: list[str] = []
    for item in response.get("output", []) or []:
        for content in item.get("content", []) or []:
            text = content.get("text")
            if isinstance(text, str):
                chunks.append(text)
    return "\n".join(chunks).strip()


def extract_gemini_text(response: dict[str, Any]) -> str:
    chunks: list[str] = []
    for candidate in response.get("candidates", []) or []:
        for part in candidate.get("content", {}).get("parts", []) or []:
            text = part.get("text")
            if isinstance(text, str):
                chunks.append(text)
    return "\n".join(chunks).strip()


def extract_anthropic_text(response: dict[str, Any]) -> str:
    chunks: list[str] = []
    for block in response.get("content", []) or []:
        text = block.get("text")
        if isinstance(text, str):
            chunks.append(text)
    return "\n".join(chunks).strip()


def resolve_anthropic_model(model: str, timeout: int) -> tuple[str, dict[str, Any] | None]:
    if model != "latest":
        return model, None
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise SystemExit("ANTHROPIC_API_KEY is required for Anthropic latest model resolution.")
    response = get_json(
        f"{ANTHROPIC_BASE_URL}/models",
        {"x-api-key": api_key, "anthropic-version": ANTHROPIC_VERSION},
        timeout,
    )
    models = response.get("data", []) or []
    candidates = [m for m in models if isinstance(m.get("id"), str) and m["id"].startswith("claude-")]
    candidates.sort(key=lambda m: (m.get("created_at") or "", m.get("id") or ""), reverse=True)
    if not candidates:
        raise RuntimeError("Anthropic model list did not return a Claude model.")
    return candidates[0]["id"], response


def build_payload(
    provider: str,
    model: str,
    system: str,
    user: str,
    temperature: float,
    max_tokens: int,
    reasoning_effort: str | None,
) -> dict[str, Any]:
    if provider == "openai":
        payload: dict[str, Any] = {
            "model": model,
            "input": [
                {"role": "system", "content": [{"type": "input_text", "text": system}]},
                {"role": "user", "content": [{"type": "input_text", "text": user}]},
            ],
            "max_output_tokens": max_tokens,
        }
        if temperature != 0:
            payload["temperature"] = temperature
        if reasoning_effort:
            payload["reasoning"] = {"effort": reasoning_effort}
        return payload
    if provider == "gemini":
        payload = {
            "model": model,
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "candidateCount": 1,
            },
        }
        if reasoning_effort:
            payload["generationConfig"]["thinkingConfig"] = {
                "thinkingLevel": "minimal" if reasoning_effort == "none" else reasoning_effort
            }
        return payload
    if provider == "anthropic":
        payload = {
            "model": model,
            "system": system,
            "messages": [{"role": "user", "content": user}],
            "max_tokens": max_tokens,
            "thinking": {"type": "disabled"},
        }
        if temperature != 0:
            payload["temperature"] = temperature
        return payload
    raise ValueError(f"Unsupported provider: {provider}")


def call_provider(provider: str, payload: dict[str, Any], timeout: int) -> tuple[dict[str, Any], str]:
    if provider == "openai":
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise SystemExit("OPENAI_API_KEY is required.")
        response = post_json(OPENAI_RESPONSES_URL, {"Authorization": f"Bearer {api_key}"}, payload, timeout)
        return response, extract_openai_text(response)
    if provider == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise SystemExit("GEMINI_API_KEY or GOOGLE_API_KEY is required.")
        model = urllib.parse.quote(payload["model"], safe="")
        body = {key: value for key, value in payload.items() if key != "model"}
        url = f"{GEMINI_BASE_URL}/models/{model}:generateContent?key={urllib.parse.quote(api_key)}"
        response = post_json(url, {}, body, timeout)
        return response, extract_gemini_text(response)
    if provider == "anthropic":
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise SystemExit("ANTHROPIC_API_KEY is required.")
        response = post_json(
            f"{ANTHROPIC_BASE_URL}/messages",
            {"x-api-key": api_key, "anthropic-version": ANTHROPIC_VERSION},
            payload,
            timeout,
        )
        return response, extract_anthropic_text(response)
    raise ValueError(f"Unsupported provider: {provider}")


def main() -> int:
    args = parse_args()
    manifest_path = pathlib.Path(args.manifest).resolve()
    manifest = read_json(manifest_path)
    label = args.label or manifest.get("label") or manifest_path.stem
    run_dir = pathlib.Path(args.results_dir).resolve() / f"{utc_now().replace(':', '').replace('.', '-')}-{slug(label)}"
    run_dir.mkdir(parents=True, exist_ok=False)

    system = manifest["system"]
    user = manifest["user"]
    temperature = float(manifest.get("temperature", 0))
    max_tokens = int(manifest.get("max_tokens", 1600))
    reasoning_effort = manifest.get("reasoning_effort")
    timeout = int(manifest.get("timeout_seconds", 180))
    providers = manifest["providers"]

    metadata = {
        "created_at": utc_now(),
        "manifest_path": str(manifest_path),
        "command_line": sys.argv,
        "commit_hash": git_commit(),
        "temperature": temperature,
        "max_tokens": max_tokens,
        "reasoning_effort": reasoning_effort,
        "dry_run": args.dry_run,
        "providers": providers,
    }
    write_json(run_dir / "manifest.json", manifest)
    write_json(run_dir / "metadata.json", metadata)
    (run_dir / "system.txt").write_text(system + "\n", encoding="utf-8")
    (run_dir / "user.txt").write_text(user + "\n", encoding="utf-8")

    outputs: list[dict[str, Any]] = []
    for item in providers:
        provider = item["provider"]
        requested_model = item["model"]
        started_at = utc_now()
        resolved_model = requested_model
        model_list_response = None
        if provider == "anthropic":
            resolved_model, model_list_response = resolve_anthropic_model(requested_model, timeout)
        payload = build_payload(provider, resolved_model, system, user, temperature, max_tokens, reasoning_effort)
        request_record = {
            "provider": provider,
            "requested_model": requested_model,
            "resolved_model": resolved_model,
            "request_payload": payload,
            "model_list_response": model_list_response,
        }
        if args.dry_run:
            response = {"dryRun": True}
            text = ""
            latency_ms = 0
            error = None
        else:
            before = time.time()
            try:
                response, text = call_provider(provider, payload, timeout)
                error = None
            except urllib.error.HTTPError as exc:
                body = exc.read().decode("utf-8", errors="replace")
                response = {"httpStatus": exc.code, "body": body}
                text = ""
                error = f"HTTP {exc.code}"
            latency_ms = round((time.time() - before) * 1000)
        completed_at = utc_now()
        record = {
            **request_record,
            "started_at": started_at,
            "completed_at": completed_at,
            "latency_ms": latency_ms,
            "error": error,
            "response_raw": response,
            "text": text,
        }
        append_jsonl(run_dir / "calls.jsonl", record)
        write_json(run_dir / f"{provider}-{slug(resolved_model)}.json", record)
        (run_dir / f"{provider}-{slug(resolved_model)}.md").write_text(text + "\n", encoding="utf-8")
        outputs.append(
            {
                "provider": provider,
                "requested_model": requested_model,
                "resolved_model": resolved_model,
                "error": error,
                "text_file": f"{provider}-{slug(resolved_model)}.md",
            }
        )

    write_json(run_dir / "summary.json", {"run_dir": str(run_dir), "outputs": outputs})
    print(run_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
