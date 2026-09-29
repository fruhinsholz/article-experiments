#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const resultDirectory = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!resultDirectory) throw new Error("Usage: node src/analyze-key-framing-followup.mjs <result-directory>");

const bootstrapSamples = 10_000;
const bootstrapSeed = 28092002;
const candidateFamilies = [
  "neutral",
  "duty_coverage",
  "work_capacity_level",
  "work_impediment",
  "essential_work_impediment",
  "duty_prevention",
  "work_blockage",
  "essential_work_blockage",
];
const candidateComparisons = [
  ["work_impediment", "duty_coverage"],
  ["work_impediment", "work_capacity_level"],
  ["duty_prevention", "duty_coverage"],
  ["duty_prevention", "work_capacity_level"],
  ["work_impediment", "duty_prevention"],
  ["work_blockage", "duty_coverage"],
  ["work_blockage", "work_capacity_level"],
  ["work_blockage", "work_impediment"],
  ["work_blockage", "duty_prevention"],
  ["essential_work_impediment", "duty_coverage"],
  ["essential_work_impediment", "work_capacity_level"],
  ["essential_work_impediment", "duty_prevention"],
  ["essential_work_blockage", "duty_coverage"],
  ["essential_work_blockage", "work_capacity_level"],
  ["essential_work_blockage", "essential_work_impediment"],
  ["essential_work_blockage", "duty_prevention"],
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

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const fixed = (value, digits = 2) => Number(value * 100).toFixed(digits);

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

function hierarchicalBootstrap(byState, random) {
  const states = [...byState.keys()];
  return interval(Array.from({ length: bootstrapSamples }, () => mean(
    Array.from({ length: states.length }, () => {
      const state = states[Math.floor(random() * states.length)];
      const values = byState.get(state);
      return mean(Array.from({ length: values.length }, () => values[Math.floor(random() * values.length)]));
    }),
  )));
}

function counts(values) {
  const result = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return result;
}

const calls = (await readFile(path.join(resultDirectory, "calls.jsonl"), "utf8"))
  .trim().split("\n").filter(Boolean).map(JSON.parse);
const valid = calls.filter((row) => !row.error);
const run = JSON.parse(await readFile(path.join(resultDirectory, "run.json"), "utf8"));
const presentFamilies = new Set(valid.map((row) => row.family));
const families = candidateFamilies.filter((family) => presentFamilies.has(family));
const comparisons = candidateComparisons.filter(([first, second]) => presentFamilies.has(first) && presentFamilies.has(second));
const expectedCalls = run.args.maxCalls;
if (valid.length !== expectedCalls) throw new Error(`Expected ${expectedCalls} valid calls for ${families.length} families, found ${valid.length}`);

const responseModels = [...new Set(valid.map((row) => row.responseModel))];
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
        block: row.block,
        scoreDifference: row.reviewScore - match.reviewScore,
        branchChanged: row.applicationBranch !== match.applicationBranch,
        firstBranch: row.applicationBranch,
        secondBranch: match.applicationBranch,
        selectionChanged: row.semanticSelection !== match.semanticSelection,
      };
    });
}

function branchTransitions(paired) {
  return {
    secondAutomaticToFirstHumanReview: paired.filter((row) =>
      row.secondBranch === "automatic_full_capacity" && row.firstBranch === "human_review").length,
    secondHumanReviewToFirstAutomatic: paired.filter((row) =>
      row.secondBranch === "human_review" && row.firstBranch === "automatic_full_capacity").length,
    bothAutomatic: paired.filter((row) =>
      row.secondBranch === "automatic_full_capacity" && row.firstBranch === "automatic_full_capacity").length,
    bothHumanReview: paired.filter((row) =>
      row.secondBranch === "human_review" && row.firstBranch === "human_review").length,
  };
}

function sumTransitions(states) {
  const result = {
    secondAutomaticToFirstHumanReview: 0,
    secondHumanReviewToFirstAutomatic: 0,
    bothAutomatic: 0,
    bothHumanReview: 0,
  };
  for (const state of states) {
    for (const key of Object.keys(result)) result[key] += state.branchTransitions[key];
  }
  return result;
}

