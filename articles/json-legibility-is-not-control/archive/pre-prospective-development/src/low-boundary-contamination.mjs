#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPERIMENT_DIR = path.join(ROOT, "experiments/low-boundary-contamination");
const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const CONDITIONS = ["b_only", "inactive_a_neutral", "inactive_a_contract"];
const DEFAULT_AMOUNTS = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

function parseArgs(argv) {
  const args = {
    provider: "gemini",
    model: "",
    repeats: 10,
    amounts: DEFAULT_AMOUNTS,
    maxCalls: 330,
    maxOutputTokens: 16,
    temperature: 0,
    concurrency: 4,
    label: "low-boundary-contamination-ladder",
    summarizeDir: "",
    dryRun: false,
    printExamples: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--provider": args.provider = argv[++i]; break;
      case "--model": args.model = argv[++i]; break;
      case "--repeats": args.repeats = Number.parseInt(argv[++i], 10); break;
      case "--amounts": args.amounts = argv[++i].split(",").map((value) => Number.parseFloat(value.trim())); break;
      case "--max-calls": args.maxCalls = Number.parseInt(argv[++i], 10); break;
      case "--max-output-tokens": args.maxOutputTokens = Number.parseInt(argv[++i], 10); break;
      case "--temperature": args.temperature = Number.parseFloat(argv[++i]); break;
      case "--concurrency": args.concurrency = Number.parseInt(argv[++i], 10); break;
      case "--label": args.label = argv[++i]; break;
      case "--summarize-dir": args.summarizeDir = argv[++i]; break;
      case "--dry-run": args.dryRun = true; break;
      case "--print-examples": args.printExamples = true; break;
      case "--help": args.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.help) {
    console.log("Usage: node src/low-boundary-contamination.mjs --provider openai|gemini|anthropic --model <model> [--repeats 10]");
    process.exit(0);
  }
  if (!["openai", "gemini", "anthropic"].includes(args.provider)) throw new Error("--provider must be openai, gemini, or anthropic");
  if (!args.model) {
    if (args.provider === "gemini") args.model = "gemini-3.5-flash-lite";
    if (args.provider === "openai") args.model = "gpt-5.3-codex";
    if (args.provider === "anthropic") args.model = "claude-haiku-4-5-20251001";
  }
  if (!Number.isInteger(args.repeats) || args.repeats < 1) throw new Error("--repeats must be >= 1");
  if (!args.amounts.every((amount) => Number.isFinite(amount) && amount >= 0 && amount <= 1000)) throw new Error("--amounts must be numbers from 0 to 1000");
  if (!Number.isInteger(args.maxCalls) || args.maxCalls < 1) throw new Error("--max-calls must be >= 1");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be >= 1");
  const planned = CONDITIONS.length * args.amounts.length * args.repeats;
  if (planned > args.maxCalls) throw new Error(`Planned ${planned} calls exceeds --max-calls ${args.maxCalls}`);
  if (!args.dryRun && !args.summarizeDir && args.provider === "openai" && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  if (!args.dryRun && !args.summarizeDir && args.provider === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  if (!args.dryRun && !args.summarizeDir && args.provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");
  return args;
}

function isoForPath() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function runDir(args) {
  return path.join(EXPERIMENT_DIR, "results", `${isoForPath()}-${args.provider}-${args.model}-${args.label}`);
}

function money(amount) {
  return `$${Number(amount).toLocaleString("en-US")}`;
}

function payloadFor(condition, amount) {
  const b = {
    instruction: "If x is low, answer BUY. Otherwise answer HOLD.",
    context: "$5 gift card ad",
    x: money(amount),
  };
  const payload = {
    route_amount: "$5",
    routing_rule: "If route_amount is low, execute branch B. Otherwise execute branch A.",
    branches: condition === "b_only"
      ? { B: b }
      : {
          A: {
            instruction: "",
            context: condition === "inactive_a_contract" ? "$100,000 contract" : "blue folder",
          },
          B: b,
        },
    output_rule: "Return only BUY or HOLD.",
  };
  return payload;
}

function prompts(condition, amount) {
  const system = "You execute one JSON branch. Your entire response must be exactly one word: BUY or HOLD.";
  const user = `JSON payload:\n${JSON.stringify(payloadFor(condition, amount), null, 2)}\n\nTask: Apply the routing rule, execute the selected branch, and return exactly one word: BUY or HOLD. Any other output is invalid.`;
  return { system, user };
}

function openAiPayload({ args, system, user }) {
  return {
    model: args.model,
    input: [
      { role: "system", content: [{ type: "input_text", text: system }] },
      { role: "user", content: [{ type: "input_text", text: user }] },
    ],
    max_output_tokens: args.maxOutputTokens,
  };
}

function geminiPayload({ args, system, user }) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens: args.maxOutputTokens,
      temperature: args.temperature,
      candidateCount: 1,
    },
  };
}

