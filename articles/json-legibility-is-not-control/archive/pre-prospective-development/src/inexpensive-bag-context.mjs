#!/usr/bin/env node
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";

const DEFAULT_PRICES = [5, 10, 20, 50, 100, 200, 500, 1000];

const CONDITIONS = [
  {
    name: "baseline_no_context",
    user: (price) => `Question:
I can only afford this bag if it is inexpensive.
The bag costs $${price.toLocaleString("en-US")}.

Is the bag inexpensive enough for me to afford?

Rules:
- Answer with exactly one token: YES or NO.
- Do not explain.`,
  },
  {
    name: "active_record_context",
    user: (price) => `Active record context:
- The record mentions a $100,000 contract.

Question:
I can only afford this bag if it is inexpensive.
The bag costs $${price.toLocaleString("en-US")}.

Is the bag inexpensive enough for me to afford?

Rules:
- Answer with exactly one token: YES or NO.
- Do not explain.`,
  },
];

function parseArgs(argv) {
  const args = {
    provider: "gemini",
    model: "gemini-3.5-flash-lite",
    samples: 20,
    prices: DEFAULT_PRICES,
    maxCalls: null,
    maxOutputTokens: 16,
    temperature: 0,
    concurrency: 4,
    label: "inexpensive-bag-active-context",
    dryRun: false,
    printExamples: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--provider": args.provider = argv[++i]; break;
      case "--model": args.model = argv[++i]; break;
      case "--samples": args.samples = Number.parseInt(argv[++i], 10); break;
      case "--prices": args.prices = argv[++i].split(",").map((value) => Number.parseInt(value.trim().replace(/[$,]/g, ""), 10)); break;
      case "--max-calls": args.maxCalls = Number.parseInt(argv[++i], 10); break;
      case "--max-output-tokens": args.maxOutputTokens = Number.parseInt(argv[++i], 10); break;
      case "--temperature": args.temperature = Number.parseFloat(argv[++i]); break;
      case "--concurrency": args.concurrency = Number.parseInt(argv[++i], 10); break;
      case "--label": args.label = argv[++i]; break;
      case "--dry-run": args.dryRun = true; break;
      case "--print-examples": args.printExamples = true; break;
      case "--help": args.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.help) {
    console.log("Usage: node src/inexpensive-bag-context.mjs --provider openai|gemini --model <model> [--samples 20] [--prices 5,10,20,50,100,200,500,1000]");
    process.exit(0);
  }
  if (!["openai", "gemini"].includes(args.provider)) throw new Error("--provider must be openai or gemini");
  if (!Number.isInteger(args.samples) || args.samples < 1) throw new Error("--samples must be >= 1");
  if (!Array.isArray(args.prices) || args.prices.length < 1 || args.prices.some((price) => !Number.isInteger(price) || price < 1)) {
    throw new Error("--prices must be a comma-separated list of positive integers");
  }
  if (args.maxCalls === null) args.maxCalls = args.prices.length * CONDITIONS.length * args.samples;
  if (!Number.isInteger(args.maxCalls) || args.maxCalls < 1) throw new Error("--max-calls must be >= 1");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be >= 1");
  if (!args.dryRun && args.provider === "openai" && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  if (!args.dryRun && args.provider === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  return args;
}

function isoForPath() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function runDir(args) {
  return path.join(ROOT, "experiments/inexpensive-bag-context/results", `${isoForPath()}-${args.provider}-${args.model}-${args.label}`);
}

function systemPrompt() {
  return "You answer price judgment questions. Return only the requested token.";
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
      const message = json?.error?.message ?? json?.error ?? text.slice(0, 500);
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
  if (args.dryRun && args.provider === "gemini") return { json: { candidates: [{ content: { parts: [{ text: "YES" }] } }] }, latencyMs: 0 };
  if (args.dryRun) return { json: { output_text: "YES" }, latencyMs: 0 };
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
  if (typeof json.output_text === "string") return json.output_text;
  return (json.output ?? []).flatMap((item) => item.content ?? []).map((content) => content.text ?? content.value ?? "").join("\n");
}

function normalizeAnswer(text) {
  const answer = String(text ?? "").trim().toUpperCase().replace(/[^A-Z_]/g, "");
  if (answer === "YES" || answer === "NO") return answer;
  return answer ? "INVALID" : "MISSING";
}

async function appendJsonl(file, row) {
  await appendFile(file, `${JSON.stringify(row)}\n`);
}

async function runJob(args, dir, job) {
  const condition = CONDITIONS.find((entry) => entry.name === job.condition);
  const system = systemPrompt();
  const user = condition.user(job.price);
  const payload = args.provider === "gemini" ? geminiPayload({ args, system, user }) : openAiPayload({ args, system, user });
  const base = {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    condition: job.condition,
    price: job.price,
    sampleIndex: job.sampleIndex,
    request: { system, user },
    apiPayload: payload,
  };
  try {
    const { json, latencyMs } = await callModel(args, payload);
    const text = outputText(args, json);
    const answer = normalizeAnswer(text);
    const row = { ...base, ok: true, latencyMs, rawText: text, answer };
    await appendJsonl(path.join(dir, "calls.jsonl"), row);
    return row;
  } catch (error) {
    const row = { ...base, ok: false, error: String(error?.message ?? error) };
    await appendJsonl(path.join(dir, "calls.jsonl"), row);
    return row;
  }
}

async function pool(items, concurrency, worker) {
  const results = [];
  let next = 0;
  async function consume() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, consume));
  return results;
}

