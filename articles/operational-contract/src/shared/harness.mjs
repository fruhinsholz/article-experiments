import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { gzip as gzipCb } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzipCb);

export const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);

export function resultsDirForTestbed(testbed) {
  if (testbed === "low") return path.join(ROOT, "experiments/low-retrieved-context/results");
  if (testbed === "enough") return path.join(ROOT, "experiments/enough-evidence-sufficiency/results");
  return path.join(ROOT, "experiments", sanitizeLabel(testbed), "results");
}
export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export function usage({ command, description, extraOptions = "" }) {
  return `Usage: node ${command} [options]

${description}

Options:
  --models <a,b>             Comma-separated model names. Required unless THRESHOLD_MODELS is set.
  --samples <n>              Calls per candidate state. Defaults to 10.
  --epochs <n>               Search epochs. Defaults to 10.
  --temperature <n>          Sampling temperature. Defaults to 0.
  --max-output-tokens <n>    Response budget. Defaults to 256.
  --reasoning-effort <value> Reasoning effort for reasoning models. Defaults to omitted.
  --max-calls <n>            Hard call guard. Defaults to 1000.
  --seed <n>                 Request seed when the provider supports it.
  --label <name>             Output directory label.
  --provider <name>          Provider adapter: openai, claude-cli, or gemini. Defaults to openai.
  --dry-run                  Write planned requests without calling the API.
  --gzip-jsonl               Also write calls.jsonl.gz.
${extraOptions}  --help                     Show this help.

Environment:
  OPENAI_API_KEY             Required for live OpenAI runs.
  GEMINI_API_KEY             Required for live Gemini runs.
  CLAUDE_MAX_BUDGET_USD      Per-call Claude CLI budget cap. Defaults to 0.05.
  THRESHOLD_MODELS           Comma-separated model names if --models is omitted.`;
}

export function parseCommonArgs(argv, defaults = {}, parseSpecificArg = () => false) {
  const args = {
    models: process.env.THRESHOLD_MODELS ?? "",
    samples: 10,
    epochs: 10,
    temperature: 0,
    maxOutputTokens: 256,
    reasoningEffort: null,
    maxCalls: 1000,
    seed: null,
    label: "run",
    provider: "openai",
    dryRun: false,
    gzipJsonl: false,
    help: false,
    ...defaults,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--models":
        args.models = argv[++i];
        break;
      case "--samples":
        args.samples = Number.parseInt(argv[++i], 10);
        break;
      case "--epochs":
        args.epochs = Number.parseInt(argv[++i], 10);
        break;
      case "--temperature":
        args.temperature = Number.parseFloat(argv[++i]);
        break;
      case "--max-output-tokens":
        args.maxOutputTokens = Number.parseInt(argv[++i], 10);
        break;
      case "--reasoning-effort":
        args.reasoningEffort = argv[++i];
        break;
      case "--max-calls":
        args.maxCalls = Number.parseInt(argv[++i], 10);
        break;
      case "--seed":
        args.seed = Number.parseInt(argv[++i], 10);
        break;
      case "--label":
        args.label = argv[++i];
        break;
      case "--provider":
        args.provider = argv[++i];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--gzip-jsonl":
        args.gzipJsonl = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default: {
        const nextIndex = parseSpecificArg(args, argv, i);
        if (nextIndex === false) throw new Error(`Unknown argument: ${arg}`);
        i = nextIndex;
      }
    }
  }

  return args;
}

export function modelsFromArgs(args) {
  return args.models.split(",").map((model) => model.trim()).filter(Boolean);
}

export function requireNumber(name, value, min) {
  if (!Number.isFinite(value) || value < min) {
    throw new Error(`${name} must be a number >= ${min}`);
  }
}

export function validateCommonArgs(args) {
  requireNumber("--samples", args.samples, 1);
  requireNumber("--epochs", args.epochs, 1);
  requireNumber("--temperature", args.temperature, 0);
  requireNumber("--max-output-tokens", args.maxOutputTokens, 1);
  requireNumber("--max-calls", args.maxCalls, 1);
  if (args.reasoningEffort !== null && !["none", "minimal", "low", "medium", "high", "xhigh", "max"].includes(args.reasoningEffort)) {
    throw new Error("--reasoning-effort must be one of none, minimal, low, medium, high, xhigh, or max.");
  }
  if (!["openai", "claude-cli", "gemini"].includes(args.provider)) {
    throw new Error(`Unsupported provider: ${args.provider}.`);
  }
  if (modelsFromArgs(args).length === 0) throw new Error("Pass --models or set THRESHOLD_MODELS.");
  if (!args.dryRun && args.provider === "openai" && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required for live OpenAI runs.");
  if (!args.dryRun && args.provider === "gemini" && !(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is required for live Gemini runs.");
}

export function sanitizeLabel(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "run";
}

export function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount);
}

export function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;

  const chunks = [];
  for (const item of responseJson.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") chunks.push(content.text);
      if (typeof content.value === "string") chunks.push(content.value);
    }
  }
  return chunks.join("\n");
}

