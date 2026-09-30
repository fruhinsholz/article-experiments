#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const resultDirectory = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!resultDirectory) {
  throw new Error("Usage: node src/analyze-prospective-routing-boundary.mjs <result-directory>");
}

const run = JSON.parse(await readFile(path.join(resultDirectory, "run.json"), "utf8"));
const stimuli = run.stimuli;
const spec = stimuli.analysis;
const allRows = (await readFile(path.join(resultDirectory, "calls.jsonl"), "utf8"))
  .trim()
  .split("\n")
  .filter(Boolean)
  .map(JSON.parse);
const rows = allRows.filter((row) => !row.error);

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const pct = (value, digits = 2) => `${(value * 100).toFixed(digits)}%`;
const pp = (value, digits = 2) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(digits)} pp`;

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

function quantile(sorted, probability) {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower] + fraction * ((sorted[lower + 1] ?? sorted[lower]) - sorted[lower]);
}

function bootstrapInterval(values, samples, seed) {
  const random = mulberry32(seed);
  const estimates = Array.from({ length: samples }, () => mean(
    Array.from({ length: values.length }, () => values[Math.floor(random() * values.length)]),
  )).sort((left, right) => left - right);
  return [quantile(estimates, 0.025), quantile(estimates, 0.975)];
}

function indexRows(selectedRows) {
  return new Map(selectedRows.map((row) => [`${row.block}|${row.state}|${row.family}`, row]));
}

function count(values) {
  return Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length]));
}

function validate() {
  const expectedCalls = run.jobs.length;
  if (run.status !== "completed") throw new Error(`Run status is ${run.status}, not completed`);
  if (allRows.length !== expectedCalls) throw new Error(`Expected ${expectedCalls} call records, found ${allRows.length}`);
  if (rows.length !== expectedCalls) throw new Error(`Expected ${expectedCalls} valid calls, found ${rows.length}`);
  const expectedBlocks = run.args.repeats;
  const blocks = [...new Set(rows.map((row) => row.block))];
  if (blocks.length !== expectedBlocks) throw new Error(`Expected ${expectedBlocks} complete blocks, found ${blocks.length}`);
  const cellsPerBlock = Object.keys(stimuli.states).length * Object.keys(stimuli.keyFamilies).length;
  for (const block of blocks) {
    const blockRows = rows.filter((row) => row.block === block);
    if (blockRows.length !== cellsPerBlock) throw new Error(`Block ${block} has ${blockRows.length}/${cellsPerBlock} cells`);
  }
  const orderCounts = count(run.jobs.filter((job) => job.family === spec.controlFamily && job.state === spec.primaryStates[0])
    .map((job) => job.semanticOrder.join("/")));
  for (const order of stimuli.randomization.semanticOrders) {
    if (orderCounts[order.join("/")] !== stimuli.randomization.blocksPerSemanticOrder) {
      throw new Error(`Unbalanced semantic order ${order.join("/")}`);
    }
  }
}

validate();
const byCell = indexRows(rows);
const control = spec.controlFamily;
const treatment = spec.treatmentFamily;
const blocks = [...new Set(rows.map((row) => row.block))].sort((a, b) => a - b);

function pair(block, state) {
  const controlRow = byCell.get(`${block}|${state}|${control}`);
  const treatmentRow = byCell.get(`${block}|${state}|${treatment}`);
  if (!controlRow || !treatmentRow) throw new Error(`Missing pair for block ${block}, state ${state}`);
  return { controlRow, treatmentRow };
}

const stateEffects = Object.keys(stimuli.states).map((state) => {
  const pairs = blocks.map((block) => pair(block, state));
  return {
    state,
    controlMean: mean(pairs.map(({ controlRow }) => controlRow.reviewScore)),
    treatmentMean: mean(pairs.map(({ treatmentRow }) => treatmentRow.reviewScore)),
    scoreDifference: mean(pairs.map(({ controlRow, treatmentRow }) => treatmentRow.reviewScore - controlRow.reviewScore)),
    reviewRateDifference: mean(pairs.map(({ controlRow, treatmentRow }) =>
      Number(treatmentRow.applicationBranch === "human_review") - Number(controlRow.applicationBranch === "human_review"))),
  };
});

const blockEffects = blocks.map((block) => {
  const pairs = spec.primaryStates.map((state) => pair(block, state));
  return {
    block,
    scoreDifference: mean(pairs.map(({ controlRow, treatmentRow }) => treatmentRow.reviewScore - controlRow.reviewScore)),
    reviewRateDifference: mean(pairs.map(({ controlRow, treatmentRow }) =>
      Number(treatmentRow.applicationBranch === "human_review") - Number(controlRow.applicationBranch === "human_review"))),
  };
});

const primaryScoreDifference = mean(blockEffects.map((row) => row.scoreDifference));
const primaryReviewRateDifference = mean(blockEffects.map((row) => row.reviewRateDifference));
const primaryScoreBootstrap95 = bootstrapInterval(
  blockEffects.map((row) => row.scoreDifference),
  spec.bootstrapSamples,
  spec.bootstrapSeed,
);
const primaryReviewRateBootstrap95 = bootstrapInterval(
  blockEffects.map((row) => row.reviewRateDifference),
  spec.bootstrapSamples,
  spec.bootstrapSeed + 1,
);

const transitions = { automaticToReview: 0, reviewToAutomatic: 0, bothAutomatic: 0, bothReview: 0 };
for (const block of blocks) {
  for (const state of spec.primaryStates) {
    const { controlRow, treatmentRow } = pair(block, state);
    const before = controlRow.applicationBranch;
    const after = treatmentRow.applicationBranch;
    if (before === "automatic_full_capacity" && after === "human_review") transitions.automaticToReview += 1;
    else if (before === "human_review" && after === "automatic_full_capacity") transitions.reviewToAutomatic += 1;
    else if (before === "automatic_full_capacity") transitions.bothAutomatic += 1;
    else transitions.bothReview += 1;
  }
}

const guardrails = Object.entries(spec.guardrails).flatMap(([state, expectedBranch]) =>
  [control, treatment].map((family) => {
    const cell = rows.filter((row) => row.state === state && row.family === family);
    return {
      state,
      family,
      expectedBranch,
      correct: cell.filter((row) => row.applicationBranch === expectedBranch).length,
      n: cell.length,
      accuracy: cell.filter((row) => row.applicationBranch === expectedBranch).length / cell.length,
    };
  }),
);

const responseModels = [...new Set(rows.map((row) => row.responseModel))].sort();
const primaryStateEffects = stateEffects.filter((row) => spec.primaryStates.includes(row.state));
const criteria = {
  scoreShiftAtLeastFivePoints: primaryScoreDifference >= spec.minimumPrimaryScoreShift,
  scoreIntervalAboveZero: primaryScoreBootstrap95[0] > 0,
  bothPrimaryStatesPositive: primaryStateEffects.every((row) => row.scoreDifference > 0),
  reviewRateIncreaseWithIntervalAboveZero: primaryReviewRateDifference > 0 && primaryReviewRateBootstrap95[0] > 0,
  guardrailsAtLeast95Percent: guardrails.every((row) => row.accuracy >= spec.minimumGuardrailAccuracy),
  oneReturnedModelVersion: responseModels.length === 1,
};

const analysis = {
  method: {
    primaryStates: spec.primaryStates,
    primaryUnit: "complete randomized block; equal-weight mean of r05 and r06 paired family differences",
    bootstrap: "percentile bootstrap of complete block effects",
    bootstrapSamples: spec.bootstrapSamples,
    bootstrapSeed: spec.bootstrapSeed,
  },
  calls: rows.length,
  errors: allRows.length - rows.length,
  retries: rows.reduce((sum, row) => sum + Math.max(0, (row.requestAttempts ?? 1) - 1), 0),
  responseModels,
  primary: {
    scoreDifference: primaryScoreDifference,
    scoreBootstrap95: primaryScoreBootstrap95,
    reviewRateDifference: primaryReviewRateDifference,
    reviewRateBootstrap95: primaryReviewRateBootstrap95,
    transitions,
  },
  stateEffects,
  guardrails,
  successCriteria: criteria,
  success: Object.values(criteria).every(Boolean),
};

const lines = [
  "# Prospective routing-boundary results",
  "",
  `- Valid calls: ${analysis.calls}`,
  `- Errors: ${analysis.errors}`,
  `- Retries: ${analysis.retries}`,
  `- Returned model version(s): ${responseModels.map((value) => `\`${value}\``).join(", ")}`,
  `- Frozen success decision: **${analysis.success ? "SUPPORTED" : "NOT SUPPORTED"}**`,
  "",
  "## Primary result",
  "",
  `Across the two primary states, \`${treatment}\` minus \`${control}\` shifted the review score by **${pp(primaryScoreDifference)}** (complete-block bootstrap 95% interval **[${pp(primaryScoreBootstrap95[0])}, ${pp(primaryScoreBootstrap95[1])}]**).`,
  "",
  `The human-review rate changed by **${pp(primaryReviewRateDifference)}** (95% interval **[${pp(primaryReviewRateBootstrap95[0])}, ${pp(primaryReviewRateBootstrap95[1])}]**).`,
  "",
  "| State | Prevention score | Impediment score | Difference | Review-rate difference |",
  "|---|---:|---:|---:|---:|",
  ...stateEffects.map((row) => `| \`${row.state}\` | ${pct(row.controlMean)} | ${pct(row.treatmentMean)} | ${pp(row.scoreDifference)} | ${pp(row.reviewRateDifference)} |`),
  "",
  "## Primary threshold transitions",
  "",
  `- automatic to human review: ${transitions.automaticToReview}`,
  `- human review to automatic: ${transitions.reviewToAutomatic}`,
  `- automatic under both: ${transitions.bothAutomatic}`,
  `- human review under both: ${transitions.bothReview}`,
  "",
  "## Guardrails",
  "",
  "| State | Family | Correct route | Accuracy |",
  "|---|---|---:|---:|",
  ...guardrails.map((row) => `| \`${row.state}\` | \`${row.family}\` | ${row.correct}/${row.n} | ${pct(row.accuracy)} |`),
  "",
  "## Frozen success criteria",
  "",
  ...Object.entries(criteria).map(([name, passed]) => `- ${passed ? "PASS" : "FAIL"}: \`${name}\``),
  "",
  "Earlier experiments were test-bed development and are excluded from these estimates and the success decision.",
];

await writeFile(path.join(resultDirectory, "analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
await writeFile(path.join(resultDirectory, "analysis.md"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