function summarize(args, rows) {
  const summary = {};
  for (const price of args.prices) {
    summary[price] = {};
    for (const condition of CONDITIONS) {
      const conditionRows = rows.filter((row) => row.price === price && row.condition === condition.name);
      summary[price][condition.name] = {
        calls: conditionRows.length,
        ok: conditionRows.filter((row) => row.ok).length,
        yes: conditionRows.filter((row) => row.answer === "YES").length,
        no: conditionRows.filter((row) => row.answer === "NO").length,
        invalid: conditionRows.filter((row) => row.answer === "INVALID").length,
        missing: conditionRows.filter((row) => row.answer === "MISSING").length,
      };
    }
  }
  return {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    label: args.label,
    samples: args.samples,
    prices: args.prices,
    summary,
  };
}

function markdownReport(result) {
  const lines = [
    "# Inexpensive Bag Active Context Probe",
    "",
    `Created: ${result.createdAt}`,
    `Provider: ${result.provider}`,
    `Model: \`${result.model}\``,
    `Samples per condition: ${result.samples}`,
    `Prices: ${result.prices.map((price) => `$${price.toLocaleString("en-US")}`).join(", ")}`,
    "",
    "| Price | Baseline YES | Baseline NO | Active-context YES | Active-context NO | Invalid/Missing |",
    "|---:|---:|---:|---:|---:|---:|",
  ];
  for (const [price, byCondition] of Object.entries(result.summary)) {
    const baseline = byCondition.baseline_no_context;
    const active = byCondition.active_record_context;
    const invalidMissing = baseline.invalid + baseline.missing + active.invalid + active.missing;
    lines.push(`| $${Number(price).toLocaleString("en-US")} | ${baseline.yes}/${baseline.calls} | ${baseline.no}/${baseline.calls} | ${active.yes}/${active.calls} | ${active.no}/${active.calls} | ${invalidMissing} |`);
  }
  lines.push("");
  lines.push("Expected pattern: a low-to-high transition from `YES` to `NO`. The signal is whether the active `$100,000 contract` context shifts that transition upward or downward versus baseline.");
  lines.push("");
  lines.push("Baseline prompt template:");
  lines.push("```text");
  lines.push(CONDITIONS[0].user(10));
  lines.push("```");
  lines.push("");
  lines.push("Active context prompt template:");
  lines.push("```text");
  lines.push(CONDITIONS[1].user(10));
  lines.push("```");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.printExamples) {
    for (const condition of CONDITIONS) {
      console.log(`\n=== ${condition.name} ===\n${condition.user(10)}`);
    }
    return;
  }
  const jobs = [];
  for (let sampleIndex = 1; sampleIndex <= args.samples; sampleIndex += 1) {
    for (const price of args.prices) {
      for (const condition of CONDITIONS) jobs.push({ condition: condition.name, price, sampleIndex });
    }
  }
  const selectedJobs = jobs.slice(0, args.maxCalls);
  const dir = runDir(args);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify({ args, jobs: selectedJobs, conditions: CONDITIONS.map((condition) => ({ name: condition.name, templateAt10: condition.user(10) })) }, null, 2)}\n`);
  const rows = await pool(selectedJobs, args.concurrency, (job) => runJob(args, dir, job));
  const result = summarize(args, rows);
  await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(path.join(dir, "summary.md"), markdownReport(result));
  console.log(JSON.stringify({ dir, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
