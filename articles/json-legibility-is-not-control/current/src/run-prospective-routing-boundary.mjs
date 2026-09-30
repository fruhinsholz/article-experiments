#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STIMULI_PATH = path.join(ROOT, "stimuli.v1.json");
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
let JEV_API_KEY = process.env.JEV_API_KEY ?? process.env.jev_api_key;
let GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.gemini_api_key;

function parseArgs(argv) {
  const args = {
    provider: "jev",
    model: null,
    repeats: 2,
    maxCalls: 30,
    concurrency: 3,
    label: "refined-phase-a-technical-pilot",
    includeRejected: true,
    dryRun: false,
    seed: null,
    stimuliFile: STIMULI_PATH,
    confirmatory: false,
    retries: 0,
    retryDelayMs: 500,
    temperature: 0,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--provider") args.provider = argv[++index];
    else if (arg === "--model") args.model = argv[++index];
    else if (arg === "--repeats") args.repeats = Number.parseInt(argv[++index], 10);
    else if (arg === "--max-calls") args.maxCalls = Number.parseInt(argv[++index], 10);
    else if (arg === "--concurrency") args.concurrency = Number.parseInt(argv[++index], 10);
    else if (arg === "--label") args.label = argv[++index];
    else if (arg === "--seed") args.seed = Number.parseInt(argv[++index], 10);
    else if (arg === "--stimuli-file") args.stimuliFile = path.resolve(ROOT, argv[++index]);
    else if (arg === "--accepted-only") args.includeRejected = false;
    else if (arg === "--confirmatory") args.confirmatory = true;
    else if (arg === "--retries") args.retries = Number.parseInt(argv[++index], 10);
    else if (arg === "--retry-delay-ms") args.retryDelayMs = Number.parseInt(argv[++index], 10);
    else if (arg === "--temperature") args.temperature = Number.parseFloat(argv[++index]);
    else if (arg === "--dry-run") args.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(args.repeats) || args.repeats < 1) throw new Error("--repeats must be >= 1");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be >= 1");
  if (!Number.isInteger(args.retries) || args.retries < 0) throw new Error("--retries must be >= 0");
  if (!Number.isInteger(args.retryDelayMs) || args.retryDelayMs < 0) throw new Error("--retry-delay-ms must be >= 0");
  if (!["jev", "gemini"].includes(args.provider)) throw new Error("--provider must be jev or gemini");
  if (!Number.isFinite(args.temperature) || args.temperature < 0) throw new Error("--temperature must be >= 0");
  args.model ??= args.provider === "jev" ? "jev-latest" : "gemini-3.5-flash-lite";
  return args;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(values, random) {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(random() * (index + 1));
    [output[index], output[selected]] = [output[selected], output[index]];
  }
  return output;
}

function selectedFamilies(stimuli, includeRejected) {
  return Object.entries(stimuli.keyFamilies)
    .filter(([, family]) => family.validationStatus === "reference" || family.validationStatus === "accepted" || includeRejected)
    .map(([name]) => name);
}

function buildJobs(stimuli, args) {
  const seed = args.seed ?? stimuli.randomization.seed;
  const random = mulberry32(seed);
  const cells = Object.keys(stimuli.states).flatMap((state) => selectedFamilies(stimuli, args.includeRejected).map((family) => ({ state, family })));
  const semanticOrders = stimuli.randomization.semanticOrders ?? [["full", "partial", "none"]];
  return Array.from({ length: args.repeats }, (_, block) => {
    const semanticOrder = semanticOrders[block % semanticOrders.length];
    return shuffle(cells, random).map((cell, blockOrder) => ({
      ...cell,
      block,
      blockOrder,
      semanticOrder,
    }));
  }).flat().map((job, executionIndex) => ({
    ...job,
    executionIndex,
    jobId: `block-${String(job.block + 1).padStart(2, "0")}-${String(job.blockOrder + 1).padStart(2, "0")}`,
  }));
}

