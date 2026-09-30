#!/usr/bin/env node
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";

const CONTEXTS = [
  {
    id: "draft_grouping",
    consequence: "group two draft-writing notes for later reading; no external action occurs",
  },
  {
    id: "internal_alert",
    consequence: "reuse one internal monitoring alert rule; a wrong decision pages an engineer but does not affect customers",
  },
  {
    id: "customer_notification",
    consequence: "reuse one customer-facing notification rule; a wrong decision sends the wrong message to customers",
  },
  {
    id: "billing_rule",
    consequence: "reuse one billing rule; a wrong decision changes when customers are charged",
  },
  {
    id: "access_rule",
    consequence: "reuse one access-control rule; a wrong decision grants or denies administrative access",
  },
];

function parseArgs(argv) {
  const args = {
    provider: "gemini",
    model: "",
    samples: 20,
    maxCalls: 100,
    maxOutputTokens: 500,
    temperature: 0,
    concurrency: 4,
    label: "similar-enough-context",
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
    console.log("Usage: node src/similar-enough-context.mjs --provider openai|gemini --model <model> [--samples 20] [--max-calls 100]");
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
  return path.join(ROOT, "experiments/similar-enough-context/results", `${isoForPath()}-${args.provider}-${args.model}-${args.label}`);
}

function systemPrompt() {
  return [
    "You are a classification component.",
    "Return only valid JSON.",
    "Use exactly one decision label for the pair: SAME_RULE, NEEDS_REVIEW, or DIFFERENT_RULE.",
  ].join(" ");
}

function userPrompt(context) {
  const payload = {
    task: "Decide whether the two rules are similar enough to reuse the same operational rule.",
    context: {
      consequence: context.consequence,
      threshold_word_under_test: "similar enough",
      explicit_numeric_tolerance: null,
    },
    pair: {
      a: "Send a warning when usage reaches 80%.",
      b: "Send a warning when usage reaches 95%.",
    },
    output_schema: {
      decision: "SAME_RULE|NEEDS_REVIEW|DIFFERENT_RULE",
      risk: "low|medium|high",
      reason: "brief",
    },
  };
  return `JSON payload:\n${JSON.stringify(payload, null, 2)}`;
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
  if (args.dryRun) {
    const output = '{"decision":"NEEDS_REVIEW","risk":"medium","reason":"dry run"}';
    if (args.provider === "gemini") {
      return { json: { candidates: [{ content: { parts: [{ text: output }] } }] }, latencyMs: 0 };
    }
    return { json: { output_text: output }, latencyMs: 0 };
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

function parseDecision(text) {
  let parsed = null;
  try { parsed = JSON.parse(stripFence(text)); } catch {}
  const decision = String(parsed?.decision ?? "").trim().toUpperCase();
  const risk = String(parsed?.risk ?? "").trim().toLowerCase();
  return {
    parsedOk: Boolean(parsed),
    decision: ["SAME_RULE", "NEEDS_REVIEW", "DIFFERENT_RULE"].includes(decision) ? decision : "INVALID",
    risk: ["low", "medium", "high"].includes(risk) ? risk : "invalid",
  };
}

async function appendJsonl(file, row) {
  await appendFile(file, `${JSON.stringify(row)}\n`);
}

async function runJob(args, dir, job) {
  const context = CONTEXTS.find((item) => item.id === job.contextId);
  const system = systemPrompt();
  const user = userPrompt(context);
  const payload = args.provider === "gemini" ? geminiPayload({ args, system, user }) : openAiPayload({ args, system, user });
  const base = {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    contextId: job.contextId,
    sampleIndex: job.sampleIndex,
    request: { system, user },
    apiPayload: payload,
  };
  try {
    const { json, latencyMs } = await callModel(args, payload);
    const text = outputText(args, json);
    const row = {
      ...base,
      outputText: text,
      ...parseDecision(text),
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
    contexts: {},
  };
  for (const context of CONTEXTS) {
    const contextRows = rows.filter((row) => row.contextId === context.id);
    const counts = {
      SAME_RULE: 0,
      NEEDS_REVIEW: 0,
      DIFFERENT_RULE: 0,
      INVALID: 0,
      risks: { low: 0, medium: 0, high: 0, invalid: 0 },
    };
    for (const row of contextRows) {
      counts[row.decision ?? "INVALID"] = (counts[row.decision ?? "INVALID"] ?? 0) + 1;
      counts.risks[row.risk ?? "invalid"] = (counts.risks[row.risk ?? "invalid"] ?? 0) + 1;
    }
    summary.contexts[context.id] = {
      consequence: context.consequence,
      runs: contextRows.length,
      ...counts,
    };
  }
  return summary;
}

function mdSummary(summary) {
  const lines = [
    "# Similar Enough Context Summary",
    "",
    `Provider: ${summary.provider}`,
    `Model: ${summary.model}`,
    `Calls: ${summary.calls}`,
    `Errors: ${summary.errors}`,
    "",
    "Fixed pair: `80% usage warning` vs `95% usage warning`.",
    "",
    "| Context | SAME_RULE | NEEDS_REVIEW | DIFFERENT_RULE | High risk |",
    "|---|---:|---:|---:|---:|",
  ];
  for (const context of CONTEXTS) {
    const data = summary.contexts[context.id];
    lines.push(`| ${context.id} | ${data.SAME_RULE}/${data.runs} | ${data.NEEDS_REVIEW}/${data.runs} | ${data.DIFFERENT_RULE}/${data.runs} | ${data.risks.high}/${data.runs} |`);
  }
  lines.push(
    "",
    "## Reading Rule",
    "",
    "This measures whether the implicit threshold behind `similar enough` moves when only the operational consequence changes.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const totalJobs = CONTEXTS.length * args.samples;
  if (totalJobs > args.maxCalls) throw new Error(`Planned ${totalJobs} calls exceeds --max-calls ${args.maxCalls}`);
  const dir = runDir(args);
  await mkdir(dir, { recursive: true });
  const jobs = [];
  for (const context of CONTEXTS) {
    for (let sampleIndex = 0; sampleIndex < args.samples; sampleIndex += 1) {
      jobs.push({ contextId: context.id, sampleIndex });
    }
  }
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify({ args, jobs, contexts: CONTEXTS }, null, 2)}\n`);
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
