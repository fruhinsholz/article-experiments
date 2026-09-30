#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPERIMENT_DIR = path.join(ROOT, "experiments/choice-label-contamination");
const STIMULI_PATH = path.join(EXPERIMENT_DIR, "refined-stimuli.v1.json");
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const INFISICAL_ADMIN_ENV_FILE = process.env.INFISICAL_ADMIN_ENV_FILE ?? "/etc/openclaw/infisical-admin.env";
const INFISICAL_PROJECT_ID = "dbd4a616-2507-45ee-bd99-9f390bcbb688";
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

function parseEnvFile(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

async function jsonRequest(urlString, { method = "GET", headers = {}, body, redirects = 3, rejectUnauthorized = true } = {}) {
  const url = new URL(urlString);
  const transport = url.protocol === "https:" ? https : http;
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method,
      rejectUnauthorized,
      headers: { ...headers, ...(payload ? { "Content-Type": "application/json" } : {}) },
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects > 0) {
        response.resume();
        jsonRequest(new URL(response.headers.location, url).toString(), { method, headers, body, redirects: redirects - 1, rejectUnauthorized }).then(resolve, reject);
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = {};
        try { json = text ? JSON.parse(text) : {}; } catch (error) { reject(new Error(`Non-JSON HTTP ${response.statusCode}: ${error.message}`)); return; }
        resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode, json });
      });
    });
    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function fetchInfisicalSecret(name) {
  const bootstrap = { ...parseEnvFile(await readFile(INFISICAL_ADMIN_ENV_FILE, "utf8")), ...process.env };
  const baseUrl = (bootstrap.INFISICAL_API_URL ?? bootstrap.INFISICAL_DOMAIN ?? "").replace(/\/+$/, "");
  const rejectUnauthorized = process.env.INFISICAL_TLS_VERIFY !== "0";
  if (!baseUrl || !bootstrap.INFISICAL_CLIENT_ID || !bootstrap.INFISICAL_CLIENT_SECRET) throw new Error("Infisical bootstrap configuration is incomplete");
  const loginResponse = await jsonRequest(`${baseUrl}/api/v1/auth/universal-auth/login`, {
    method: "POST",
    rejectUnauthorized,
    body: { clientId: bootstrap.INFISICAL_CLIENT_ID, clientSecret: bootstrap.INFISICAL_CLIENT_SECRET },
  });
  if (!loginResponse.ok || !loginResponse.json.accessToken) throw new Error(`Infisical login failed with HTTP ${loginResponse.status}`);
  const params = new URLSearchParams({ projectId: INFISICAL_PROJECT_ID, environment: "prod", secretPath: "/", viewSecretValue: "true", includeImports: "true" });
  const secretResponse = await jsonRequest(`${baseUrl}/api/v4/secrets/${encodeURIComponent(name)}?${params}`, {
    headers: { Authorization: `Bearer ${loginResponse.json.accessToken}` },
    rejectUnauthorized,
  });
  if (!secretResponse.ok) throw new Error(`Infisical secret read failed with HTTP ${secretResponse.status}`);
  return secretResponse.json.secret?.secretValue ?? null;
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
  return Array.from({ length: args.repeats }, (_, block) => shuffle(cells, random).map((cell, blockOrder) => ({ ...cell, block, blockOrder }))).flat();
}

function payloadFor(stimuli, args, job) {
  const family = stimuli.keyFamilies[job.family];
  const criteria = Object.fromEntries(["full", "partial", "none"].map((semantic) => [family[semantic], stimuli.descriptions[semantic]]));
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
  for (let attempt = 0; ; attempt += 1) {
    try {
      return { ...(await callProvider(args, payload)), requestAttempts: attempt + 1 };
    } catch (error) {
      const retryable = /^HTTP (429|503|529):/.test(error.message);
      if (!retryable || attempt >= args.retries) throw error;
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
    const { json, latencyMs, requestAttempts } = await callProviderWithRetry(args, apiPayload);
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
      rawResponse: json,
    };
    await appendFile(path.join(directory, "calls.jsonl"), `${JSON.stringify(row)}\n`);
    return row;
  } catch (error) {
    const row = { ...base, error: error.message };
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
    const baseline = families.neutral;
    return [state, Object.fromEntries(Object.entries(families).map(([family, cell]) => [family, {
      full: cell.probabilities.full.mean === null || baseline.probabilities.full.mean === null ? null : cell.probabilities.full.mean - baseline.probabilities.full.mean,
      partial: cell.probabilities.partial.mean === null || baseline.probabilities.partial.mean === null ? null : cell.probabilities.partial.mean - baseline.probabilities.partial.mean,
      none: cell.probabilities.none.mean === null || baseline.probabilities.none.mean === null ? null : cell.probabilities.none.mean - baseline.probabilities.none.mean,
      reviewScore: cell.reviewScore.mean === null || baseline.reviewScore.mean === null ? null : cell.reviewScore.mean - baseline.reviewScore.mean,
    }]))];
  }));
  return { provider: args.provider, confirmatory: args.confirmatory, byCell, deltasVsNeutral, errors: rows.filter((row) => row.error).length };
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
  const stimuli = JSON.parse(await readFile(args.stimuliFile, "utf8"));
  const jobs = buildJobs(stimuli, args);
  if (jobs.length > args.maxCalls) throw new Error(`Planned ${jobs.length} calls exceeds --max-calls ${args.maxCalls}`);
  if (!args.dryRun && args.provider === "jev" && !JEV_API_KEY) {
    JEV_API_KEY = (await fetchInfisicalSecret("jev_api_key"))?.trim().replace(/^Bearer\s+/i, "");
    if (!JEV_API_KEY) throw new Error("Infisical secret jev_api_key is empty or missing");
  }
  if (!args.dryRun && args.provider === "gemini" && !GEMINI_API_KEY) {
    for (const name of ["GEMINI_API_KEY", "gemini_api_key"]) {
      try {
        GEMINI_API_KEY = (await fetchInfisicalSecret(name))?.trim();
      } catch {}
      if (GEMINI_API_KEY) break;
    }
    if (!GEMINI_API_KEY) throw new Error("Gemini API key is empty or missing");
  }
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const directory = path.join(EXPERIMENT_DIR, "results", `${stamp}-${args.provider}-${args.model}-${args.label}`);
  await mkdir(directory, { recursive: true });
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(stimuli, args, directory, job));
  const summary = summarize(stimuli, args, rows);
  await writeFile(path.join(directory, "run.json"), `${JSON.stringify({ args, stimuli, jobs }, null, 2)}\n`);
  await writeFile(path.join(directory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(directory, "summary.md"), `${markdown(args, summary)}\n`);
  console.log(directory);
  console.log(markdown(args, summary));
}

await main();
