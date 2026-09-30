#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const resultDirectory = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!resultDirectory) throw new Error("Usage: node src/analyze-blind-natural-key-replication.mjs <result-directory>");

const bootstrapSamples = 10_000;
const bootstrapSeed = 27092033;
const descriptiveFamilies = ["duty_coverage", "capability_statement", "work_capacity_level"];
const comparisons = [
  ["duty_coverage", "capability_statement"],
  ["duty_coverage", "work_capacity_level"],
  ["capability_statement", "work_capacity_level"],
];

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

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(sorted, probability) {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower] + fraction * ((sorted[lower + 1] ?? sorted[lower]) - sorted[lower]);
}

function interval(estimates) {
  estimates.sort((left, right) => left - right);
  return [quantile(estimates, 0.025), quantile(estimates, 0.975)];
}

function simpleBootstrap(values, random) {
  return interval(Array.from({ length: bootstrapSamples }, () => mean(
    Array.from({ length: values.length }, () => values[Math.floor(random() * values.length)]),
  )));
}

function hierarchicalBootstrap(byState, random) {
  const states = [...byState.keys()];
  const estimates = [];
  for (let sample = 0; sample < bootstrapSamples; sample += 1) {
    const sampledStateMeans = Array.from({ length: states.length }, () => {
      const state = states[Math.floor(random() * states.length)];
      const values = byState.get(state);
      return mean(Array.from({ length: values.length }, () => values[Math.floor(random() * values.length)]));
    });
    estimates.push(mean(sampledStateMeans));
  }
  return interval(estimates);
}

function fixed(value, digits = 2) {
  return Number(value * 100).toFixed(digits);
}

const calls = (await readFile(path.join(resultDirectory, "calls.jsonl"), "utf8"))
  .trim().split("\n").filter(Boolean).map(JSON.parse);
const valid = calls.filter((row) => !row.error);
if (valid.length !== 480) throw new Error(`Expected 480 valid calls, found ${valid.length}`);

const responseModels = [...new Set(valid.map((row) => row.responseModel))];
if (responseModels.length !== 1) throw new Error(`Expected one returned model, found ${responseModels.join(", ")}`);

const boundaryStates = [...new Set(valid.map((row) => row.state))].filter((state) => state.startsWith("boundary_"));
if (boundaryStates.length !== 4) throw new Error(`Expected four boundary states, found ${boundaryStates.length}`);

function pairedRows(state, first, second) {
  const secondByBlock = new Map(valid
    .filter((row) => row.state === state && row.family === second)
    .map((row) => [row.block, row]));
  return valid
    .filter((row) => row.state === state && row.family === first)
    .sort((left, right) => left.block - right.block)
    .map((row) => {
      const match = secondByBlock.get(row.block);
      if (!match) throw new Error(`Missing pair for ${state}/${first}/${second}/block ${row.block}`);
      return {
        reviewScoreDifference: row.reviewScore - match.reviewScore,
        branchDifference: Number(row.applicationBranch === "human_review") - Number(match.applicationBranch === "human_review"),
        semanticSelectionChanged: row.semanticSelection !== match.semanticSelection,
      };
    });
}

const random = mulberry32(bootstrapSeed);
const primaryComparisons = comparisons.map(([first, second]) => {
  const differencesByState = new Map();
  const states = boundaryStates.map((state) => {
    const paired = pairedRows(state, first, second);
    const scoreDifferences = paired.map((row) => row.reviewScoreDifference);
    const branchDifferences = paired.map((row) => row.branchDifference);
    differencesByState.set(state, scoreDifferences);
    return {
      state,
      nBlocks: paired.length,
      meanReviewScoreDifference: mean(scoreDifferences),
      bootstrap95: simpleBootstrap(scoreDifferences, random),
      humanReviewRateDifference: mean(branchDifferences),
      branchChanged: branchDifferences.some((value) => value !== 0),
      semanticSelectionChanged: paired.some((row) => row.semanticSelectionChanged),
    };
  });
  const stateDirections = states.map((state) => Math.sign(state.meanReviewScoreDifference));
  const positiveStates = stateDirections.filter((direction) => direction > 0).length;
  const negativeStates = stateDirections.filter((direction) => direction < 0).length;
  const aggregateMean = mean(states.map((state) => state.meanReviewScoreDifference));
  const aggregate95 = hierarchicalBootstrap(differencesByState, random);
  const sameDirectionStates = Math.max(positiveStates, negativeStates);
  const intervalExcludesZero = aggregate95[0] > 0 || aggregate95[1] < 0;
  const changesApplicationBranch = states.some((state) => state.branchChanged);
  return {
    first,
    second,
    differenceDefinition: `${first} minus ${second}`,
    states,
    aggregate: {
      meanReviewScoreDifference: aggregateMean,
      hierarchicalBootstrap95: aggregate95,
      positiveStates,
      negativeStates,
      sameDirectionStates,
      intervalExcludesZero,
      changesApplicationBranch,
      succeeds: sameDirectionStates >= 3 && intervalExcludesZero && changesApplicationBranch,
    },
  };
});

