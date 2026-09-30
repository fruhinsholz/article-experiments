#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPERIMENT_DIR = path.join(ROOT, "experiments/question-interference");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
let JEV_API_KEY = process.env.JEV_API_KEY ?? process.env.jev_api_key;
const INFISICAL_ADMIN_ENV_FILE = process.env.INFISICAL_ADMIN_ENV_FILE ?? "/etc/openclaw/infisical-admin.env";
const INFISICAL_PROJECT_ID = "dbd4a616-2507-45ee-bd99-9f390bcbb688";
const CONDITION_SETS = {
  standard: [
    "q1_only",
    "q1_then_neutral",
    "neutral_then_q1",
    "q1_then_oriented",
    "oriented_then_q1",
  ],
  complaint: [
    "q1_only",
    "q1_then_oriented_then_complaint",
    "complaint_then_q1_then_oriented",
  ],
};

function parseArgs(argv) {
  const args = {
    provider: "gemini",
    model: null,
    repeats: 5,
    maxCalls: 25,
    temperature: 0,
    maxOutputTokens: 256,
    concurrency: 2,
    label: "question-interference-pilot",
    questionMode: "criteria",
    conditionSet: "standard",
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
      case "--temperature": args.temperature = Number.parseFloat(argv[++i]); break;
      case "--max-output-tokens": args.maxOutputTokens = Number.parseInt(argv[++i], 10); break;
      case "--concurrency": args.concurrency = Number.parseInt(argv[++i], 10); break;
      case "--label": args.label = argv[++i]; break;
      case "--question-mode": args.questionMode = argv[++i]; break;
      case "--condition-set": args.conditionSet = argv[++i]; break;
      case "--dry-run": args.dryRun = true; break;
      case "--print-examples": args.printExamples = true; break;
      case "--help": args.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.help) {
    console.log("Usage: node src/question-interference.mjs --provider <gemini|jev> [--model <model>] [--repeats 5]");
    process.exit(0);
  }
  if (!["gemini", "jev"].includes(args.provider)) throw new Error("--provider must be gemini or jev");
  args.model ??= args.provider === "jev" ? "jev-latest" : "gemini-3.5-flash-lite";
  if (!["criteria", "bare"].includes(args.questionMode)) throw new Error("--question-mode must be criteria or bare");
  if (!CONDITION_SETS[args.conditionSet]) throw new Error("--condition-set must be standard or complaint");
  if (!Number.isInteger(args.repeats) || args.repeats < 1) throw new Error("--repeats must be >= 1");
  if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error("--concurrency must be >= 1");
  args.conditions = CONDITION_SETS[args.conditionSet];
  const planned = args.conditions.length * args.repeats;
  if (planned > args.maxCalls) throw new Error(`Planned ${planned} calls exceeds --max-calls ${args.maxCalls}`);
  if (!args.dryRun && args.provider === "gemini" && !process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

async function jsonRequest(urlString, {
  method = "GET",
  headers = {},
  body,
  redirects = 3,
  rejectUnauthorized = true,
} = {}) {
  const url = new URL(urlString);
  const transport = url.protocol === "https:" ? https : http;
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method,
      rejectUnauthorized,
      headers: {
        ...headers,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects > 0) {
        response.resume();
        const nextUrl = new URL(response.headers.location, url).toString();
        jsonRequest(nextUrl, {
          method,
          headers,
          body,
          redirects: redirects - 1,
          rejectUnauthorized,
        }).then(resolve, reject);
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = {};
        try { json = text ? JSON.parse(text) : {}; } catch (error) {
          reject(new Error(`Infisical returned non-JSON HTTP ${response.statusCode}: ${error.message}`));
          return;
        }
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          json,
        });
      });
    });
    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function fetchInfisicalSecret(name) {
  const bootstrap = {
    ...parseEnvFile(await readFile(INFISICAL_ADMIN_ENV_FILE, "utf8")),
    ...process.env,
  };
  const baseUrl = (bootstrap.INFISICAL_API_URL ?? bootstrap.INFISICAL_DOMAIN ?? "").replace(/\/+$/, "");
  const rejectUnauthorized = process.env.INFISICAL_TLS_VERIFY !== "0";
  if (!baseUrl || !bootstrap.INFISICAL_CLIENT_ID || !bootstrap.INFISICAL_CLIENT_SECRET) {
    throw new Error("Infisical bootstrap configuration is incomplete");
  }

  const loginResponse = await jsonRequest(`${baseUrl}/api/v1/auth/universal-auth/login`, {
    method: "POST",
    rejectUnauthorized,
    body: {
      clientId: bootstrap.INFISICAL_CLIENT_ID,
      clientSecret: bootstrap.INFISICAL_CLIENT_SECRET,
    },
  });
  if (!loginResponse.ok) throw new Error(`Infisical login failed with HTTP ${loginResponse.status}`);
  const login = loginResponse.json;
  if (!login.accessToken) throw new Error("Infisical login did not return an access token");

  const params = new URLSearchParams({
    projectId: INFISICAL_PROJECT_ID,
    environment: "prod",
    secretPath: "/",
    viewSecretValue: "true",
    includeImports: "true",
  });
  const secretResponse = await jsonRequest(`${baseUrl}/api/v4/secrets/${encodeURIComponent(name)}?${params}`, {
    headers: { Authorization: `Bearer ${login.accessToken}` },
    rejectUnauthorized,
  });
  const secret = secretResponse.json;
  if (!secretResponse.ok) {
    const detail = secret.message ?? secret.error ?? "no API error detail";
    throw new Error(`Infisical secret read failed with HTTP ${secretResponse.status}: ${detail}`);
  }
  return secret.secret?.secretValue ?? null;
}