export function extractClaudeCliOutputText(responseJson) {
  return typeof responseJson.result === "string" ? responseJson.result : "";
}

export function extractGeminiOutputText(responseJson) {
  const chunks = [];
  for (const candidate of responseJson.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (typeof part.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

export function classifyLabel(text, allowedLabels) {
  const raw = String(text ?? "").trim();
  const normalized = raw
    .replace(/^```(?:text|json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
    .replace(/^['"`]|['"`]$/g, "")
    .trim()
    .toUpperCase();

  const strict = allowedLabels.includes(normalized) ? normalized : "INVALID";
  const loose = allowedLabels.find((label) => new RegExp(`\\b${label}\\b`, "i").test(raw)) ?? "INVALID";
  return { label: strict === "INVALID" ? loose : strict, strictLabel: strict, normalizedText: normalized };
}

export async function gitCommitHash() {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve) => {
    const child = spawn("git", ["rev-parse", "HEAD"], { cwd: ROOT });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.on("close", (code) => resolve(code === 0 ? output.trim() : null));
    child.on("error", () => resolve(null));
  });
}

function supportsReasoningEffort(model) {
  return /^(gpt-5|o[1-9])/.test(model);
}

export function buildOpenAiPayload({ model, system, user, temperature, maxOutputTokens, reasoningEffort, seed, metadata }) {
  const payload = {
    model,
    input: [
      { role: "system", content: [{ type: "input_text", text: system }] },
      { role: "user", content: [{ type: "input_text", text: user }] },
    ],
    max_output_tokens: maxOutputTokens,
    metadata,
  };
  if (Number.isFinite(temperature) && temperature !== 0) payload.temperature = temperature;
  if (reasoningEffort !== null && supportsReasoningEffort(model)) payload.reasoning = { effort: reasoningEffort };
  if (Number.isInteger(seed)) payload.seed = seed;
  return payload;
}

export function buildGeminiPayload({ model, system, user, temperature, maxOutputTokens, reasoningEffort, seed, metadata }) {
  const payload = {
    model,
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens,
      candidateCount: 1,
    },
    metadata,
  };
  if (Number.isFinite(temperature)) payload.generationConfig.temperature = temperature;
  if (reasoningEffort !== null) {
    const thinkingLevel = reasoningEffort === "none" ? "minimal" : reasoningEffort;
    payload.generationConfig.thinkingConfig = { thinkingLevel };
  }
  if (Number.isInteger(seed)) payload.generationConfig.seed = seed;
  return payload;
}

export async function callGemini({ apiKey, payload }) {
  const startedAt = Date.now();
  const timeoutMs = Number.parseInt(process.env.THRESHOLD_REQUEST_TIMEOUT_MS ?? "120000", 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const model = encodeURIComponent(payload.model);
  const url = `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const { model: _model, metadata: _metadata, ...requestBody } = payload;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { rawText: text };
    }

    if (!response.ok) {
      const message = json?.error?.message ?? response.statusText;
      const error = new Error(`Gemini API error ${response.status}: ${message}`);
      error.status = response.status;
      error.responseJson = json;
      throw error;
    }

    return { json, latencyMs: Date.now() - startedAt };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Gemini API request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callOpenAI({ apiKey, payload }) {
  const startedAt = Date.now();
  const timeoutMs = Number.parseInt(process.env.THRESHOLD_REQUEST_TIMEOUT_MS ?? "120000", 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { rawText: text };
    }

    if (!response.ok) {
      const message = json?.error?.message ?? response.statusText;
      const error = new Error(`OpenAI API error ${response.status}: ${message}`);
      error.status = response.status;
      error.responseJson = json;
      throw error;
    }

    return { json, latencyMs: Date.now() - startedAt };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`OpenAI API request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function buildClaudeCliPayload({ model, system, user, maxOutputTokens, reasoningEffort, metadata }) {
  const effort = ["low", "medium", "high", "xhigh", "max"].includes(reasoningEffort) ? reasoningEffort : "low";
  return {
    model,
    system,
    user,
    max_output_tokens: maxOutputTokens,
    metadata,
    cli: {
      effort,
      maxBudgetUsd: Number.parseFloat(process.env.CLAUDE_MAX_BUDGET_USD ?? "0.05"),
    },
  };
}

export async function callClaudeCli({ payload }) {
  const { spawn } = await import("node:child_process");
  const startedAt = Date.now();
  const timeoutMs = Number.parseInt(process.env.THRESHOLD_REQUEST_TIMEOUT_MS ?? "120000", 10);
  const maxBudgetUsd = Number.isFinite(payload.cli.maxBudgetUsd) && payload.cli.maxBudgetUsd > 0 ? String(payload.cli.maxBudgetUsd) : "0.05";
  const args = [
    "-p",
    "--model", payload.model,
    "--effort", payload.cli.effort,
    "--max-budget-usd", maxBudgetUsd,
    "--output-format", "json",
    "--no-session-persistence",
    "--tools", "",
    "--system-prompt", payload.system,
    payload.user,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { cwd: ROOT, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Claude CLI request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      let json;
      try {
        json = JSON.parse(stdout);
      } catch {
        json = { rawText: stdout, stderr };
      }
      if (code !== 0 || json.is_error) {
        const message = json.api_error_status ?? json.error ?? stderr.trim() ?? stdout.trim() ?? `Claude CLI exited with ${code}`;
        const error = new Error(`Claude CLI error: ${message}`);
        error.status = json.api_error_status ?? code;
        error.responseJson = json;
        reject(error);
        return;
      }
      resolve({ json, latencyMs: Date.now() - startedAt });
    });
  });
}

export async function appendJsonl(file, value) {
  await appendFile(file, `${JSON.stringify(value)}\n`, "utf8");
}

export async function prepareRunDir({ testbed, label, args, prompts, fixture, search, extraResultFiles = {} }) {
  const resultsDir = resultsDirForTestbed(testbed);
  await mkdir(resultsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(resultsDir, `${stamp}-${sanitizeLabel(label)}-${sanitizeLabel(testbed)}`);
  await mkdir(runDir, { recursive: true });

  const metadata = {
    testbed,
    createdAt: new Date().toISOString(),
    commitHash: await gitCommitHash(),
    commandLine: process.argv.join(" "),
    provider: args.provider,
    requestedModels: modelsFromArgs(args),
    apiParameters: {
      temperature: args.temperature,
      maxOutputTokens: args.maxOutputTokens,
      reasoningEffort: args.reasoningEffort,
      seed: Number.isInteger(args.seed) ? args.seed : null,
    },
    samplesPerState: args.samples,
    epochs: args.epochs,
    maxCalls: args.maxCalls,
    dryRun: args.dryRun,
    convergenceRule: search.convergenceRule,
    binarySearchRange: search.range,
    promptFiles: prompts,
    fixtureFile: "fixture.json",
    resultFiles: {
      rawJsonl: "calls.jsonl",
      summaryCsv: "summary.csv",
      summaryMarkdown: "summary.md",
      analysis: "analysis.md",
      ...extraResultFiles,
    },
  };

  await writeFile(path.join(runDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  await writeFile(path.join(runDir, "fixture.json"), `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  return { runDir, metadata };
}

export async function writePromptFiles(runDir, promptMap) {
  for (const [fileName, text] of Object.entries(promptMap)) {
    await writeFile(path.join(runDir, fileName), `${text.trim()}\n`, "utf8");
  }
}

export function summarizeRows(rows, allowedLabels, keyFields) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFields.map((field) => row[field]).join("|||");
    if (!groups.has(key)) {
      groups.set(key, {
        ...Object.fromEntries(keyFields.map((field) => [field, row[field]])),
        total: 0,
        counts: Object.fromEntries([...allowedLabels, "INVALID"].map((label) => [label, 0])),
        strictCounts: Object.fromEntries([...allowedLabels, "INVALID"].map((label) => [label, 0])),
        errors: 0,
        outputTruncations: 0,
        modelVersions: new Set(),
      });
    }
    const group = groups.get(key);
    group.total += 1;
    group.counts[row.label ?? "INVALID"] = (group.counts[row.label ?? "INVALID"] ?? 0) + 1;
    group.strictCounts[row.strictLabel ?? "INVALID"] = (group.strictCounts[row.strictLabel ?? "INVALID"] ?? 0) + 1;
    if (row.error) group.errors += 1;
    if (row.outputTruncated) group.outputTruncations += 1;
    if (row.responseModel) group.modelVersions.add(row.responseModel);
  }
  return [...groups.values()].map((group) => ({ ...group, modelVersions: [...group.modelVersions].sort() }));
}

export function pct(n, total) {
  return total ? `${((n / total) * 100).toFixed(1)}%` : "0.0%";
}

export async function maybeWriteGzip(runDir) {
  const rawPath = path.join(runDir, "calls.jsonl");
  const raw = await readFile(rawPath);
  await writeFile(`${rawPath}.gz`, await gzipAsync(raw));
}
