#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  appendJsonl,
  buildGeminiPayload,
  buildOpenAiPayload,
  callGemini,
  callOpenAI,
  classifyLabel,
  extractGeminiOutputText,
  extractOutputText,
  hashJson,
  maybeWriteGzip,
  modelsFromArgs,
  pct,
  prepareRunDir,
  summarizeRows,
  usage,
  validateCommonArgs,
  writePromptFiles,
  parseCommonArgs,
} from "./shared/harness.mjs";

const ALLOWED = ["ENOUGH", "NOT_ENOUGH"];
const SYSTEM_PROMPT = `You are a classification component. Use only the provided evidence signal scores. Do not invent a sufficiency threshold. Return only the requested label.`;
const SIGNAL_NAMES = ["Identity match", "Purchase record", "Delivery evidence", "Customer statement", "Account history", "Device consistency", "Timing consistency", "Prior dispute pattern", "Supporting document", "Policy match"];

function extraOptions() {
  return `  --mode <average|passing|contract|both|all>
                              Search mode. Defaults to contract.
  --average-scan <a,b,c>      Initial average-score scan points.
  --passing-score <n>         Score used for passing signals. Defaults to 8.
  --failing-score <n>         Score used for non-passing signals. Defaults to 3.
  --pass-threshold <n>        Metadata threshold for passing-count mode. Defaults to 7.
  --strong-score <n>          Score for strong evidence in contract mode. Defaults to 10.
  --inactive-score <n>        Score for inactive evidence in contract mode. Defaults to 1.
  --converge-width <n>        Stop continuous binary search when band is this narrow. Defaults to 0.1.
`;
}

function parseArgs(argv) {
  return parseCommonArgs(argv, { mode: "contract", averageScan: null, passingScore: 8, failingScore: 3, passThreshold: 7, strongScore: 10, inactiveScore: 1, convergeWidth: 0.1, label: "enough" }, (args, raw, i) => {
    switch (raw[i]) {
      case "--mode": args.mode = raw[i + 1]; return i + 1;
      case "--average-scan": args.averageScan = raw[i + 1]; return i + 1;
      case "--passing-score": args.passingScore = Number.parseFloat(raw[i + 1]); return i + 1;
      case "--failing-score": args.failingScore = Number.parseFloat(raw[i + 1]); return i + 1;
      case "--pass-threshold": args.passThreshold = Number.parseFloat(raw[i + 1]); return i + 1;
      case "--strong-score": args.strongScore = Number.parseFloat(raw[i + 1]); return i + 1;
      case "--inactive-score": args.inactiveScore = Number.parseFloat(raw[i + 1]); return i + 1;
      case "--converge-width": args.convergeWidth = Number.parseFloat(raw[i + 1]); return i + 1;
      default: return false;
    }
  });
}

function modes(args) {
  if (args.mode === "both") return ["average", "passing"];
  if (args.mode === "contract") return ["evidence_count", "quality"];
  if (args.mode === "all") return ["average", "passing", "evidence_count", "quality"];
  if (["average", "passing", "evidence_count", "quality"].includes(args.mode)) return [args.mode];
  throw new Error("--mode must be average, passing, evidence_count, quality, contract, both, or all.");
}

function averageScanPoints(args) {
  const points = args.averageScan
    ? args.averageScan.split(",").map((v) => Number.parseFloat(v.trim()))
    : [0, 2, 4, 5, 6, 7, 8, 9, 10];
  return [...new Set(points.filter((n) => Number.isFinite(n) && n >= 0 && n <= 10))].sort((a, b) => a - b);
}

function vectorForCandidate({ mode, value, args }) {
  if (mode === "average") return Array.from({ length: 10 }, () => Number(value.toFixed(2)));
  if (mode === "evidence_count") {
    const activeCount = Number(value);
    return Array.from({ length: 10 }, (_, index) => index < activeCount ? args.strongScore : args.inactiveScore);
  }
  if (mode === "quality") {
    const score = Number(value);
    const activeCount = args.activeEvidenceCount ?? 10;
    return Array.from({ length: 10 }, (_, index) => index < activeCount ? Number(score.toFixed(2)) : args.inactiveScore);
  }
  const passingCount = Number(value);
  return Array.from({ length: 10 }, (_, index) => index < passingCount ? args.passingScore : args.failingScore);
}