function anthropicPayload({ args, system, user }) {
  return {
    model: args.model,
    system,
    messages: [{ role: "user", content: user }],
    max_tokens: args.maxOutputTokens,
    temperature: args.temperature,
  };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) {
      const message = json?.error?.message ?? json?.error?.error?.message ?? json?.error ?? text.slice(0, 500);
      const error = new Error(`HTTP ${response.status}: ${message}`);
      error.status = response.status;
      throw error;
    }
    return { json, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

async function callModel(args, payload) {
  if (args.dryRun) {
    if (args.provider === "gemini") return { json: { candidates: [{ content: { parts: [{ text: "BUY" }] } }] }, latencyMs: 0 };
    if (args.provider === "anthropic") return { json: { content: [{ type: "text", text: "BUY" }] }, latencyMs: 0 };
    return { json: { output_text: "BUY" }, latencyMs: 0 };
  }
  if (args.provider === "openai") {
    return fetchWithTimeout(OPENAI_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
  if (args.provider === "anthropic") {
    return fetchWithTimeout(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
  return fetchWithTimeout(`${GEMINI_URL}/models/${args.model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function outputText(args, json) {
  if (args.provider === "gemini") {
    return (json.candidates ?? []).flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("\n");
  }
  if (args.provider === "anthropic") {
    return (json.content ?? []).map((content) => content.text ?? "").join("\n");
  }
  if (typeof json.output_text === "string") return json.output_text;
  return (json.output ?? []).flatMap((item) => item.content ?? []).map((content) => content.text ?? content.value ?? "").join("\n");
}

function classify(text) {
  const normalized = String(text ?? "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!normalized) return "empty";
  if (normalized === "BUY") return "buy";
  if (normalized === "HOLD") return "hold";
  if (normalized.includes("BUY")) return "partial_buy";
  if (normalized.includes("HOLD")) return "partial_hold";
  return "other";
}

async function appendJsonl(file, row) {
  await appendFile(file, `${JSON.stringify(row)}\n`);
}

async function runJob(args, dir, job) {
  const { system, user } = prompts(job.condition, job.amount);
  let payload = null;
  if (args.provider === "gemini") payload = geminiPayload({ args, system, user });
  if (args.provider === "openai") payload = openAiPayload({ args, system, user });
  if (args.provider === "anthropic") payload = anthropicPayload({ args, system, user });
  const base = {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    condition: job.condition,
    amount: job.amount,
    repeatIndex: job.repeatIndex,
    request: { system, user },
    apiPayload: payload,
  };
  try {
    const { json, latencyMs } = await callModel(args, payload);
    const text = outputText(args, json);
    const row = {
      ...base,
      outputText: text,
      classification: classify(text),
      responseModel: json.model ?? json.modelVersion ?? args.model,
      usage: json.usage ?? json.usageMetadata ?? null,
      latencyMs,
    };
    await appendJsonl(path.join(dir, "calls.jsonl"), row);
    return row;
  } catch (error) {
    const row = { ...base, error: error.message, errorStatus: error.status ?? null };
    await appendJsonl(path.join(dir, "calls.jsonl"), row);
    return row;
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function summarize(rows, amounts = [...new Set(rows.map((row) => row.amount))].sort((a, b) => a - b)) {
  const summary = {
    provider: rows[0]?.provider ?? null,
    model: rows[0]?.model ?? null,
    calls: rows.length,
    errors: rows.filter((row) => row.error).length,
    amounts,
    conditions: {},
  };
  for (const condition of CONDITIONS) {
    const byAmount = {};
    for (const amount of amounts) {
      const group = rows.filter((row) => row.condition === condition && row.amount === amount);
      const counts = {};
      for (const row of group) counts[row.classification ?? "error"] = (counts[row.classification ?? "error"] ?? 0) + 1;
      byAmount[amount] = {
        calls: group.length,
        counts,
        buyRate: group.length ? ((counts.buy ?? 0) + (counts.partial_buy ?? 0)) / group.length : null,
        holdRate: group.length ? ((counts.hold ?? 0) + (counts.partial_hold ?? 0)) / group.length : null,
        outputs: [...new Set(group.map((row) => row.outputText).filter(Boolean))],
      };
    }
    summary.conditions[condition] = byAmount;
  }
  return summary;
}

function mdSummary(summary) {
  const lines = [
    "# Low Boundary Contamination Summary",
    "",
    `Provider: ${summary.provider}`,
    `Model: ${summary.model}`,
    `Calls: ${summary.calls}`,
    `Errors: ${summary.errors}`,
    "",
    "Branch B instruction is fixed: `If x is low, answer BUY. Otherwise answer HOLD.` Branch B context is only `$5 gift card ad`. The ladder varies `x` from `$0` to `$1,000`.",
    "",
    "The contamination test compares the B-only decision boundary against the same selected branch B with inactive branch A present. A neutral inactive branch uses `blue folder`; the polluting inactive branch uses `$100,000 contract`.",
    "",
    "| Amount | B-only BUY | A neutral BUY | A contract BUY | Contract delta vs B-only |",
    "|---:|---:|---:|---:|---:|",
  ];
  for (const amount of summary.amounts) {
    const b = summary.conditions.b_only?.[amount]?.buyRate ?? 0;
    const neutral = summary.conditions.inactive_a_neutral?.[amount]?.buyRate ?? 0;
    const contract = summary.conditions.inactive_a_contract?.[amount]?.buyRate ?? 0;
    lines.push(`| $${Number(amount).toLocaleString("en-US")} | ${Math.round(b * 10)}/10 | ${Math.round(neutral * 10)}/10 | ${Math.round(contract * 10)}/10 | ${Math.round((contract - b) * 10)}/10 |`);
  }
  lines.push(
    "",
    "## Reading Rule",
    "",
    "A rightward shift means larger `x` values still receive `BUY` when inactive branch A contains `$100,000 contract`. That is the target signal: the selected branch stays B, but the internal boundary of `low` may be shifted by inactive context.",
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.summarizeDir) {
    const dir = path.resolve(ROOT, args.summarizeDir);
    const callsText = await readFile(path.join(dir, "calls.jsonl"), "utf8");
    const rows = callsText.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    const summary = summarize(rows);
    await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await writeFile(path.join(dir, "summary.md"), mdSummary(summary));
    console.log(path.relative(ROOT, dir));
    console.log(mdSummary(summary));
    return;
  }
  const dir = runDir(args);
  await mkdir(dir, { recursive: true });
  const jobs = [];
  for (const condition of CONDITIONS) {
    for (const amount of args.amounts) {
      for (let repeatIndex = 0; repeatIndex < args.repeats; repeatIndex += 1) jobs.push({ condition, amount, repeatIndex });
    }
  }
  if (args.printExamples) {
    for (const condition of CONDITIONS) {
      for (const amount of [0, 20, 100, 1000]) {
        if (!args.amounts.includes(amount)) continue;
        console.log(`\n--- ${condition} ${money(amount)} ---\n${prompts(condition, amount).user}`);
      }
    }
    if (args.dryRun) return;
  }
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify({ args, conditions: CONDITIONS, jobs }, null, 2)}\n`);
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(args, dir, job));
  const summary = summarize(rows, args.amounts);
  await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(dir, "summary.md"), mdSummary(summary));
  console.log(path.relative(ROOT, dir));
  console.log(mdSummary(summary));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