function payloadFor(stimuli, args, job) {
  const family = stimuli.keyFamilies[job.family];
  const criteria = Object.fromEntries(job.semanticOrder.map((semantic) => [family[semantic], stimuli.descriptions[semantic]]));
  const instructions = [stimuli.question, stimuli.instructionSuffix].filter(Boolean).join(" ");
  const request = {
    state: { message: stimuli.states[job.state] },
    questions: {
      work_ability: {
        type: "choice",
        instructions,
        criteria,
      },
    },
  };
  if (args.provider === "jev") return { ...request, model: args.model };
  const keys = Object.values(family).filter((value) => typeof value === "string" && value !== family.validationStatus);
  const probabilityProperties = Object.fromEntries(keys.map((key) => [key, { type: "number", minimum: 0, maximum: 1 }]));
  return {
    systemInstruction: { parts: [{ text: [
      "You are a probabilistic semantic classifier.",
      "Evaluate the choice question against the state and its criteria.",
      "Return one selected choice key and a probability estimate for every choice key.",
      "The probabilities must sum to 1.",
      "Return estimates, not explanations.",
    ].join(" ") }] },
    contents: [{ role: "user", parts: [{ text: `Classification request:\n${JSON.stringify(request, null, 2)}` }] }],
    generationConfig: {
      temperature: args.temperature,
      candidateCount: 1,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          answers: {
            type: "object",
            properties: {
              work_ability: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["choice"] },
                  choice: { type: "string", enum: keys },
                  probabilities: { type: "object", properties: probabilityProperties, required: keys },
                },
                required: ["type", "choice", "probabilities"],
              },
            },
            required: ["work_ability"],
          },
        },
        required: ["answers"],
      },
    },
  };
}

function outputText(json) {
  return (json.candidates ?? []).flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("\n");
}