function rotateVector(vector, offset) {
  if (!offset) return vector;
  return vector.map((_, index) => vector[(index + offset) % vector.length]);
}

function average(vector) {
  return Number((vector.reduce((sum, value) => sum + value, 0) / vector.length).toFixed(3));
}

function passingCount(vector, args) {
  return vector.filter((value) => value >= args.passThreshold).length;
}

function userPrompt(vector) {
  const signals = vector.map((score, index) => `${index + 1}. ${SIGNAL_NAMES[index]}: ${score}/10`).join("\n");
  return `A case has 10 evidence signals. Each signal is scored from 0 to 10.\n\nSignals:\n${signals}\n\nClassify whether the evidence is sufficient as exactly one label:\nENOUGH\nNOT_ENOUGH\n\nReturn only the label.`;
}

function dryRunLabel(vector) {
  return average(vector) >= 7 && vector.filter((value) => value >= 7).length >= 7 ? "ENOUGH" : "NOT_ENOUGH";
}

async function runOne({ args, runDir, model, mode, candidateValue, vector, epoch, candidateKind, sampleIndex }) {
  const user = userPrompt(vector);
  const metadata = { testbed: "enough", mode, candidate_value: String(candidateValue), epoch: String(epoch) };
  const payload = args.provider === "gemini" ? buildGeminiPayload({
    model,
    system: SYSTEM_PROMPT,
    user,
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    reasoningEffort: args.reasoningEffort,
    seed: args.seed,
    metadata,
  }) : buildOpenAiPayload({
    model,
    system: SYSTEM_PROMPT,
    user,
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    reasoningEffort: args.reasoningEffort,
    seed: args.seed,
    metadata,
  });

  const base = {
    type: "completion",
    createdAt: new Date().toISOString(),
    testbed: "enough",
    model,
    mode,
    candidateValue,
    averageScore: average(vector),
    passingCount: passingCount(vector, args),
    vector,
    vectorHash: hashJson(vector),
    epoch,
    candidateKind,
    sampleIndex,
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    seed: Number.isInteger(args.seed) ? args.seed : null,
    fixtureHash: hashJson({ mode, candidateValue, vector, user }),
    request: payload,
  };

  if (args.dryRun) {
    const outputText = dryRunLabel(vector);
    const parsed = classifyLabel(outputText, ALLOWED);
    const row = { ...base, dryRun: true, outputText, ...parsed, responseModel: model, usage: null, latencyMs: 0 };
    await appendJsonl(path.join(runDir, "calls.jsonl"), row);
    return row;
  }

  try {
    const { json, latencyMs } = args.provider === "gemini"
      ? await callGemini({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY, payload })
      : await callOpenAI({ apiKey: process.env.OPENAI_API_KEY, payload });
    const outputText = args.provider === "gemini" ? extractGeminiOutputText(json) : extractOutputText(json);
    const outputTokens = json.usage?.output_tokens ?? json.usageMetadata?.candidatesTokenCount ?? 0;
    const reasoningTokens = json.usage?.output_tokens_details?.reasoning_tokens ?? json.usageMetadata?.thoughtsTokenCount ?? 0;
    const outputTruncated = json.status === "incomplete" && json.incomplete_details?.reason === "max_output_tokens"
      || json.candidates?.some((candidate) => candidate.finishReason === "MAX_TOKENS")
      || outputText.trim() === "" && outputTokens >= args.maxOutputTokens && reasoningTokens >= args.maxOutputTokens;
    const parsed = classifyLabel(outputText, ALLOWED);
    const row = {
      ...base,
      outputText,
      ...parsed,
      responseId: json.id ?? null,
      responseModel: json.model ?? json.modelVersion ?? model,
      systemFingerprint: json.system_fingerprint ?? null,
      usage: json.usage ?? json.usageMetadata ?? null,
      latencyMs,
      outputTruncated,
    };
    await appendJsonl(path.join(runDir, "calls.jsonl"), row);
    return row;
  } catch (error) {
    const row = { ...base, label: "INVALID", strictLabel: "INVALID", error: error.message, errorStatus: error.status ?? null };
    await appendJsonl(path.join(runDir, "calls.jsonl"), row);
    return row;
  }
}

