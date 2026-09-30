#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const RESULT_DIR = process.argv[2] ? path.resolve(process.argv[2]) : null;
const BOOTSTRAP_SAMPLES = 10_000;
const BOOTSTRAP_SEED = 30092027;
const NEUTRAL_ORDER_RANGE = 0.0705;

if (!RESULT_DIR) {
  throw new Error("Usage: node src/analyze-refined-choice-key-confirmatory.mjs <result-directory>");
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

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(sorted, probability) {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower] + fraction * ((sorted[lower + 1] ?? sorted[lower]) - sorted[lower]);
}

function bootstrapInterval(values, random) {
  const estimates = [];
  for (let sample = 0; sample < BOOTSTRAP_SAMPLES; sample += 1) {
    const resample = Array.from({ length: values.length }, () => values[Math.floor(random() * values.length)]);
    estimates.push(mean(resample));
  }
  estimates.sort((a, b) => a - b);
  return [quantile(estimates, 0.025), quantile(estimates, 0.975)];
}

function exactSignFlipPValue(values) {
  const observed = Math.abs(mean(values));
  const assignments = 2 ** values.length;
  let atLeastAsExtreme = 0;
  for (let mask = 0; mask < assignments; mask += 1) {
    let sum = 0;
    for (let index = 0; index < values.length; index += 1) {
      sum += ((mask >>> index) & 1 ? 1 : -1) * values[index];
    }
    if (Math.abs(sum / values.length) >= observed - 1e-12) atLeastAsExtreme += 1;
  }
  return atLeastAsExtreme / assignments;
}

function holmAdjust(entries) {
  const ordered = [...entries].sort((left, right) => left.reviewScoreDifference.exactSignFlipPValue - right.reviewScoreDifference.exactSignFlipPValue);
  let previous = 0;
  for (let index = 0; index < ordered.length; index += 1) {
    const adjusted = Math.min(1, ordered[index].reviewScoreDifference.exactSignFlipPValue * (ordered.length - index));
    ordered[index].reviewScoreDifference.holmAdjustedPValue = Math.max(previous, adjusted);
    previous = ordered[index].reviewScoreDifference.holmAdjustedPValue;
  }
}

function fixed(value, digits = 4) {
  return Number(value).toFixed(digits);
}

const calls = (await readFile(path.join(RESULT_DIR, "calls.jsonl"), "utf8"))
  .trim()
  .split("\n")
  .filter(Boolean)
  .map(JSON.parse);

const valid = calls.filter((row) => !row.error);
if (valid.length !== 240) throw new Error(`Expected 240 valid calls, found ${valid.length}`);
const versions = [...new Set(valid.map((row) => row.responseModel))];
if (versions.length !== 1) throw new Error(`Expected one response model, found ${versions.join(", ")}`);

const states = [...new Set(valid.map((row) => row.state))];
const families = [...new Set(valid.map((row) => row.family))].filter((family) => family !== "neutral");
const random = mulberry32(BOOTSTRAP_SEED);
const results = [];

for (const state of states) {
  const neutralByBlock = new Map(valid.filter((row) => row.state === state && row.family === "neutral").map((row) => [row.block, row]));
  for (const family of families) {
    const familyRows = valid.filter((row) => row.state === state && row.family === family).sort((a, b) => a.block - b.block);
    const paired = familyRows.map((row) => {
      const neutral = neutralByBlock.get(row.block);
      if (!neutral) throw new Error(`Missing neutral pair for ${state}/${family}/block ${row.block}`);
      return {
        block: row.block,
        reviewScoreDifference: row.reviewScore - neutral.reviewScore,
        branchDifference: Number(row.applicationBranch === "human_review") - Number(neutral.applicationBranch === "human_review"),
      };
    });
    const scoreDifferences = paired.map((row) => row.reviewScoreDifference);
    const branchDifferences = paired.map((row) => row.branchDifference);
    results.push({
      state,
      family,
      nBlocks: paired.length,
      reviewScoreDifference: {
        mean: mean(scoreDifferences),
        bootstrap95: bootstrapInterval(scoreDifferences, random),
        exactSignFlipPValue: exactSignFlipPValue(scoreDifferences),
      },
      humanReviewRateDifference: {
        mean: mean(branchDifferences),
        bootstrap95: bootstrapInterval(branchDifferences, random),
      },
      exceedsNeutralOrderRange: Math.abs(mean(scoreDifferences)) > NEUTRAL_ORDER_RANGE,
      changesApplicationBranch: branchDifferences.some((value) => value !== 0),
    });
  }
}

for (const state of states) holmAdjust(results.filter((result) => result.state === state));

const qualifyingFamilies = families.filter((family) => results.some((result) =>
  result.family === family && result.exceedsNeutralOrderRange && result.changesApplicationBranch));

const analysis = {
  method: {
    pairingUnit: "balanced block",
    bootstrapSamples: BOOTSTRAP_SAMPLES,
    bootstrapSeed: BOOTSTRAP_SEED,
    interval: "paired percentile bootstrap 95%",
    test: "two-sided exact paired sign-flip test on review-score differences",
    multiplicity: "Holm adjustment across the three accepted families within each state",
    neutralOrderRange: NEUTRAL_ORDER_RANGE,
  },
  calls: valid.length,
  errors: calls.length - valid.length,
  responseModels: versions,
  results,
  successCriterion: {
    qualifyingFamilies,
    requiredFamilies: 2,
    supported: qualifyingFamilies.length >= 2,
  },
};

const lines = [
  "# Refined Phase A confirmatory analysis",
  "",
  `- Calls: ${analysis.calls}`,
  `- Errors: ${analysis.errors}`,
  `- Returned model: \`${versions[0]}\``,
  `- Pairing unit: balanced block`,
  `- Uncertainty: ${BOOTSTRAP_SAMPLES.toLocaleString("en-US")} paired bootstrap resamples`,
  `- Neutral order range: ${fixed(NEUTRAL_ORDER_RANGE * 100, 2)} percentage points`,
  "",
  "| State | Family | Review-score difference | Bootstrap 95% CI | Exact p | Holm p | Human-review rate difference | Beyond 7.05 pp | Branch changed |",
  "|---|---|---:|---:|---:|---:|---:|---|---|",
];

for (const result of results) {
  const score = result.reviewScoreDifference;
  const branch = result.humanReviewRateDifference;
  lines.push(`| ${result.state} | ${result.family} | ${fixed(score.mean * 100, 2)} pp | [${fixed(score.bootstrap95[0] * 100, 2)}, ${fixed(score.bootstrap95[1] * 100, 2)}] pp | ${fixed(score.exactSignFlipPValue, 6)} | ${fixed(score.holmAdjustedPValue, 6)} | ${fixed(branch.mean * 100, 2)} pp | ${result.exceedsNeutralOrderRange ? "yes" : "no"} | ${result.changesApplicationBranch ? "yes" : "no"} |`);
}

lines.push(
  "",
  "## Preregistered decision",
  "",
  analysis.successCriterion.supported
    ? `Supported: ${qualifyingFamilies.length} families satisfy both conditions (${qualifyingFamilies.join(", ")}).`
    : `Not supported: ${qualifyingFamilies.length} family satisfies both conditions (${qualifyingFamilies.join(", ") || "none"}); 2 were required.`,
  "",
  "The result does not erase the earlier adversarial existence proof. It shows that, under these coherent key names and this preregistered realistic-fragility criterion, the evidence is insufficient for the broader claim.",
);

await writeFile(path.join(RESULT_DIR, "confirmatory-analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
await writeFile(path.join(RESULT_DIR, "confirmatory-analysis.md"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