async function callProvider(args, payload) {
  if (args.dryRun) {
    const criteria = args.provider === "jev"
      ? payload.questions.work_ability.criteria
      : JSON.parse(payload.contents[0].parts[0].text.split("\n").slice(1).join("\n")).questions.work_ability.criteria;
    const keys = Object.keys(criteria);
    const answer = { answers: { work_ability: { type: "choice", choice: keys[1], probabilities: { [keys[0]]: 0.1, [keys[1]]: 0.8, [keys[2]]: 0.1 } } } };
    if (args.provider === "jev") return { json: { model: args.model, ...answer, usage: { input_tokens: 0, output_tokens: 0 } }, latencyMs: 0 };
    return { json: { modelVersion: args.model, candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }], usageMetadata: {} }, latencyMs: 0 };
  }
  const startedAt = Date.now();
  const url = args.provider === "jev" ? JEV_URL : `${GEMINI_URL}/models/${args.model}:generateContent`;
  const headers = args.provider === "jev"
    ? { "content-type": "application/json", Authorization: `Bearer ${JEV_API_KEY}` }
    : { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY };
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${json?.detail?.message ?? json?.error?.message ?? text.slice(0, 500)}`);
  return { json, latencyMs: Date.now() - startedAt };
}

async function callProviderWithRetry(args, payload) {
  const attemptLog = [];
  for (let attempt = 0; ; attempt += 1) {
    try {
      const result = await callProvider(args, payload);
      attemptLog.push({ attempt: attempt + 1, completedAt: new Date().toISOString(), outcome: "success" });
      return { ...result, requestAttempts: attempt + 1, attemptLog };
    } catch (error) {
      const retryable = /^HTTP (429|503|529):/.test(error.message);
      attemptLog.push({ attempt: attempt + 1, completedAt: new Date().toISOString(), outcome: "error", retryable, error: error.message });
      if (!retryable || attempt >= args.retries) {
        error.attemptLog = attemptLog;
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, args.retryDelayMs * (attempt + 1)));
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const current = next++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function semanticProbabilities(stimuli, familyName, probabilities = {}) {
  const family = stimuli.keyFamilies[familyName];
  return Object.fromEntries(["full", "partial", "none"].map((semantic) => [semantic, probabilities[family[semantic]] ?? null]));
}

function semanticSelection(stimuli, familyName, choice) {
  const family = stimuli.keyFamilies[familyName];
  return ["full", "partial", "none"].find((semantic) => family[semantic] === choice) ?? "unknown";
}

async function runJob(stimuli, args, directory, job) {
  const apiPayload = payloadFor(stimuli, args, job);
  const base = { createdAt: new Date().toISOString(), ...job, validationStatus: stimuli.keyFamilies[job.family].validationStatus, apiPayload };
  try {
    const { json, latencyMs, requestAttempts, attemptLog } = await callProviderWithRetry(args, apiPayload);
    const parsed = args.provider === "jev" ? json : JSON.parse(outputText(json));
    const answer = parsed.answers?.work_ability;
    const probabilities = semanticProbabilities(stimuli, job.family, answer?.probabilities);
    const reviewScore = Number.isFinite(probabilities.partial) && Number.isFinite(probabilities.none) ? probabilities.partial + probabilities.none : null;
    const row = {
      ...base,
      provider: args.provider,
      responseModel: json.modelVersion ?? json.model ?? args.model,
      answer,
      semanticSelection: semanticSelection(stimuli, job.family, answer?.choice),
      semanticProbabilities: probabilities,
      reviewScore,
      applicationBranch: reviewScore === null ? null : reviewScore >= stimuli.applicationPolicy.reviewIfPartialPlusNoneAtLeast ? stimuli.applicationPolicy.reviewBranch : stimuli.applicationPolicy.automaticBranch,
      usage: json.usageMetadata ?? json.usage,
      latencyMs,
      requestAttempts,
      attemptLog,
      rawResponse: json,
    };
    await appendFile(path.join(directory, "calls.jsonl"), `${JSON.stringify(row)}\n`);
    return row;
  } catch (error) {
    const row = { ...base, error: error.message, attemptLog: error.attemptLog ?? [] };
    await appendFile(path.join(directory, "calls.jsonl"), `${JSON.stringify(row)}\n`);
    return row;
  }
}

function stats(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return { n: 0, mean: null, min: null, max: null };
  return { n: finite.length, mean: finite.reduce((sum, value) => sum + value, 0) / finite.length, min: Math.min(...finite), max: Math.max(...finite) };
}

function counts(values) {
  return Object.fromEntries(Object.entries(values.reduce((result, value) => {
    result[value ?? "unknown"] = (result[value ?? "unknown"] ?? 0) + 1;
    return result;
  }, {})).sort());
}

function summarize(stimuli, args, rows) {
  const byCell = {};
  for (const state of Object.keys(stimuli.states)) {
    byCell[state] = {};
    for (const family of selectedFamilies(stimuli, args.includeRejected)) {
      const cell = rows.filter((row) => row.state === state && row.family === family && !row.error);
      byCell[state][family] = {
        n: cell.length,
        validationStatus: stimuli.keyFamilies[family].validationStatus,
        responseModels: counts(cell.map((row) => row.responseModel)),
        probabilities: Object.fromEntries(["full", "partial", "none"].map((semantic) => [semantic, stats(cell.map((row) => row.semanticProbabilities[semantic]))])),
        reviewScore: stats(cell.map((row) => row.reviewScore)),
        selected: counts(cell.map((row) => row.semanticSelection)),
        branches: counts(cell.map((row) => row.applicationBranch)),
      };
    }
  }
  const deltasVsNeutral = Object.fromEntries(Object.entries(byCell).map(([state, families]) => {
    const baselineName = families.neutral ? "neutral" : Object.keys(families)[0];
    const baseline = families[baselineName];
    return [state, Object.fromEntries(Object.entries(families).map(([family, cell]) => [family, {
      full: cell.probabilities.full.mean === null || baseline.probabilities.full.mean === null ? null : cell.probabilities.full.mean - baseline.probabilities.full.mean,
      partial: cell.probabilities.partial.mean === null || baseline.probabilities.partial.mean === null ? null : cell.probabilities.partial.mean - baseline.probabilities.partial.mean,
      none: cell.probabilities.none.mean === null || baseline.probabilities.none.mean === null ? null : cell.probabilities.none.mean - baseline.probabilities.none.mean,
      reviewScore: cell.reviewScore.mean === null || baseline.reviewScore.mean === null ? null : cell.reviewScore.mean - baseline.reviewScore.mean,
    }]))];
  }));
  return { provider: args.provider, confirmatory: args.confirmatory, byCell, deltasVsBaseline: deltasVsNeutral, errors: rows.filter((row) => row.error).length };
}

function markdown(args, summary) {
  const lines = [
    args.confirmatory ? "# Refined Phase A confirmatory run" : "# Refined Phase A technical pilot",
    "",
    args.confirmatory ? "This run is the preregistered confirmatory Phase A execution." : "This run is non-confirmatory and excluded from preregistered evidence.",
    "",
    `- Provider: \`${args.provider}\``,
    `- Model requested: \`${args.model}\``,
    `- Repeats per cell: ${args.repeats}`,
    `- Errors: ${summary.errors}`,
    "",
    "| State | Family | Status | n | P(full) | P(partial) | P(none) | Review score | Selected | Branches |",
    "|---|---|---|---:|---:|---:|---:|---:|---|---|",
  ];
  for (const [state, families] of Object.entries(summary.byCell)) {
    for (const [family, cell] of Object.entries(families)) {
      lines.push(`| ${state} | ${family} | ${cell.validationStatus} | ${cell.n} | ${cell.probabilities.full.mean?.toFixed(4) ?? "n/a"} | ${cell.probabilities.partial.mean?.toFixed(4) ?? "n/a"} | ${cell.probabilities.none.mean?.toFixed(4) ?? "n/a"} | ${cell.reviewScore.mean?.toFixed(4) ?? "n/a"} | ${JSON.stringify(cell.selected)} | ${JSON.stringify(cell.branches)} |`);
    }
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const stimuliText = await readFile(args.stimuliFile, "utf8");
  const stimuli = JSON.parse(stimuliText);
  const jobs = buildJobs(stimuli, args);
  if (jobs.length > args.maxCalls) throw new Error(`Planned ${jobs.length} calls exceeds --max-calls ${args.maxCalls}`);
  if (!args.dryRun && args.provider === "jev" && !JEV_API_KEY) {
    throw new Error("JEV_API_KEY is required for a live Jev run");
  }
  if (!args.dryRun && args.provider === "gemini" && !GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for a live Gemini run");
  }
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const directory = path.join(path.dirname(args.stimuliFile), "results", `${stamp}-${args.provider}-${args.model}-${args.label}`);
  await mkdir(directory, { recursive: true });
  const runnerText = await readFile(fileURLToPath(import.meta.url), "utf8");
  const sha256 = (text) => createHash("sha256").update(text).digest("hex");
  const frozenRun = {
    createdAt: new Date().toISOString(),
    status: "planned",
    args,
    sourceHashes: {
      stimuliSha256: sha256(stimuliText),
      runnerSha256: sha256(runnerText),
    },
    stimuli,
    jobs,
  };
  await writeFile(path.join(directory, "run.json"), `${JSON.stringify(frozenRun, null, 2)}\n`);
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(stimuli, args, directory, job));
  const summary = summarize(stimuli, args, rows);
  await writeFile(path.join(directory, "run.json"), `${JSON.stringify({ ...frozenRun, completedAt: new Date().toISOString(), status: "completed" }, null, 2)}\n`);
  await writeFile(path.join(directory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(directory, "summary.md"), `${markdown(args, summary)}\n`);
  console.log(directory);
  console.log(markdown(args, summary));
}

await main();