const random = mulberry32(bootstrapSeed);
const sensitivityRandom = mulberry32(bootstrapSeed + 1);
const contrasts = comparisons.map(([first, second]) => {
  const differencesByState = new Map();
  const states = boundaryStates.map((state) => {
    const paired = pairedRows(state, first, second);
    const differences = paired.map((row) => row.scoreDifference);
    differencesByState.set(state, differences);
    return {
      state,
      meanReviewScoreDifference: mean(differences),
      semanticSelectionChanges: paired.filter((row) => row.selectionChanged).length,
      humanReviewBranchChanges: paired.filter((row) => row.branchChanged).length,
      branchTransitions: branchTransitions(paired),
    };
  });
  const aggregateBootstrap95 = hierarchicalBootstrap(differencesByState, random);
  const leaveOneStateOut = states.map(({ state: omittedState }) => {
    const retainedStates = states.filter(({ state }) => state !== omittedState);
    const retainedDifferences = new Map(retainedStates.map(({ state }) => [state, differencesByState.get(state)]));
    return {
      omittedState,
      aggregateMeanReviewScoreDifference: mean(retainedStates.map((state) => state.meanReviewScoreDifference)),
      hierarchicalBootstrap95: hierarchicalBootstrap(retainedDifferences, sensitivityRandom),
      positiveStates: retainedStates.filter((state) => state.meanReviewScoreDifference > 0).length,
      negativeStates: retainedStates.filter((state) => state.meanReviewScoreDifference < 0).length,
    };
  });
  return {
    first,
    second,
    states,
    aggregateMeanReviewScoreDifference: mean(states.map((state) => state.meanReviewScoreDifference)),
    hierarchicalBootstrap95: aggregateBootstrap95,
    positiveStates: states.filter((state) => state.meanReviewScoreDifference > 0).length,
    negativeStates: states.filter((state) => state.meanReviewScoreDifference < 0).length,
    branchTransitions: sumTransitions(states),
    leaveOneStateOut,
  };
});

const familySummaries = families.map((family) => {
  const rows = valid.filter((row) => boundaryStates.includes(row.state) && row.family === family);
  return {
    family,
    n: rows.length,
    meanReviewScore: mean(rows.map((row) => row.reviewScore)),
    semanticSelections: counts(rows.map((row) => row.semanticSelection)),
    applicationBranches: counts(rows.map((row) => row.applicationBranch)),
  };
});

const stateFamilySummaries = boundaryStates.map((state) => ({
  state,
  families: families.map((family) => {
    const rows = valid.filter((row) => row.state === state && row.family === family);
    return {
      family,
      n: rows.length,
      meanReviewScore: mean(rows.map((row) => row.reviewScore)),
      semanticSelections: counts(rows.map((row) => row.semanticSelection)),
      applicationBranches: counts(rows.map((row) => row.applicationBranch)),
    };
  }),
}));

const guardrails = ["clear_full", "clear_partial"].map((state) => ({
  state,
  families: families.map((family) => {
    const rows = valid.filter((row) => row.state === state && row.family === family);
    return {
      family,
      n: rows.length,
      meanReviewScore: mean(rows.map((row) => row.reviewScore)),
      semanticSelections: counts(rows.map((row) => row.semanticSelection)),
      applicationBranches: counts(rows.map((row) => row.applicationBranch)),
    };
  }),
}));

const analysis = {
  method: {
    primaryUnit: "balanced block paired within state",
    aggregateBootstrap: "hierarchical bootstrap resampling states, then paired blocks",
    bootstrapSamples,
    bootstrapSeed,
    equivalenceMargin: null,
  },
  calls: valid.length,
  errors: calls.length - valid.length,
  retries: valid.reduce((sum, row) => sum + Math.max(0, (row.requestAttempts ?? 1) - 1), 0),
  responseModels,
  boundaryStates,
  familySummaries,
  stateFamilySummaries,
  contrasts,
  guardrails,
};

