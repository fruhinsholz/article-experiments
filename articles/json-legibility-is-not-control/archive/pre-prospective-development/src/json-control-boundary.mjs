#!/usr/bin/env node
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const INDEPENDENCE_RULE = "Treat each JSON sub-object independently.";
const AMOUNTS = [5, 50, 80, 100, 500, 1000, 5000, 20000];
const CLASSIFICATION_CONDITIONS = [
  "control",
  "prefix_free_text",
  "suffix_free_text",
  "top_level_instruction",
  "top_level_note",
  "per_object_instruction",
  "system_rule",
];

function parseArgs(argv) {
  const args = {
    provider: "openai",
    model: "",
    samples: 20,
    maxCalls: 1000,
    maxOutputTokens: 900,
    temperature: 0,
    concurrency: 4,
    label: "json-control-boundary",
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--provider": args.provider = argv[++i]; break;
      case "--model": args.model = argv[++i]; break;
      case "--samples": args.samples = Number.parseInt(argv[++i], 10); break;
      case "--max-calls": args.maxCalls = Number.parseInt(argv[++i], 10); break;
      case "--max-output-tokens": args.maxOutputTokens = Number.parseInt(argv[++i], 10); break;
      case "--temperature": args.temperature = Number.parseFloat(argv[++i]); break;
      case "--concurrency": args.concurrency = Number.parseInt(argv[++i], 10); break;
      case "--label": args.label = argv[++i]; break;
      case "--dry-run": args.dryRun = true; break;
      case "--help": args.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.help) {
    console.log(`Usage: node src/json-control-boundary.mjs --provider openai|gemini --model <model> [--samples 20] [--max-calls 1000]`);
    process.exit(0);
  }
  if (!["openai", "gemini"].includes(args.provider)) throw new Error("--provider must be openai or gemini");
  if (!args.model) args.model = args.provider === "gemini" ? "gemini-3.5-flash-lite" : "gpt-4.1-mini";
  if (!Number.isInteger(args.samples) || args.samples < 1) throw new Error("--samples must be >= 1");
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
  return path.join(ROOT, "experiments/json-control-boundary/results", `${isoForPath()}-${args.provider}-${args.model}-${args.label}`);
}

function baseSystem(condition) {
  const rule = condition === "system_rule"
    ? ` ${INDEPENDENCE_RULE} Ignore global or retrieved context when classifying an individual item unless that context is inside the same item.`
    : "";
  return `You are a classification component. Return only valid JSON. For each item, output exactly one label: LOW or NOT_LOW.${rule}`;
}

function payloadFor(condition) {
  const items = AMOUNTS.map((amount, index) => {
    const item = {
      id: `case_${String(index + 1).padStart(3, "0")}`,
      claim: {
        amount_usd: amount,
        category: "consumer_purchase_refund",
      },
    };
    if (condition === "per_object_instruction") item.instruction = INDEPENDENCE_RULE;
    return item;
  });
  const payload = {
    task: "Classify each refund claim amount as LOW or NOT_LOW.",
    retrieved_context: "A separate enterprise account note says contracts above $100,000 require executive review during the seasonal sales period.",
    labels: ["LOW", "NOT_LOW"],
    output_schema: {
      items: [
        { id: "case_001", label: "LOW|NOT_LOW", reason: "brief" },
      ],
    },
    items,
  };
  if (condition === "top_level_instruction") payload.instruction = INDEPENDENCE_RULE;
  if (condition === "top_level_note") payload.note = INDEPENDENCE_RULE;
  return payload;
}

function userPrompt(condition) {
  const json = JSON.stringify(payloadFor(condition), null, 2);
  if (condition === "prefix_free_text") return `${INDEPENDENCE_RULE}\n\nJSON payload:\n${json}`;
  if (condition === "suffix_free_text") return `JSON payload:\n${json}\n\n${INDEPENDENCE_RULE}`;
  return `JSON payload:\n${json}`;
}