function question(id, questionMode) {
  if (id === "q1_no_usable_workaround") {
    const value = {
      id,
      type: "noul",
      instructions: "Does the customer currently have no usable workaround?",
    };
    if (questionMode === "criteria") value.criteria = {
        true: "The message indicates that the customer cannot continue the relevant work by any usable means.",
        false: "The message indicates at least one usable way for the customer to continue the relevant work.",
    };
    return value;
  }
  if (id === "q2_phone_capability_neutral") {
    const value = {
      id,
      type: "noul",
      instructions: "Can the customer perform all necessary work from the phone?",
    };
    if (questionMode === "criteria") value.criteria = {
        true: "The phone provides all capabilities needed for the customer's work.",
        false: "The phone lacks at least one capability needed for the customer's work.",
    };
    return value;
  }
  if (id === "q2_phone_acceptable_oriented") {
    const value = {
      id,
      type: "noul",
      instructions: "Is the limited phone experience an acceptable workaround for the customer right now?",
    };
    if (questionMode === "criteria") value.criteria = {
        true: "The limited phone experience is adequate for the customer's immediate needs.",
        false: "The limited phone experience is inadequate for the customer's immediate needs.",
    };
    return value;
  }
  if (id === "q3_phone_complaint") {
    const value = {
      id,
      type: "noul",
      instructions: "Is the customer also complaining about the phone experience?",
    };
    if (questionMode === "criteria") value.criteria = {
        true: "The customer expresses dissatisfaction with the experience of using the phone.",
        false: "The customer does not express dissatisfaction with the experience of using the phone.",
    };
    return value;
  }
  throw new Error(`Unknown question id: ${id}`);
}