async function sampleCandidate(ctx, candidate) {
  const rows = [];
  for (let sampleIndex = 0; sampleIndex < ctx.args.samples; sampleIndex += 1) {
    ctx.callCount += 1;
    if (ctx.callCount > ctx.args.maxCalls) throw new Error(`Refusing to exceed --max-calls ${ctx.args.maxCalls}.`);
    const vector = candidate.vectorFactory ? candidate.vectorFactory(sampleIndex) : candidate.vector;
    rows.push(await runOne({ ...ctx, ...candidate, vector, sampleIndex }));
  }
  return rows;
}

function count(rows, label) {
  return rows.filter((row) => row.label === label).length;
}

function majority(rows) {
  return count(rows, "ENOUGH") > count(rows, "NOT_ENOUGH") ? "ENOUGH" : "NOT_ENOUGH";
}

function findInitialBand(byValue) {
  const points = [...byValue.keys()].sort((a, b) => a - b);
  for (let i = 1; i < points.length; i += 1) {
    const previous = byValue.get(points[i - 1]);
    const current = byValue.get(points[i]);
    if (majority(previous) === "NOT_ENOUGH" && majority(current) === "ENOUGH") return { low: points[i - 1], high: points[i] };
  }
  const firstEnough = points.find((point) => majority(byValue.get(point)) === "ENOUGH");
  if (firstEnough !== undefined) return { low: points[0], high: firstEnough };
  return { low: points.at(-2) ?? points[0], high: points.at(-1) ?? points[0] };
}

function candidateMajority(rows) {
  const enough = count(rows, "ENOUGH");
  const notEnough = count(rows, "NOT_ENOUGH");
  if (enough === notEnough) return "TIE";
  return enough > notEnough ? "ENOUGH" : "NOT_ENOUGH";
}

function evidenceCountVectorFactory(candidateValue, args) {
  const base = vectorForCandidate({ mode: "evidence_count", value: candidateValue, args });
  return (sampleIndex) => rotateVector(base, sampleIndex % base.length);
}

function qualityVectorFactory(candidateValue, activeEvidenceCount, args) {
  const base = vectorForCandidate({ mode: "quality", value: candidateValue, args: { ...args, activeEvidenceCount } });
  return (sampleIndex) => rotateVector(base, sampleIndex % base.length);
}

function summarizeCandidate(rows) {
  return {
    label: candidateMajority(rows),
    total: rows.length,
    enough: count(rows, "ENOUGH"),
    notEnough: count(rows, "NOT_ENOUGH"),
    invalid: count(rows, "INVALID"),
    enoughPct: rows.length ? Number((count(rows, "ENOUGH") / rows.length).toFixed(3)) : 0,
  };
}