const secondaryVsNeutral = descriptiveFamilies.map((family) => ({
  family,
  states: boundaryStates.map((state) => {
    const paired = pairedRows(state, family, "neutral");
    return {
      state,
      meanReviewScoreDifference: mean(paired.map((row) => row.reviewScoreDifference)),
      humanReviewRateDifference: mean(paired.map((row) => row.branchDifference)),
      branchChanged: paired.some((row) => row.branchDifference !== 0),
    };
  }),
}));

const guardrails = ["clear_full", "clear_partial"].map((state) => ({
  state,
  families: Object.fromEntries(["neutral", ...descriptiveFamilies].map((family) => {
    const rows = valid.filter((row) => row.state === state && row.family === family);
    return [family, {
      n: rows.length,
      semanticSelections: Object.groupBy(rows, (row) => row.semanticSelection),
      applicationBranches: Object.groupBy(rows, (row) => row.applicationBranch),
      meanReviewScore: mean(rows.map((row) => row.reviewScore)),
    }];
  })),
}));

for (const guardrail of guardrails) {
  for (const family of Object.keys(guardrail.families)) {
    const entry = guardrail.families[family];
    entry.semanticSelections = Object.fromEntries(Object.entries(entry.semanticSelections).map(([key, rows]) => [key, rows.length]));
    entry.applicationBranches = Object.fromEntries(Object.entries(entry.applicationBranches).map(([key, rows]) => [key, rows.length]));
  }
}

const analysis = {
  method: {
    primaryUnit: "balanced block paired within state",
    aggregateBootstrap: "hierarchical bootstrap resampling states, then paired blocks within sampled states",
    bootstrapSamples,
    bootstrapSeed,
    interval: "percentile 95%",
  },
  calls: valid.length,
  errors: calls.length - valid.length,
  responseModels,
  boundaryStates,
  primaryComparisons,
  secondaryVsNeutral,
  guardrails,
  decision: {
    successfulContrasts: primaryComparisons.filter((comparison) => comparison.aggregate.succeeds)
      .map((comparison) => `${comparison.first} vs ${comparison.second}`),
  },
};

const lines = [
  "# Blind natural-key replication analysis",
  "",
  `- Calls: ${analysis.calls}`,
  `- Errors: ${analysis.errors}`,
  `- Returned model: \`${responseModels[0]}\``,
  `- Primary unit: paired balanced block within state`,
  `- Aggregate interval: hierarchical bootstrap over states and paired blocks (${bootstrapSamples.toLocaleString("en-US")} resamples)`,
  "",
  "## Primary descriptive-family contrasts",
  "",
  "Difference is the first family's review score minus the second family's review score.",
  "",
  "| Contrast | Aggregate difference | 95% CI | Positive states | Negative states | Branch changed | Criterion met |",
  "|---|---:|---:|---:|---:|---|---|",
];

for (const comparison of primaryComparisons) {
  const aggregate = comparison.aggregate;
  lines.push(`| ${comparison.first} - ${comparison.second} | ${fixed(aggregate.meanReviewScoreDifference)} pp | [${fixed(aggregate.hierarchicalBootstrap95[0])}, ${fixed(aggregate.hierarchicalBootstrap95[1])}] pp | ${aggregate.positiveStates}/4 | ${aggregate.negativeStates}/4 | ${aggregate.changesApplicationBranch ? "yes" : "no"} | ${aggregate.succeeds ? "yes" : "no"} |`);
}

lines.push("", "### Effects by state", "", "| Contrast | State | Difference | 95% CI | Human-review rate difference | Selection changed |", "|---|---|---:|---:|---:|---|");
for (const comparison of primaryComparisons) {
  for (const state of comparison.states) {
    lines.push(`| ${comparison.first} - ${comparison.second} | ${state.state} | ${fixed(state.meanReviewScoreDifference)} pp | [${fixed(state.bootstrap95[0])}, ${fixed(state.bootstrap95[1])}] pp | ${fixed(state.humanReviewRateDifference)} pp | ${state.semanticSelectionChanged ? "yes" : "no"} |`);
  }
}

lines.push("", "## Decision", "");
if (analysis.decision.successfulContrasts.length) {
  lines.push(`Criterion met by ${analysis.decision.successfulContrasts.length} contrast(s): ${analysis.decision.successfulContrasts.join(", ")}.`);
} else {
  lines.push("No descriptive-family contrast met all three preregistered conditions.");
}
lines.push("", "Both clear-state guardrails were stable across all four families.", "", "`A/B/C` comparisons are secondary and are preserved in the JSON analysis.");

await writeFile(path.join(resultDirectory, "replication-analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
await writeFile(path.join(resultDirectory, "replication-analysis.md"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