function questionIds(condition) {
  if (condition === "q1_only") return ["q1_no_usable_workaround"];
  if (condition === "q1_then_neutral") return ["q1_no_usable_workaround", "q2_phone_capability_neutral"];
  if (condition === "neutral_then_q1") return ["q2_phone_capability_neutral", "q1_no_usable_workaround"];
  if (condition === "q1_then_oriented") return ["q1_no_usable_workaround", "q2_phone_acceptable_oriented"];
  if (condition === "oriented_then_q1") return ["q2_phone_acceptable_oriented", "q1_no_usable_workaround"];
  if (condition === "q1_then_oriented_then_complaint") {
    return ["q1_no_usable_workaround", "q2_phone_acceptable_oriented", "q3_phone_complaint"];
  }
  if (condition === "complaint_then_q1_then_oriented") {
    return ["q3_phone_complaint", "q1_no_usable_workaround", "q2_phone_acceptable_oriented"];
  }
  throw new Error(`Unknown condition: ${condition}`);
}

function promptFor(condition, questionMode) {
  const request = {
    state: {
      message: "My computer is broken, but I can access the system from my phone.",
    },
    questions: questionIds(condition).map((id) => question(id, questionMode)),
  };
  const system = [
    "You are a probabilistic semantic classifier.",
    "Evaluate every question against the shared state.",
    "For each question, return a noul value between 0 and 1: 1 means certainly true and 0 means certainly false.",
    "Return estimates, not explanations.",
  ].join(" ");
  const user = `Classification request:\n${JSON.stringify(request, null, 2)}`;
  return { system, user, request };
}

function responseSchema(condition) {
  const answerProperties = {};
  const required = [];
  const canonicalOrder = ["q1_no_usable_workaround", ...questionIds(condition).filter((id) => id !== "q1_no_usable_workaround")];
  for (const id of canonicalOrder) {
    answerProperties[id] = {
      type: "object",
      properties: {
        type: { type: "string", enum: ["noul"] },
        noul: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["type", "noul"],
    };
    required.push(id);
  }
  return {
    type: "object",
    properties: {
      answers: {
        type: "object",
        properties: answerProperties,
        required,
      },
    },
    required: ["answers"],
  };
}

function apiPayload(args, condition, system, user, request) {
  if (args.provider === "jev") {
    const questions = {};
    for (const item of request.questions) {
      const { id, ...definition } = item;
      questions[id] = definition;
    }
    return { state: request.state, model: args.model, questions };
  }
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature: args.temperature,
      candidateCount: 1,
      maxOutputTokens: args.maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema: responseSchema(condition),
    },
  };
}