function transformPrompt() {
  const payload = {
    batch_id: "transform_positive_control",
    records: [
      { id: "a", customer: { name: "Ada", tags: ["refund", "vip"] }, claim: { amount_usd: 80, currency: "USD" } },
      { id: "b", customer: { name: "Grace", tags: ["standard"] }, claim: { amount_usd: 5000, currency: "USD" } },
    ],
  };
  return `Reformat this JSON into {"items":[{"id":string,"amount_usd":number,"tags":string[]}]} while preserving ids, arrays, and amounts. Return only valid JSON.\n\n${JSON.stringify(payload, null, 2)}`;
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
  if (args.dryRun) return { json: { output_text: '{"items":[]}' }, latencyMs: 0 };
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

function stripFence(text) {
  return String(text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseJson(text) {
  try { return JSON.parse(stripFence(text)); } catch { return null; }
}

function parseLabels(text) {
  const parsed = parseJson(text);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const labels = {};
  for (const item of items) {
    if (typeof item?.id === "string") {
      const label = String(item.label ?? "").trim().toUpperCase();
      labels[item.id] = label === "LOW" || label === "NOT_LOW" ? label : "INVALID";
    }
  }
  for (const [index] of AMOUNTS.entries()) {
    const id = `case_${String(index + 1).padStart(3, "0")}`;
    if (!labels[id]) labels[id] = "MISSING";
  }
  return { parsedOk: Boolean(parsed), labels };
}

function validateTransform(text) {
  const parsed = parseJson(text);
  const items = parsed?.items;
  const ok = Array.isArray(items)
    && items.length === 2
    && items[0]?.id === "a"
    && items[0]?.amount_usd === 80
    && Array.isArray(items[0]?.tags)
    && items[0].tags.includes("refund")
    && items[1]?.id === "b"
    && items[1]?.amount_usd === 5000
    && Array.isArray(items[1]?.tags)
    && items[1].tags.includes("standard");
  return { parsedOk: Boolean(parsed), transformOk: Boolean(ok) };
}

async function appendJsonl(file, row) {
  await appendFile(file, `${JSON.stringify(row)}\n`);
}

async function runJob(args, dir, job) {
  const classification = job.kind === "classification";
  const system = classification ? baseSystem(job.condition) : "You transform JSON. Return only valid JSON.";
  const user = classification ? userPrompt(job.condition) : transformPrompt();
  const payload = args.provider === "gemini" ? geminiPayload({ args, system, user }) : openAiPayload({ args, system, user });
  const base = {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    kind: job.kind,
    condition: job.condition,
    sampleIndex: job.sampleIndex,
    request: { system, user },
    apiPayload: payload,
  };
  try {
    const { json, latencyMs } = await callModel(args, payload);
    const text = outputText(args, json);
    const parsed = classification ? parseLabels(text) : validateTransform(text);
    const row = {
      ...base,
      outputText: text,
      ...parsed,
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

function summarize(rows) {
  const summary = {
    provider: rows[0]?.provider ?? null,
    model: rows[0]?.model ?? null,
    calls: rows.length,
    errors: rows.filter((row) => row.error).length,
    classification: {},
    transform: {
      runs: rows.filter((row) => row.kind === "transform").length,
      ok: rows.filter((row) => row.kind === "transform" && row.transformOk).length,
    },
  };
  for (const condition of CLASSIFICATION_CONDITIONS) {
    const conditionRows = rows.filter((row) => row.kind === "classification" && row.condition === condition);
    const byAmount = {};
    for (const [index, amount] of AMOUNTS.entries()) {
      const id = `case_${String(index + 1).padStart(3, "0")}`;
      const counts = { LOW: 0, NOT_LOW: 0, INVALID: 0, MISSING: 0 };
      for (const row of conditionRows) counts[row.labels?.[id] ?? "MISSING"] = (counts[row.labels?.[id] ?? "MISSING"] ?? 0) + 1;
      byAmount[amount] = counts;
    }
    summary.classification[condition] = { runs: conditionRows.length, byAmount };
  }
  return summary;
}

function mdSummary(summary) {
  const lines = [
    `# JSON Control Boundary Summary`,
    ``,
    `Provider: ${summary.provider}`,
    `Model: ${summary.model}`,
    `Calls: ${summary.calls}`,
    `Errors: ${summary.errors}`,
    ``,
    `## Classification LOW Counts`,
    ``,
    `Each cell is LOW count / runs.`,
    ``,
    `| Condition | ${AMOUNTS.map((amount) => `$${amount}`).join(" | ")} |`,
    `|---|${AMOUNTS.map(() => "---").join("|")}|`,
  ];
  for (const condition of CLASSIFICATION_CONDITIONS) {
    const data = summary.classification[condition];
    lines.push(`| ${condition} | ${AMOUNTS.map((amount) => `${data.byAmount[amount].LOW}/${data.runs}`).join(" | ")} |`);
  }
  lines.push(
    ``,
    `## Transform Positive Control`,
    ``,
    `OK: ${summary.transform.ok}/${summary.transform.runs}`,
    ``,
    `## Reading Rule`,
    ``,
    `Support for the two-regime hypothesis is strongest when JSON transform succeeds while JSON-embedded or adjacent independence instructions do not reliably behave like the system rule.`,
    ``,
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const totalJobs = CLASSIFICATION_CONDITIONS.length * args.samples + args.samples;
  if (totalJobs > args.maxCalls) throw new Error(`Planned ${totalJobs} calls exceeds --max-calls ${args.maxCalls}`);
  const dir = runDir(args);
  await mkdir(dir, { recursive: true });
  const jobs = [];
  for (const condition of CLASSIFICATION_CONDITIONS) {
    for (let sampleIndex = 0; sampleIndex < args.samples; sampleIndex += 1) {
      jobs.push({ kind: "classification", condition, sampleIndex });
    }
  }
  for (let sampleIndex = 0; sampleIndex < args.samples; sampleIndex += 1) {
    jobs.push({ kind: "transform", condition: "json_transform_positive_control", sampleIndex });
  }
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify({ args, jobs, amounts: AMOUNTS }, null, 2)}\n`);
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(args, dir, job));
  const summary = summarize(rows);
  await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(dir, "summary.md"), mdSummary(summary));
  console.log(path.relative(ROOT, dir));
  console.log(mdSummary(summary));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