async function runEvidenceCountSearch(ctx) {
  const byValue = new Map();
  const sampledRows = [];
  async function sample(candidateValue, epoch, candidateKind) {
    const rows = await sampleCandidate(ctx, {
      mode: "evidence_count",
      candidateValue,
      vectorFactory: evidenceCountVectorFactory(candidateValue, ctx.args),
      epoch,
      candidateKind,
    });
    byValue.set(candidateValue, rows);
    sampledRows.push(...rows);
    return rows;
  }

  const lowRows = await sample(0, 0, "count_low_anchor");
  const highRows = await sample(10, 0, "count_high_anchor");
  let low = 0;
  let high = 10;
  let unbracketed = false;
  if (candidateMajority(lowRows) === "ENOUGH") {
    unbracketed = true;
    high = 0;
  } else if (candidateMajority(highRows) !== "ENOUGH") {
    unbracketed = true;
    low = 10;
  } else {
    let epoch = 1;
    while (high - low > 1 && epoch <= ctx.args.epochs) {
      const candidateValue = Math.floor((low + high) / 2);
      const rows = await sample(candidateValue, epoch, "binary_count_midpoint");
      if (candidateMajority(rows) === "ENOUGH") high = candidateValue;
      else low = candidateValue;
      epoch += 1;
    }
  }

  return {
    model: ctx.model,
    mode: "evidence_count",
    low,
    high,
    width: high - low,
    threshold: unbracketed ? null : high,
    unbracketed,
    rows: sampledRows,
    candidates: [...byValue.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([candidateValue, rows]) => ({ candidateValue, ...summarizeCandidate(rows) })),
  };
}

async function runQualitySearch(ctx, activeEvidenceCount) {
  const byValue = new Map();
  const sampledRows = [];
  async function sample(candidateValue, epoch, candidateKind) {
    const rounded = Number(candidateValue.toFixed(3));
    const rows = await sampleCandidate(ctx, {
      mode: "quality",
      candidateValue: rounded,
      vectorFactory: qualityVectorFactory(rounded, activeEvidenceCount, ctx.args),
      epoch,
      candidateKind,
    });
    byValue.set(rounded, rows);
    sampledRows.push(...rows);
    return rows;
  }

  const lowRows = await sample(ctx.args.inactiveScore, 0, "quality_low_anchor");
  const highRows = await sample(ctx.args.strongScore, 0, "quality_high_anchor");
  let low = ctx.args.inactiveScore;
  let high = ctx.args.strongScore;
  let unbracketed = false;
  if (candidateMajority(lowRows) === "ENOUGH") {
    unbracketed = true;
    high = low;
  } else if (candidateMajority(highRows) !== "ENOUGH") {
    unbracketed = true;
    low = high;
  } else {
    for (let epoch = 1; epoch <= ctx.args.epochs && high - low > ctx.args.convergeWidth; epoch += 1) {
      const candidateValue = Number(((low + high) / 2).toFixed(3));
      const rows = await sample(candidateValue, epoch, "binary_quality_midpoint");
      if (candidateMajority(rows) === "ENOUGH") high = candidateValue;
      else low = candidateValue;
    }
  }

  return {
    model: ctx.model,
    mode: "quality",
    activeEvidenceCount,
    low: Number(low.toFixed(3)),
    high: Number(high.toFixed(3)),
    width: Number((high - low).toFixed(3)),
    threshold: unbracketed ? null : Number(high.toFixed(3)),
    unbracketed,
    rows: sampledRows,
    candidates: [...byValue.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([candidateValue, rows]) => ({ candidateValue, ...summarizeCandidate(rows) })),
  };
}

function renderCsv(groups) {
  const lines = ["model,response_models,mode,candidate_value,average_score,passing_count,total,enough,not_enough,invalid,output_truncated,enough_pct,not_enough_pct,errors"];
  for (const g of groups.sort((a, b) => `${a.model}:${a.mode}:${Number(a.candidateValue)}`.localeCompare(`${b.model}:${b.mode}:${Number(b.candidateValue)}`, undefined, { numeric: true }))) {
    lines.push([g.model, g.modelVersions.join(" "), g.mode, g.candidateValue, g.averageScore, g.passingCount, g.total, g.counts.ENOUGH, g.counts.NOT_ENOUGH, g.counts.INVALID, g.outputTruncations, pct(g.counts.ENOUGH, g.total), pct(g.counts.NOT_ENOUGH, g.total), g.errors].join(","));
  }
  return `${lines.join("\n")}\n`;
}