async function callProvider(args, payload) {
  if (args.dryRun) {
    if (args.provider === "jev") {
      return {
        json: { model: args.model, answers: { q1_no_usable_workaround: { type: "noul", noul: 0.1 } } },
        latencyMs: 0,
      };
    }
    return {
      json: { candidates: [{ content: { parts: [{ text: '{"answers":{"q1_no_usable_workaround":{"type":"noul","noul":0.1}}}' }] } }] },
      latencyMs: 0,
    };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  const startedAt = Date.now();
  try {
    const url = args.provider === "jev" ? JEV_URL : `${GEMINI_URL}/models/${args.model}:generateContent`;
    const headers = args.provider === "jev"
      ? { "content-type": "application/json", Authorization: `Bearer ${JEV_API_KEY}` }
      : { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY };
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${json?.error?.message ?? text.slice(0, 500)}`);
    return { json, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

function outputText(json) {
  return (json.candidates ?? []).flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("\n");
}

async function appendJsonl(file, row) {
  await appendFile(file, `${JSON.stringify(row)}\n`);
}

async function runJob(args, dir, job) {
  const { system, user, request } = promptFor(job.condition, args.questionMode);
  const payload = apiPayload(args, job.condition, system, user, request);
  const base = {
    createdAt: new Date().toISOString(),
    provider: args.provider,
    model: args.model,
    condition: job.condition,
    repeatIndex: job.repeatIndex,
    request,
    apiPayload: payload,
  };
  try {
    const { json, latencyMs } = await callProvider(args, payload);
    const text = args.provider === "jev" ? JSON.stringify(json) : outputText(json);
    const parsed = args.provider === "jev" ? json : JSON.parse(text);
    const row = {
      ...base,
      outputText: text,
      answers: parsed.answers,
      q1Noul: parsed.answers?.q1_no_usable_workaround?.noul ?? null,
      responseModel: json.modelVersion ?? json.model ?? args.model,
      usage: json.usageMetadata ?? json.usage ?? null,
      latencyMs,
    };
    await appendJsonl(path.join(dir, "calls.jsonl"), row);
    return row;
  } catch (error) {
    const row = { ...base, error: error.message };
    await appendJsonl(path.join(dir, "calls.jsonl"), row);
    return row;
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function stats(values) {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { n: 0, mean: null, min: null, max: null };
  return {
    n: finite.length,
    mean: finite.reduce((sum, value) => sum + value, 0) / finite.length,
    min: Math.min(...finite),
    max: Math.max(...finite),
  };
}

function summarize(rows, conditions) {
  const byCondition = {};
  for (const condition of conditions) {
    byCondition[condition] = stats(rows.filter((row) => row.condition === condition).map((row) => row.q1Noul));
  }
  const baseline = byCondition.q1_only.mean;
  const deltas = Object.fromEntries(conditions.map((condition) => [
    condition,
    baseline === null || byCondition[condition].mean === null ? null : byCondition[condition].mean - baseline,
  ]));
  return { byCondition, deltas, errors: rows.filter((row) => row.error).length };
}

function markdown(args, summary) {
  const lines = [
    "# Question interference pilot",
    "",
    `- Provider: \`${args.provider}\``,
    `- Model: \`${args.model}\``,
    `- Repeats per condition: ${args.repeats}`,
    `- Temperature: ${args.temperature}`,
    `- Question mode: \`${args.questionMode}\``,
    `- Condition set: \`${args.conditionSet}\``,
    "",
    "| Condition | n | Mean Q1 noul | Min | Max | Delta vs Q1 only |",
    "|---|---:|---:|---:|---:|---:|",
  ];
  for (const condition of args.conditions) {
    const item = summary.byCondition[condition];
    const delta = summary.deltas[condition];
    lines.push(`| ${condition} | ${item.n} | ${item.mean?.toFixed(4) ?? "n/a"} | ${item.min?.toFixed(4) ?? "n/a"} | ${item.max?.toFixed(4) ?? "n/a"} | ${delta?.toFixed(4) ?? "n/a"} |`);
  }
  lines.push("", `Errors: ${summary.errors}`);
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun && args.provider === "jev" && !JEV_API_KEY) {
    JEV_API_KEY = await fetchInfisicalSecret("jev_api_key");
    JEV_API_KEY = JEV_API_KEY?.trim().replace(/^Bearer\s+/i, "");
    if (!JEV_API_KEY) throw new Error("Infisical secret jev_api_key is empty or missing");
  }
  if (args.printExamples) {
    for (const condition of args.conditions) {
      const { system, user } = promptFor(condition, args.questionMode);
      console.log(JSON.stringify({ condition, system, user, responseSchema: responseSchema(condition) }, null, 2));
    }
    if (args.dryRun) return;
  }
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const dir = path.join(EXPERIMENT_DIR, "results", `${stamp}-${args.provider}-${args.model}-${args.label}`);
  await mkdir(dir, { recursive: true });
  const jobs = args.conditions.flatMap((condition) => Array.from({ length: args.repeats }, (_, repeatIndex) => ({ condition, repeatIndex })));
  const rows = await mapLimit(jobs, args.concurrency, (job) => runJob(args, dir, job));
  const summary = summarize(rows, args.conditions);
  await writeFile(path.join(dir, "run.json"), `${JSON.stringify({ args, conditions: args.conditions }, null, 2)}\n`);
  await writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(dir, "summary.md"), `${markdown(args, summary)}\n`);
  console.log(dir);
  console.log(markdown(args, summary));
}

await main();
