#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPERIMENT_DIR = path.join(ROOT, "experiments/choice-label-contamination");
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const INFISICAL_ADMIN_ENV_FILE = process.env.INFISICAL_ADMIN_ENV_FILE ?? "/etc/openclaw/infisical-admin.env";
const INFISICAL_PROJECT_ID = "dbd4a616-2507-45ee-bd99-9f390bcbb688";
let JEV_API_KEY = process.env.JEV_API_KEY ?? process.env.jev_api_key;

const DESCRIPTIONS = {
  full: "The customer can perform all necessary work.",
  partial: "The customer can perform some, but not all, necessary work.",
  none: "The customer cannot perform any necessary work.",
};

const LABEL_CONDITIONS = {
  neutral: {
    criteria: { A: DESCRIPTIONS.full, B: DESCRIPTIONS.partial, C: DESCRIPTIONS.none },
    semanticKeys: { full: "A", partial: "B", none: "C" },
  },
  aligned: {
    criteria: {
      fully_operational: DESCRIPTIONS.full,
      partially_blocked: DESCRIPTIONS.partial,
      fully_blocked: DESCRIPTIONS.none,
    },
    semanticKeys: { full: "fully_operational", partial: "partially_blocked", none: "fully_blocked" },
  },
  conflicting: {
    criteria: {
      blocked: DESCRIPTIONS.full,
      working: DESCRIPTIONS.partial,
      unaffected: DESCRIPTIONS.none,
    },
    semanticKeys: { full: "blocked", partial: "working", none: "unaffected" },
  },
};

const PERMUTATIONS = [
  ["full", "partial", "none"],
  ["full", "none", "partial"],
  ["partial", "full", "none"],
  ["partial", "none", "full"],
  ["none", "full", "partial"],
  ["none", "partial", "full"],
];

function permutationConditions(keys, prefix = "permutation") {
  return Object.fromEntries(PERMUTATIONS.map((semantics, index) => {
    const criteria = Object.fromEntries(keys.map((key, position) => [key, DESCRIPTIONS[semantics[position]]]));
    const semanticKeys = Object.fromEntries(keys.map((key, position) => [semantics[position], key]));
    return [`${prefix}_${index + 1}_${semantics.join("_")}`, { criteria, semanticKeys }];
  }));
}

const PERMUTATION_CONDITIONS = permutationConditions(["fully_operational", "partially_blocked", "fully_blocked"]);
const NEUTRAL_PERMUTATION_CONDITIONS = permutationConditions(["A", "B", "C"], "neutral_permutation");

function conditionsFor(args) {
  if (args.conditionSet === "permutations") return PERMUTATION_CONDITIONS;
  if (args.conditionSet === "neutral-permutations") return NEUTRAL_PERMUTATION_CONDITIONS;
  return LABEL_CONDITIONS;
}

function parseArgs(argv) {
  const args = { model: "jev-latest", repeats: 5, maxCalls: 15, concurrency: 3, label: "choice-label-pilot", stateMode: "ambiguous", conditionSet: "labels", dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--model") args.model = argv[++index];
    else if (arg === "--repeats") args.repeats = Number.parseInt(argv[++index], 10);
    else if (arg === "--max-calls") args.maxCalls = Number.parseInt(argv[++index], 10);
    else if (arg === "--concurrency") args.concurrency = Number.parseInt(argv[++index], 10);
    else if (arg === "--label") args.label = argv[++index];
    else if (arg === "--state-mode") args.stateMode = argv[++index];
    else if (arg === "--condition-set") args.conditionSet = argv[++index];
    else if (arg === "--dry-run") args.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(args.repeats) || args.repeats < 1) throw new Error("--repeats must be >= 1");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be >= 1");
  if (!["ambiguous", "explicit_partial"].includes(args.stateMode)) throw new Error("--state-mode must be ambiguous or explicit_partial");
  if (!["labels", "permutations", "neutral-permutations"].includes(args.conditionSet)) throw new Error("--condition-set must be labels, permutations, or neutral-permutations");
  const planned = Object.keys(conditionsFor(args)).length * args.repeats;
  if (planned > args.maxCalls) throw new Error(`Planned ${planned} calls exceeds --max-calls ${args.maxCalls}`);
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
    method: "POST", rejectUnauthorized,
    body: { clientId: bootstrap.INFISICAL_CLIENT_ID, clientSecret: bootstrap.INFISICAL_CLIENT_SECRET },
  });
  if (!loginResponse.ok || !loginResponse.json.accessToken) throw new Error(`Infisical login failed with HTTP ${loginResponse.status}`);
  const params = new URLSearchParams({ projectId: INFISICAL_PROJECT_ID, environment: "prod", secretPath: "/", viewSecretValue: "true", includeImports: "true" });
  const secretResponse = await jsonRequest(`${baseUrl}/api/v4/secrets/${encodeURIComponent(name)}?${params}`, {
    headers: { Authorization: `Bearer ${loginResponse.json.accessToken}` }, rejectUnauthorized,
  });
  if (!secretResponse.ok) throw new Error(`Infisical secret read failed with HTTP ${secretResponse.status}`);
  return secretResponse.json.secret?.secretValue ?? null;
}

function payloadFor(args, conditions, condition) {
  const message = args.stateMode === "ambiguous"
    ? "My computer is broken, but I can access the system from my phone."
    : "My computer is broken. I can use my phone, but only for basic tasks.";
  return {
    state: { message },
    model: args.model,
    questions: {
      work_ability: {
        type: "choice",
        instructions: "Which description best represents the customer's current ability to work? Choice names are arbitrary identifiers; use only their descriptions.",
        criteria: conditions[condition].criteria,
      },
    },
  };
}

