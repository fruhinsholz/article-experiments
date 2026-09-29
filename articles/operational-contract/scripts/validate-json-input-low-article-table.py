#!/usr/bin/env python3
"""Validate the generated JSON Input LOW article table against experiment data."""

from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = Path("experiments/json-input-low/manifest.json")
TABLE_JSON_PATH = Path("experiments/json-input-low/generated/article-table.json")


def read_json(path: Path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def expected_label(amount: int, threshold: int) -> str:
    return "LOW" if amount <= threshold else "NOT_LOW"


def error_count(cell: dict[str, int], threshold: int, amount: int) -> int:
    expected = expected_label(amount, threshold)
    if expected == "LOW":
        return cell["not_low"] + cell["invalid"]
    return cell["low"] + cell["invalid"]


def summary_cells(summary_path: Path) -> dict[tuple[str, str, str, int], dict[str, int | str]]:
    cells = {}
    with (ROOT / summary_path).open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            key = (
                row["model"],
                row["context_id"],
                row["format_id"],
                int(row["amount"]),
            )
            low = int(row["low"])
            not_low = int(row["not_low"])
            invalid = int(row["invalid"])
            total = int(row["total"])
            if low + not_low + invalid != total:
                raise AssertionError(f"{summary_path}: counts do not sum to total for {key}")
            cells[key] = {
                "model": row["model"],
                "context_id": row["context_id"],
                "format_id": row["format_id"],
                "amount": int(row["amount"]),
                "low": low,
                "not_low": not_low,
                "invalid": invalid,
                "total": total,
            }
    return cells


def calls_cells(calls_path: Path) -> dict[tuple[str, str, str, int], Counter[str]]:
    cells: dict[tuple[str, str, str, int], Counter[str]] = {}
    with (ROOT / calls_path).open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            record = json.loads(line)
            if record.get("type") != "completion":
                continue
            key = (
                record["model"],
                record["contextId"],
                record["formatId"],
                int(record["amount"]),
            )
            label = record.get("label")
            if label not in {"LOW", "NOT_LOW"}:
                label = "INVALID"
            cells.setdefault(key, Counter())[label] += 1
    return cells


def assert_cell_matches(name: str, actual: dict[str, int], expected: dict[str, int | str]) -> None:
    for field in ("low", "not_low", "invalid", "total"):
        if actual[field] != expected[field]:
            raise AssertionError(f"{name}: {field} mismatch, table={actual[field]} source={expected[field]}")


def main() -> None:
    manifest = read_json(MANIFEST_PATH)
    table = read_json(TABLE_JSON_PATH)
    config = manifest["publication_clean_table"]
    threshold = int(config["threshold_usd"])
    runs = {run["id"]: run for run in manifest["runs"]}

    if table["manifest_sha256"] != sha256_file(MANIFEST_PATH):
        raise AssertionError("article-table.json manifest_sha256 does not match manifest.json")

    for source_file in table["source_files"]:
        path = Path(source_file["path"])
        digest = sha256_file(path)
        if source_file["sha256"] != digest:
            raise AssertionError(f"{path}: sha256 mismatch in article-table provenance")

    summary_by_run = {}
    calls_by_run = {}
    for run_id in table["source_run_ids"]:
        run = runs[run_id]
        run_dir = Path(run["run_dir"])
        summary_by_run[run_id] = summary_cells(run_dir / "summary.csv")
        calls_by_run[run_id] = calls_cells(run_dir / "calls.jsonl")

        for key, summary in summary_by_run[run_id].items():
            calls = calls_by_run[run_id].get(key, Counter())
            raw = {
                "low": calls["LOW"],
                "not_low": calls["NOT_LOW"],
                "invalid": calls["INVALID"],
                "total": sum(calls.values()),
            }
            assert_cell_matches(f"{run_id} calls vs summary {key}", raw, summary)

    for row in table["table_rows"]:
        amount = int(row["amount"])
        if row["expected_label"] != expected_label(amount, threshold):
            raise AssertionError(f"Expected label mismatch for amount {amount}")

        for side in ("control", "retrieved_context"):
            cell = row[side]
            if cell is None:
                continue
            key = (
                row["model"],
                cell["context_id"],
                row["format_id"],
                amount,
            )
            summary = summary_by_run[cell["run_id"]][key]
            assert_cell_matches(f"{side} {cell['run_id']} {key}", cell, summary)
            expected_errors = error_count(cell, threshold, amount)
            if cell["error_count"] != expected_errors:
                raise AssertionError(f"{side} error_count mismatch for {key}")

        runtime = row["runtime_enforced"]
        if runtime["error_count"] != 0 or runtime["invalid"] != 0:
            raise AssertionError(f"Runtime enforcement should have zero errors for amount {amount}")
        if runtime["low"] + runtime["not_low"] != runtime["total"]:
            raise AssertionError(f"Runtime counts do not sum for amount {amount}")
        if expected_label(amount, threshold) == "LOW" and runtime["low"] != runtime["total"]:
            raise AssertionError(f"Runtime LOW count mismatch for amount {amount}")
        if expected_label(amount, threshold) == "NOT_LOW" and runtime["not_low"] != runtime["total"]:
            raise AssertionError(f"Runtime NOT_LOW count mismatch for amount {amount}")

    print(
        "Validated JSON Input LOW article table against manifest, summaries, raw calls, "
        f"and runtime rule: {len(table['table_rows'])} table rows."
    )


if __name__ == "__main__":
    main()