const lines = [
  "# Key-framing follow-up analysis",
  "",
  `- Calls: ${analysis.calls}`,
  `- Errors: ${analysis.errors}`,
  `- Retries: ${analysis.retries}`,
  `- Returned model(s): ${responseModels.map((model) => `\`${model}\``).join(", ")}`,
  "- No equivalence margin was preregistered; overlapping intervals do not establish equivalence.",
  "",
  "## Family-level boundary results",
  "",
  "| Family | n | Mean review score | Semantic selections | Human-review branches |",
  "|---|---:|---:|---|---|",
];

for (const family of familySummaries) {
  lines.push(`| ${family.family} | ${family.n} | ${fixed(family.meanReviewScore)}% | ${JSON.stringify(family.semanticSelections)} | ${JSON.stringify(family.applicationBranches)} |`);
}

lines.push("", "## Results by boundary state", "");
for (const state of stateFamilySummaries) {
  lines.push(`### ${state.state}`, "", "| Family | n | Mean review score | Human-review branches |", "|---|---:|---:|---:|");
  for (const family of state.families) {
    lines.push(`| ${family.family} | ${family.n} | ${fixed(family.meanReviewScore)}% | ${family.applicationBranches.human_review ?? 0}/${family.n} |`);
  }
  lines.push("");
}

lines.push(
  "",
  "## Preregistered contrasts",
  "",
  "Difference is the first family's review score minus the second family's review score.",
  "",
  "| Contrast | Aggregate difference | 95% interval | Positive states | Negative states | Selection changes | Branch changes |",
  "|---|---:|---:|---:|---:|---:|---:|",
);

for (const contrast of contrasts) {
  lines.push(`| ${contrast.first} - ${contrast.second} | ${fixed(contrast.aggregateMeanReviewScoreDifference)} pp | [${fixed(contrast.hierarchicalBootstrap95[0])}, ${fixed(contrast.hierarchicalBootstrap95[1])}] pp | ${contrast.positiveStates}/4 | ${contrast.negativeStates}/4 | ${contrast.states.reduce((sum, state) => sum + state.semanticSelectionChanges, 0)} | ${contrast.states.reduce((sum, state) => sum + state.humanReviewBranchChanges, 0)} |`);
}

lines.push(
  "",
  "## Paired branch transitions",
  "",
  "Direction is from the second family to the first family in each contrast.",
  "",
  "| Contrast | Automatic to human review | Human review to automatic | Both automatic | Both human review |",
  "|---|---:|---:|---:|---:|",
);
for (const contrast of contrasts) {
  const transitions = contrast.branchTransitions;
  lines.push(`| ${contrast.second} -> ${contrast.first} | ${transitions.secondAutomaticToFirstHumanReview} | ${transitions.secondHumanReviewToFirstAutomatic} | ${transitions.bothAutomatic} | ${transitions.bothHumanReview} |`);
}

lines.push("", "## Leave-one-state-out sensitivity", "");
for (const contrast of contrasts) {
  lines.push(`### ${contrast.first} - ${contrast.second}`, "", "| Omitted state | Difference across remaining states | 95% interval | Positive states | Negative states |", "|---|---:|---:|---:|---:|");
  for (const sensitivity of contrast.leaveOneStateOut) {
    lines.push(`| ${sensitivity.omittedState} | ${fixed(sensitivity.aggregateMeanReviewScoreDifference)} pp | [${fixed(sensitivity.hierarchicalBootstrap95[0])}, ${fixed(sensitivity.hierarchicalBootstrap95[1])}] pp | ${sensitivity.positiveStates}/3 | ${sensitivity.negativeStates}/3 |`);
  }
  lines.push("");
}

lines.push("", "## Clear-state guardrails", "");
for (const guardrail of guardrails) {
  lines.push(`### ${guardrail.state}`, "", "| Family | Mean review score | Semantic selections | Branches |", "|---|---:|---|---|");
  for (const family of guardrail.families) {
    lines.push(`| ${family.family} | ${fixed(family.meanReviewScore)}% | ${JSON.stringify(family.semanticSelections)} | ${JSON.stringify(family.applicationBranches)} |`);
  }
  lines.push("");
}

await writeFile(path.join(resultDirectory, "key-framing-analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
const markdown = lines.join("\n").trimEnd();
await writeFile(path.join(resultDirectory, "key-framing-analysis.md"), `${markdown}\n`);
console.log(markdown);