function renderMarkdown(groups, metadata) {
  const lines = ["# Enough Threshold Summary", "", `Created: ${metadata.createdAt}`, `Commit: ${metadata.commitHash}`, "", "| Model | Response model/version | Mode | Candidate | Avg | Passing | Total | ENOUGH | NOT_ENOUGH | Invalid | Truncated |", "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"];
  for (const g of groups.sort((a, b) => `${a.model}:${a.mode}:${Number(a.candidateValue)}`.localeCompare(`${b.model}:${b.mode}:${Number(b.candidateValue)}`, undefined, { numeric: true }))) {
    lines.push(`| \`${g.model}\` | \`${g.modelVersions.join(", ") || g.model}\` | \`${g.mode}\` | ${g.candidateValue} | ${g.averageScore} | ${g.passingCount} | ${g.total} | ${g.counts.ENOUGH} (${pct(g.counts.ENOUGH, g.total)}) | ${g.counts.NOT_ENOUGH} (${pct(g.counts.NOT_ENOUGH, g.total)}) | ${g.counts.INVALID} | ${g.outputTruncations} |`);
  }
  return `${lines.join("\n")}\n`;
}

function renderThresholdsMarkdown(thresholds, metadata) {
  const lines = [
    "# Enough Contract Thresholds",
    "",
    `Created: ${metadata.createdAt}`,
    `Commit: ${metadata.commitHash}`,
    "",
    "This file reports the two-phase contract search: first the minimum number of strong evidence rows, then the minimum per-row score for that count. Each candidate is sampled repeatedly and classified by majority.",
    "",
    "| Model | Minimum strong rows | Score band for those rows | Threshold score | Notes |",
    "| --- | ---: | --- | ---: | --- |",
  ];
  const byModel = new Map();
  for (const threshold of thresholds) {
    if (!byModel.has(threshold.model)) byModel.set(threshold.model, {});
    byModel.get(threshold.model)[threshold.mode] = threshold;
  }
  for (const [model, item] of [...byModel.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const countBand = item.evidence_count;
    const qualityBand = item.quality;
    const rows = countBand?.unbracketed ? "unbracketed" : countBand?.threshold ?? "";
    const scoreBand = qualityBand ? `${qualityBand.low} to ${qualityBand.high}` : "";
    const score = qualityBand?.unbracketed ? "unbracketed" : qualityBand?.threshold ?? "";
    const notes = qualityBand?.activeEvidenceCount ? `${qualityBand.activeEvidenceCount} active rows; inactive rows at 1` : "";
    lines.push(`| \`${model}\` | ${rows} | ${scoreBand} | ${score} | ${notes} |`);
  }
  return `${lines.join("\n")}\n`;
}

function renderAnalysis() {
  return `# Enough Analysis

Both labels can be defensible because the prompt asks the model to resolve \`enough\` without an explicit proof standard. A high average can hide one weak signal. A high count of passing signals can hide mediocre aggregate evidence. Different systems may reasonably encode either policy, but the prompt does not say which one controls approval.

Deterministic replacement policy: define sufficiency outside the model, for example \`ENOUGH iff average_score >= 7.0 and count(score >= 7.0) >= 7\`, version that policy, log the version used for each decision, and let the model extract or critique evidence without inventing the approval boundary.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage({ command: "src/enough.mjs", description: "Finds the implicit flip point for ENOUGH in a 10-signal evidence classifier.", extraOptions: extraOptions() }));
    return;
  }
  validateCommonArgs(args);

  const fixture = { modes: modes(args), averageScan: averageScanPoints(args), passingCounts: Array.from({ length: 11 }, (_, i) => i), passingScore: args.passingScore, failingScore: args.failingScore, passThreshold: args.passThreshold, strongScore: args.strongScore, inactiveScore: args.inactiveScore };
  const { runDir, metadata } = await prepareRunDir({
    testbed: "enough",
    label: args.label,
    args,
    prompts: ["system-prompt.txt", "user-template.txt"],
    fixture,
    search: { range: { average: [0, 10], passingCount: [0, 10], evidenceCount: [0, 10], qualityScore: [args.inactiveScore, args.strongScore], initialAverageScan: fixture.averageScan }, convergenceRule: `contract mode binary-searches integer evidence count, then binary-searches minimum active-row score until high-low <= ${args.convergeWidth}; average mode binary search stops after ${args.epochs} epochs or when high-low <= ${args.convergeWidth}; passing mode scans 0..10 counts` },
    extraResultFiles: { enoughThresholdsJson: "enough-thresholds.json", enoughThresholdsMarkdown: "enough-thresholds.md" },
  });
  await writePromptFiles(runDir, { "system-prompt.txt": SYSTEM_PROMPT, "user-template.txt": userPrompt(Array.from({ length: 10 }, () => "X")) });

  const allRows = [];
  const thresholds = [];
  let callCount = 0;
  for (const model of modelsFromArgs(args)) {
    const contractModes = new Set(fixture.modes);
    let countThreshold = null;
    if (contractModes.has("evidence_count")) {
      const result = await runEvidenceCountSearch({ args, runDir, model, callCount });
      callCount += result.candidates.reduce((sum, candidate) => sum + candidate.total, 0);
      allRows.push(...result.rows);
      delete result.rows;
      thresholds.push(result);
      countThreshold = result.threshold;
    }
    if (contractModes.has("quality")) {
      if (countThreshold === null) countThreshold = 10;
      const result = await runQualitySearch({ args, runDir, model, callCount }, countThreshold);
      callCount += result.candidates.reduce((sum, candidate) => sum + candidate.total, 0);
      allRows.push(...result.rows);
      delete result.rows;
      thresholds.push(result);
    }

    for (const mode of fixture.modes.filter((item) => ["average", "passing"].includes(item))) {
      if (mode === "passing") {
        for (const candidateValue of fixture.passingCounts) {
          const vector = vectorForCandidate({ mode, value: candidateValue, args });
          const rows = await sampleCandidate({ args, runDir, model, mode, callCount }, { candidateValue, vector, epoch: 0, candidateKind: "full_count_scan" });
          callCount += rows.length;
          allRows.push(...rows);
        }
        continue;
      }

      const byValue = new Map();
      for (const candidateValue of fixture.averageScan) {
        const vector = vectorForCandidate({ mode, value: candidateValue, args });
        const rows = await sampleCandidate({ args, runDir, model, mode, callCount }, { candidateValue, vector, epoch: 0, candidateKind: "initial_average_scan" });
        callCount += rows.length;
        byValue.set(candidateValue, rows);
        allRows.push(...rows);
      }
      let band = findInitialBand(byValue);
      for (let epoch = 1; epoch <= args.epochs && band.high - band.low > args.convergeWidth; epoch += 1) {
        const candidateValue = Number(((band.low + band.high) / 2).toFixed(3));
        const vector = vectorForCandidate({ mode, value: candidateValue, args });
        const rows = await sampleCandidate({ args, runDir, model, mode, callCount }, { candidateValue, vector, epoch, candidateKind: "binary_average_midpoint" });
        callCount += rows.length;
        allRows.push(...rows);
        if (majority(rows) === "ENOUGH") band = { ...band, high: candidateValue };
        else band = { ...band, low: candidateValue };
      }
    }
  }

  const groups = summarizeRows(allRows, ALLOWED, ["model", "mode", "candidateValue", "averageScore", "passingCount"]);
  await writeFile(path.join(runDir, "summary.csv"), renderCsv(groups), "utf8");
  await writeFile(path.join(runDir, "summary.md"), renderMarkdown(groups, metadata), "utf8");
  await writeFile(path.join(runDir, "enough-thresholds.json"), `${JSON.stringify(thresholds, null, 2)}\n`, "utf8");
  await writeFile(path.join(runDir, "enough-thresholds.md"), renderThresholdsMarkdown(thresholds, metadata), "utf8");
  await writeFile(path.join(runDir, "analysis.md"), renderAnalysis(), "utf8");
  if (args.gzipJsonl) await maybeWriteGzip(runDir);
  console.log(`Wrote ${path.relative(process.cwd(), runDir)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
