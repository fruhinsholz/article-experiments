#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPERIMENT_DIR = path.join(ROOT, "experiments/similar-enough-record-context");
const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";

function parseArgs(argv) {
  const args = {
    provider: "gemini",
    model: "",
    repeats: 5,
    maxCalls: 200,
    maxOutputTokens: 700,
    temperature: 0,
    concurrency: 4,
    label: "similar-enough-record-context",
    recordsFile: "records.json",
    conditionsFile: "conditions.json",
    dryRun: false,
    printExamples: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--provider": args.provider = argv[++i]; break;
      case "--model": args.model = argv[++i]; break;
      case "--repeats": args.repeats = Number.parseInt(argv[++i], 10); break;
      case "--max-calls": args.maxCalls = Number.parseInt(argv[++i], 10); break;
      case "--max-output-tokens": args.maxOutputTokens = Number.parseInt(argv[++i], 10); break;
      case "--temperature": args.temperature = Number.parseFloat(argv[++i]); break;
      case "--concurrency": args.concurrency = Number.parseInt(argv[++i], 10); break;
      case "--label": args.label = argv[++i]; break;
      case "--records-file": args.recordsFile = argv[++i]; break;
      case "--conditions-file": args.conditionsFile = argv[++i]; break;
      case "--dry-run": args.dryRun = true; break;
      case "--print-examples": args.printExamples = true; break;
      case "--help": args.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.help) {
    console.log("Usage: node src/similar-enough-record-context.mjs --provider openai|gemini --model <model> [--repeats 5] [--max-calls 200] [--records-file records.json] [--conditions-file conditions.json]");
    process.exit(0);
  }
  if (!["openai", "gemini"].includes(args.provider)) throw new Error("--provider must be openai or gemini");
  if (!args.model) args.model = args.provider === "gemini" ? "gemini-3.5-flash-lite" : "gpt-4.1-mini";
  if (!Number.isInteger(args.repeats) || args.repeats < 1) throw new Error("--repeats must be >= 1");
  if (!Number.isInteger(args.maxCalls) || args.maxCalls < 1) throw new Error("--max-calls must be >= 1");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be >= 1");
  if (!args.dryRun && args.provider === "openai" && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  if (!args.dryRun && args.provider === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  return args;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function isoForPath() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function runDir(args) {
  return path.join(EXPERIMENT_DIR, "results", `${isoForPath()}-${args.provider}-${args.model}-${args.label}`);
}

function systemPrompt() {
  return [
    "You are a record classification component.",
    "Return only valid JSON.",
    "Use exactly one decision label: same_record, possible_duplicate, or new_record.",
  ].join(" ");
}

function userPrompt(pair, condition) {
  const payload = {
    task: condition.request,
    ambient_context: condition.ambient_context,
    threshold_phrase_under_test: "similar enough",
    records: {
      record_a: pair.record_a,
      record_b: pair.record_b,
    },
    output_schema: {
      decision: "same_record|possible_duplicate|new_record",
      confidence: "low|medium|high",
      key_fields: ["field ids that most influenced the decision"],
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
    const output = '{"decision":"possible_duplicate","confidence":"medium","key_fields":["field_5"],"reason":"dry run"}';
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
  const decision = String(parsed?.decision ?? "").trim().toLowerCase();
  const confidence = String(parsed?.confidence ?? "").trim().toLowerCase();
  const keyFields = Array.isArray(parsed?.key_fields) ? parsed.key_fields.map(String) : [];
  return {
    parsedOk: Boolean(parsed),
    decision: ["same_record", "possible_duplicate", "new_record"].includes(decision) ? decision : "invalid",
    confidence: ["low", "medium", "high"].includes(confidence) ? confidence : "invalid",
    keyFields,
  };
}

async function appendJsonl(file, row) {
  await appendFile(file, `${JSON.stringify(row)}\n`);
}

async function runJob(args, dir, fixtures, job) {
  const pair = fixtures.records.pairs.find((item) => item.id === job.pairId);
  const condition = fixtures.conditions.conditions.find((item) => item.id === job.conditionId);
  const system = systemPrompt();
  const user = userPrompt(pair, condition);
  const payload = args.provider === "gemini" ? geminiPayload({ args, system, user }) : openAiPayload({ args, system, user });
  const base = {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    pairId: job.pairId,
    conditionId: job.conditionId,
    conditionKind: condition.kind,
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

function summarize(rows, fixtures) {
  const summary = {
    provider: rows[0]?.provider ?? null,
    model: rows[0]?.model ?? null,
    calls: rows.length,
    errors: rows.filter((row) => row.error).length,
    pairMap: fixtures.records.private_pair_map_for_analysis,
    conditionMap: fixtures.conditions.private_condition_map_for_analysis,
    byPairAndCondition: {},
  };
  for (const pair of fixtures.records.pairs) {
    summary.byPairAndCondition[pair.id] = {};
    for (const condition of fixtures.conditions.conditions) {
      const scoped = rows.filter((row) => row.pairId === pair.id && row.conditionId === condition.id);
      const counts = {
        same_record: 0,
        possible_duplicate: 0,
        new_record: 0,
        invalid: 0,
        confidence: { low: 0, medium: 0, high: 0, invalid: 0 },
        keyFields: {},
      };
      for (const row of scoped) {
        counts[row.decision ?? "invalid"] = (counts[row.decision ?? "invalid"] ?? 0) + 1;
        counts.confidence[row.confidence ?? "invalid"] = (counts.confidence[row.confidence ?? "invalid"] ?? 0) + 1;
        for (const field of row.keyFields ?? []) {
          counts.keyFields[field] = (counts.keyFields[field] ?? 0) + 1;
        }
      }
      summary.byPairAndCondition[pair.id][condition.id] = {
        runs: scoped.length,
        ...counts,
      };
    }
  }
  return summary;
}

function mdSummary(summary, fixtures) {
  const lines = [
    "# Similar Enough Record Context Summary",
    "",
    `Provider: ${summary.provider}`,
    `Model: ${summary.model}`,
    `Calls: ${summary.calls}`,
    `Errors: ${summary.errors}`,
    "",
    "## Decision Counts",
    "",
    "| Step | Changed fields | Prompt | Context | same_record | possible_duplicate | new_record | top key fields |",
    "|---:|---|---|---|---:|---:|---:|---|",
  ];
  for (const pair of fixtures.records.pairs) {
    const pairLabel = fixtures.records.private_pair_map_for_analysis[pair.id];
    for (const condition of fixtures.conditions.conditions) {
      const conditionLabel = fixtures.conditions.private_condition_map_for_analysis[condition.id];
      const data = summary.byPairAndCondition[pair.id][condition.id];
      const topFields = Object.entries(data.keyFields)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([field, count]) => `${field}:${count}`)
        .join(", ");
      lines.push(`| ${pairLabel.step} | ${(pairLabel.changed_fields ?? []).join(", ") || "none"} | ${conditionLabel.prompt} | ${conditionLabel.context} | ${data.same_record}/${data.runs} | ${data.possible_duplicate}/${data.runs} | ${data.new_record}/${data.runs} | ${topFields || "-"} |`);
    }
  }
  lines.push(
    "",
    "## Fixture IDs",
    "",
    "Record pair IDs and condition IDs are opaque in prompts and logs. The human-readable maps are included in `run.json` and `summary.json` for analysis.",
    "",
    "## Reading Rule",
    "",
    "Compare each pair across conditions. A decision flip on the same fixed records is the primary context-influence signal.",
    "A confidence shift on the same fixed records is a secondary context-influence signal.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function loadFixtures(args) {
  return {
    records: await readJson(path.join(EXPERIMENT_DIR, args.recordsFile)),
    conditions: await readJson(path.join(EXPERIMENT_DIR, args.conditionsFile)),
  };
}

function buildJobs(fixtures, repeats) {
  const jobs = [];
  for (const pair of fixtures.records.pairs) {
    for (const condition of fixtures.conditions.conditions) {
      for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex += 1) {
        jobs.push({ pairId: pair.id, conditionId: condition.id, repeatIndex });
      }
    }
  }
  return jobs;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = await loadFixtures(args);
  const jobs = buildJobs(fixtures, args.repeats);
  if (jobs.length > args.maxCalls) throw new Error(`Planned ${jobs.length} calls exceeds --max-calls ${args.maxCalls}`);
  if (args.printExamples) {
    const system = systemPrompt();
    const pair = fixtures.records.pairs[0];
    for (const condition of fixtures.conditions.conditions) {
      console.log(`\n=== ${pair.id} / ${condition.id} ===\n`);
      console.log(system);
      console.log(userPrompt(pair, condition));
    }
    return;
  }
  const dir = runDir(args);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify({ args, jobs, fixtures }, null, 2)}\n`);
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(args, dir, fixtures, job));
  const summary = summarize(rows, fixtures);
  await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(dir, "summary.md"), mdSummary(summary, fixtures));
  console.log(path.relative(ROOT, dir));
  console.log(mdSummary(summary, fixtures));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