async function callJev(args, payload) {
  if (args.dryRun) {
    const keys = Object.keys(payload.questions.work_ability.criteria);
    return { json: { model: args.model, answers: { work_ability: { type: "choice", choice: keys[1], confidence: 0.8, probabilities: { [keys[0]]: 0.1, [keys[1]]: 0.8, [keys[2]]: 0.1 } } }, usage: { input_tokens: 0, output_tokens: 0 } }, latencyMs: 0 };
  }
  const startedAt = Date.now();
  const response = await fetch(JEV_URL, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${JEV_API_KEY}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${json?.detail?.message ?? text.slice(0, 500)}`);
  return { json, latencyMs: Date.now() - startedAt };
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

function semanticProbabilities(conditions, condition, probabilities = {}) {
  const keys = conditions[condition].semanticKeys;
  return Object.fromEntries(Object.entries(keys).map(([semantic, key]) => [semantic, probabilities[key] ?? null]));
}

async function runJob(args, conditions, directory, job) {
  const apiPayload = payloadFor(args, conditions, job.condition);
  const base = { createdAt: new Date().toISOString(), condition: job.condition, repeatIndex: job.repeatIndex, apiPayload };
  try {
    const { json, latencyMs } = await callJev(args, apiPayload);
    const answer = json.answers?.work_ability;
    const row = { ...base, responseModel: json.model, answer, semanticProbabilities: semanticProbabilities(conditions, job.condition, answer?.probabilities), usage: json.usage, latencyMs };
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

function summarize(conditions, rows) {
  const byCondition = {};
  for (const condition of Object.keys(conditions)) {
    const conditionRows = rows.filter((row) => row.condition === condition && !row.error);
    byCondition[condition] = {
      full: stats(conditionRows.map((row) => row.semanticProbabilities.full)),
      partial: stats(conditionRows.map((row) => row.semanticProbabilities.partial)),
      none: stats(conditionRows.map((row) => row.semanticProbabilities.none)),
      selected: Object.fromEntries(Object.entries(conditionRows.reduce((counts, row) => {
        const selected = Object.entries(conditions[condition].semanticKeys).find(([, key]) => key === row.answer?.choice)?.[0] ?? "unknown";
        counts[selected] = (counts[selected] ?? 0) + 1;
        return counts;
      }, {})).sort()),
    };
  }
  const baselineCondition = Object.keys(conditions)[0];
  const baseline = byCondition[baselineCondition].partial.mean;
  return {
    byCondition,
    baselineCondition,
    partialProbabilityDeltaVsBaseline: Object.fromEntries(Object.entries(byCondition).map(([condition, value]) => [condition, baseline === null || value.partial.mean === null ? null : value.partial.mean - baseline])),
    errors: rows.filter((row) => row.error).length,
  };
}

function markdown(args, conditions, summary) {
  const invariants = args.conditionSet.endsWith("permutations")
    ? [
        "- State, question, key vocabulary, key order, and description set are constant.",
        "- Only the assignment of descriptions to keys changes; all six assignments are tested.",
      ]
    : [
        "- State, question, descriptions, and description order are constant.",
        "- Only the choice keys change.",
      ];
  const lines = [
    "# Choice-label contamination pilot",
    "",
    `- Model requested: \`${args.model}\``,
    `- Repeats per condition: ${args.repeats}`,
    `- State mode: \`${args.stateMode}\``,
    `- Condition set: \`${args.conditionSet}\``,
    ...invariants,
    "",
    `- Probability-delta baseline: \`${summary.baselineCondition}\``,
    "",
    "| Condition | n | P(full) | P(partial) | P(none) | Partial delta vs baseline | Selected |",
    "|---|---:|---:|---:|---:|---:|---|",
  ];
  for (const condition of Object.keys(conditions)) {
    const item = summary.byCondition[condition];
    lines.push(`| ${condition} | ${item.partial.n} | ${item.full.mean?.toFixed(4) ?? "n/a"} | ${item.partial.mean?.toFixed(4) ?? "n/a"} | ${item.none.mean?.toFixed(4) ?? "n/a"} | ${summary.partialProbabilityDeltaVsBaseline[condition]?.toFixed(4) ?? "n/a"} | ${JSON.stringify(item.selected)} |`);
  }
  lines.push("", `Errors: ${summary.errors}`);
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const conditions = conditionsFor(args);
  if (!args.dryRun && !JEV_API_KEY) {
    JEV_API_KEY = (await fetchInfisicalSecret("jev_api_key"))?.trim().replace(/^Bearer\s+/i, "");
    if (!JEV_API_KEY) throw new Error("Infisical secret jev_api_key is empty or missing");
  }
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const directory = path.join(EXPERIMENT_DIR, "results", `${stamp}-jev-${args.model}-${args.label}`);
  await mkdir(directory, { recursive: true });
  const jobs = Object.keys(conditions).flatMap((condition) => Array.from({ length: args.repeats }, (_, repeatIndex) => ({ condition, repeatIndex })));
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(args, conditions, directory, job));
  const summary = summarize(conditions, rows);
  await writeFile(path.join(directory, "run.json"), `${JSON.stringify({ args, conditions }, null, 2)}\n`);
  await writeFile(path.join(directory, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(directory, "summary.md"), `${markdown(args, conditions, summary)}\n`);
  console.log(directory);
  console.log(markdown(args, conditions, summary));
}

await main();
