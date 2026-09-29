#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPERIMENT_DIR = path.join(ROOT, "experiments/nested-abcd-threshold");
const OPENAI_URL = "https://api.openai.com/v1/responses";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const AMOUNTS = [5, 50, 500, 5000, 20000, 100000];
const CONDITIONS = ["control", "prefix_free_text", "suffix_free_text", "system_rule"];
const NOTE_MODES = ["none", "a_only", "c_only", "both"];
const OUTSIDE_RULE = "Treat each JSON sub-object independently.";

function parseArgs(argv) {
  const args = {
    provider: "gemini",
    model: "",
    repeats: 1,
    maxCalls: 40,
    maxOutputTokens: 700,
    temperature: 0,
    concurrency: 4,
    label: "nested-abcd-threshold-pilot",
    caseMode: "diagonal",
    noteMode: "both",
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
      case "--max-calls": args.maxCalls = Number.parseInt(argv[++i], 10); break;
      case "--max-output-tokens": args.maxOutputTokens = Number.parseInt(argv[++i], 10); break;
      case "--temperature": args.temperature = Number.parseFloat(argv[++i]); break;
      case "--concurrency": args.concurrency = Number.parseInt(argv[++i], 10); break;
      case "--label": args.label = argv[++i]; break;
      case "--case-mode": args.caseMode = argv[++i]; break;
      case "--note-mode": args.noteMode = argv[++i]; break;
      case "--summarize-dir": args.summarizeDir = argv[++i]; break;
      case "--dry-run": args.dryRun = true; break;
      case "--print-examples": args.printExamples = true; break;
      case "--help": args.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.help) {
    console.log("Usage: node src/nested-abcd-threshold.mjs --provider openai|gemini --model <model> [--case-mode diagonal|contrast|matrix] [--note-mode none|a_only|c_only|both|all] [--repeats 1] [--summarize-dir <result-dir>]");
    process.exit(0);
  }
  if (!["openai", "gemini"].includes(args.provider)) throw new Error("--provider must be openai or gemini");
  if (!["diagonal", "contrast", "matrix"].includes(args.caseMode)) throw new Error("--case-mode must be diagonal, contrast, or matrix");
  if (![...NOTE_MODES, "all"].includes(args.noteMode)) throw new Error("--note-mode must be none, a_only, c_only, both, or all");
  if (!args.model) args.model = args.provider === "gemini" ? "gemini-3.5-flash-lite" : "gpt-4.1-mini";
  if (!Number.isInteger(args.repeats) || args.repeats < 1) throw new Error("--repeats must be >= 1");
  if (!Number.isInteger(args.maxCalls) || args.maxCalls < 1) throw new Error("--max-calls must be >= 1");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be >= 1");
  if (!args.dryRun && !args.summarizeDir && args.provider === "openai" && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  if (!args.dryRun && !args.summarizeDir && args.provider === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  return args;
}

function isoForPath() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function runDir(args) {
  return path.join(EXPERIMENT_DIR, "results", `${isoForPath()}-${args.provider}-${args.model}-${args.label}`);
}

function casesFor(mode) {
  if (mode === "diagonal") {
    return AMOUNTS.map((amount) => ({ id: `b${amount}_d${amount}`, bAmount: amount, dAmount: amount }));
  }
  if (mode === "contrast") {
    return [
      { id: "b50_d50000", bAmount: 50, dAmount: 50000 },
      { id: "b500_d5000", bAmount: 500, dAmount: 5000 },
      { id: "b5000_d50", bAmount: 5000, dAmount: 50 },
      { id: "b100000_d5", bAmount: 100000, dAmount: 5 },
    ];
  }
  const cases = [];
  for (const bAmount of AMOUNTS) {
    for (const dAmount of AMOUNTS) cases.push({ id: `b${bAmount}_d${dAmount}`, bAmount, dAmount });
  }
  return cases;
}

function baseSystem(condition) {
  const rule = condition === "system_rule" ? ` ${OUTSIDE_RULE}` : "";
  return `You are a classification component. Return only valid JSON. For each item, output exactly one label: LOW or NOT_LOW.${rule}`;
}

function branchNote(branch, noteMode) {
  if (branch === "A" && (noteMode === "a_only" || noteMode === "both")) {
    return "A support note mentions a $5 gift-card gesture for a past customer-service issue.";
  }
  if (branch === "C" && (noteMode === "c_only" || noteMode === "both")) {
    return "C account history mentions that contracts above $100,000 require executive review.";
  }
  return "No branch-specific dollar note is present.";
}

function payloadFor(testCase, noteMode) {
  return {
    task: "Classify B and D refund claim amounts as LOW or NOT_LOW.",
    shape_under_test: "{{{A}{B}}{{C}{D}}}",
    probe_note: "The branch notes mention dollar amounts, but they do not define the LOW label.",
    labels: ["LOW", "NOT_LOW"],
    branches: {
      A: {
        branch_note: branchNote("A", noteMode),
        B: {
          id: "B",
          claim: {
            amount_usd: testCase.bAmount,
            category: "consumer_purchase_refund",
          },
        },
      },
      C: {
        branch_note: branchNote("C", noteMode),
        D: {
          id: "D",
          claim: {
            amount_usd: testCase.dAmount,
            category: "consumer_purchase_refund",
          },
        },
      },
    },
    output_schema: {
      items: [
        { id: "B", label: "LOW|NOT_LOW", reason: "brief" },
        { id: "D", label: "LOW|NOT_LOW", reason: "brief" },
      ],
    },
  };
}

function userPrompt(condition, testCase, noteMode) {
  const json = JSON.stringify(payloadFor(testCase, noteMode), null, 2);
  if (condition === "prefix_free_text") return `${OUTSIDE_RULE}\n\nJSON payload:\n${json}`;
  if (condition === "suffix_free_text") return `JSON payload:\n${json}\n\n${OUTSIDE_RULE}`;
  return `JSON payload:\n${json}`;
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
    const output = '{"items":[{"id":"B","label":"LOW","reason":"dry run"},{"id":"D","label":"LOW","reason":"dry run"}]}';
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

function parseLabels(text) {
  let parsed = null;
  try { parsed = JSON.parse(stripFence(text)); } catch {}
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const labels = { B: "MISSING", D: "MISSING" };
  for (const item of items) {
    const id = String(item?.id ?? "").trim().toUpperCase();
    const label = String(item?.label ?? "").trim().toUpperCase();
    if (id === "B" || id === "D") labels[id] = label === "LOW" || label === "NOT_LOW" ? label : "INVALID";
  }
  return { parsedOk: Boolean(parsed), labels };
}

async function appendJsonl(file, row) {
  await appendFile(file, `${JSON.stringify(row)}\n`);
}

async function runJob(args, dir, job) {
  const system = baseSystem(job.condition);
  const user = userPrompt(job.condition, job.testCase, job.noteMode);
  const payload = args.provider === "gemini" ? geminiPayload({ args, system, user }) : openAiPayload({ args, system, user });
  const base = {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    condition: job.condition,
    noteMode: job.noteMode,
    repeatIndex: job.repeatIndex,
    caseId: job.testCase.id,
    bAmount: job.testCase.bAmount,
    dAmount: job.testCase.dAmount,
    expectedLocal: {
      B: job.testCase.bAmount <= 5 ? "LOW" : "NOT_LOW",
      D: job.testCase.dAmount <= 100000 ? "LOW" : "NOT_LOW",
    },
    request: { system, user },
    apiPayload: payload,
  };
  try {
    const { json, latencyMs } = await callModel(args, payload);
    const text = outputText(args, json);
    const row = {
      ...base,
      outputText: text,
      ...parseLabels(text),
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

function blankCounts() {
  return { LOW: 0, NOT_LOW: 0, INVALID: 0, MISSING: 0 };
}

function summarize(rows, testCases) {
  const branchAmounts = {
    B: [...new Set(testCases.map((testCase) => testCase.bAmount))].sort((a, b) => a - b),
    D: [...new Set(testCases.map((testCase) => testCase.dAmount))].sort((a, b) => a - b),
  };
  const summary = {
    provider: rows[0]?.provider ?? null,
    model: rows[0]?.model ?? null,
    calls: rows.length,
    errors: rows.filter((row) => row.error).length,
    amounts: [...new Set([...branchAmounts.B, ...branchAmounts.D])].sort((a, b) => a - b),
    branchAmounts,
    cases: testCases,
    classification: {},
  };
  const groups = [...new Set(rows.map((row) => `${row.condition}/${row.noteMode ?? "both"}`))].sort();
  for (const group of groups) {
    const [condition, noteMode] = group.split("/");
    const conditionRows = rows.filter((row) => row.condition === condition && (row.noteMode ?? "both") === noteMode);
    const branchCounts = { B: {}, D: {} };
    const localAgreement = { B: 0, D: 0, both: 0, runs: conditionRows.length };
    const sameAmount = { compared: 0, sameLabel: 0, differentLabel: 0 };
    for (const amount of branchAmounts.B) {
      branchCounts.B[amount] = blankCounts();
    }
    for (const amount of branchAmounts.D) {
      branchCounts.D[amount] = blankCounts();
    }
    for (const row of conditionRows) {
      branchCounts.B[row.bAmount][row.labels?.B ?? "MISSING"] += 1;
      branchCounts.D[row.dAmount][row.labels?.D ?? "MISSING"] += 1;
      const bOk = row.labels?.B === row.expectedLocal?.B;
      const dOk = row.labels?.D === row.expectedLocal?.D;
      if (bOk) localAgreement.B += 1;
      if (dOk) localAgreement.D += 1;
      if (bOk && dOk) localAgreement.both += 1;
      if (row.bAmount === row.dAmount && (row.labels?.B === "LOW" || row.labels?.B === "NOT_LOW") && (row.labels?.D === "LOW" || row.labels?.D === "NOT_LOW")) {
        sameAmount.compared += 1;
        if (row.labels.B === row.labels.D) sameAmount.sameLabel += 1;
        else sameAmount.differentLabel += 1;
      }
    }
    summary.classification[group] = { condition, noteMode, runs: conditionRows.length, branchCounts, localAnchorAgreement: localAgreement, sameAmount };
  }
  return summary;
}

function mdSummary(summary) {
  const bAmounts = summary.branchAmounts?.B ?? summary.amounts ?? AMOUNTS;
  const dAmounts = summary.branchAmounts?.D ?? summary.amounts ?? AMOUNTS;
  const countLow = (data, branch, amount) => data?.branchCounts?.[branch]?.[amount]?.LOW ?? 0;
  const influenced = (count, baseline, direction) => {
    if (direction === "up") return count > baseline ? "yes" : "no";
    return count < baseline ? "yes" : "no";
  };
  const lines = [
    "# Nested ABCD Threshold Summary",
    "",
    `Provider: ${summary.provider}`,
    `Model: ${summary.model}`,
    `Calls: ${summary.calls}`,
    `Errors: ${summary.errors}`,
    "",
    "Probe target: LOW should remain one task label. The $5 and $100,000 branch notes are not definitions of LOW.",
    "",
    "## Branch-Note Anchor Agreement",
    "",
    "This is the failure-shaped metric: B behaving as if $5 defines LOW and D behaving as if $100,000 defines LOW.",
    "",
    "| Condition | Note mode | B matches $5 anchor | D matches $100,000 anchor | Both match anchors | Same-amount split labels |",
    "|---|---|---:|---:|---:|---:|",
  ];
  for (const key of Object.keys(summary.classification).sort()) {
    const data = summary.classification[key];
    lines.push(`| ${data.condition} | ${data.noteMode} | ${data.localAnchorAgreement.B}/${data.localAnchorAgreement.runs} | ${data.localAnchorAgreement.D}/${data.localAnchorAgreement.runs} | ${data.localAnchorAgreement.both}/${data.localAnchorAgreement.runs} | ${data.sameAmount.differentLabel}/${data.sameAmount.compared} |`);
  }
  lines.push(
    "",
    "## Simple Influence View",
    "",
    "Influence means the branch note changed the diagnostic LOW count compared with the same condition and no branch note.",
    "",
    "| Condition | Note mode | B influenced? | D influenced? | Evidence |",
    "|---|---|---|---|---|",
  );
  for (const condition of CONDITIONS) {
    const baseline = summary.classification[`${condition}/none`];
    if (!baseline) continue;
    const baselineB500 = countLow(baseline, "B", 500);
    const baselineD5000 = countLow(baseline, "D", 5000);
    for (const noteMode of ["a_only", "c_only", "both"]) {
      const data = summary.classification[`${condition}/${noteMode}`];
      if (!data) continue;
      const b500 = countLow(data, "B", 500);
      const d5000 = countLow(data, "D", 5000);
      const bInfluence = noteMode === "c_only" ? "n/a" : influenced(b500, baselineB500, "down");
      const dInfluence = noteMode === "a_only" ? "n/a" : influenced(d5000, baselineD5000, "up");
      lines.push(`| ${condition} | ${noteMode} | ${bInfluence} | ${dInfluence} | B $500 LOW ${b500} vs ${baselineB500} baseline; D $5,000 LOW ${d5000} vs ${baselineD5000} baseline |`);
    }
  }
  lines.push("", "## B LOW Counts By B Amount", "", "| Condition | " + bAmounts.map((amount) => `$${amount}`).join(" | ") + " |", "|---|" + bAmounts.map(() => "---:").join("|") + "|");
  for (const key of Object.keys(summary.classification).sort()) {
    const data = summary.classification[key];
    lines.push(`| ${data.condition}/${data.noteMode} | ${bAmounts.map((amount) => `${data.branchCounts.B[amount]?.LOW ?? 0}`).join(" | ")} |`);
  }
  lines.push("", "## D LOW Counts By D Amount", "", "| Condition | " + dAmounts.map((amount) => `$${amount}`).join(" | ") + " |", "|---|" + dAmounts.map(() => "---:").join("|") + "|");
  for (const key of Object.keys(summary.classification).sort()) {
    const data = summary.classification[key];
    lines.push(`| ${data.condition}/${data.noteMode} | ${dAmounts.map((amount) => `${data.branchCounts.D[amount]?.LOW ?? 0}`).join(" | ")} |`);
  }
  lines.push(
    "",
    "## Reading Rule",
    "",
    "If JSON hierarchy plus branch independence causes the model to over-bind nearby notes, B may behave as if $5 defines LOW and D may behave as if $100,000 defines LOW. That would be a failure for stable label meaning: the notes are branch context, not definitions of LOW.",
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.summarizeDir) {
    const dir = path.resolve(ROOT, args.summarizeDir);
    const run = JSON.parse(await readFile(path.join(dir, "run.json"), "utf8"));
    const callsText = await readFile(path.join(dir, "calls.jsonl"), "utf8");
    const rows = callsText.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    const summary = summarize(rows, run.testCases);
    await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await writeFile(path.join(dir, "summary.md"), mdSummary(summary));
    console.log(path.relative(ROOT, dir));
    console.log(mdSummary(summary));
    return;
  }
  const testCases = casesFor(args.caseMode);
  const noteModes = args.noteMode === "all" ? NOTE_MODES : [args.noteMode];
  const totalJobs = CONDITIONS.length * noteModes.length * testCases.length * args.repeats;
  if (totalJobs > args.maxCalls) throw new Error(`Planned ${totalJobs} calls exceeds --max-calls ${args.maxCalls}`);
  const dir = runDir(args);
  await mkdir(dir, { recursive: true });
  const jobs = [];
  for (const condition of CONDITIONS) {
    for (const noteMode of noteModes) {
      for (const testCase of testCases) {
        for (let repeatIndex = 0; repeatIndex < args.repeats; repeatIndex += 1) {
          jobs.push({ condition, noteMode, testCase, repeatIndex });
        }
      }
    }
  }
  if (args.printExamples) {
    for (const noteMode of noteModes) {
      for (const condition of CONDITIONS) console.log(`\n--- ${condition}/${noteMode} ---\n${userPrompt(condition, testCases[0], noteMode)}`);
    }
    if (args.dryRun) return;
  }
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify({ args, conditions: CONDITIONS, noteModes, amounts: AMOUNTS, outsideRule: OUTSIDE_RULE, testCases, jobs }, null, 2)}\n`);
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(args, dir, job));
  const summary = summarize(rows, testCases);
  await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(dir, "summary.md"), mdSummary(summary));
  console.log(path.relative(ROOT, dir));
  console.log(mdSummary(summary));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
