#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [withInstructionArg, withoutInstructionArg] = process.argv.slice(2);
if (!withInstructionArg || !withoutInstructionArg) {
  throw new Error("Usage: node src/compare-choice-key-instruction-ablation.mjs <with-instruction-result-dir> <without-instruction-result-dir>");
}

const withInstructionDir = path.resolve(withInstructionArg);
const withoutInstructionDir = path.resolve(withoutInstructionArg);

async function loadCalls(directory) {
  return (await readFile(path.join(directory, "calls.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(JSON.parse)
    .filter((row) => !row.error);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(calls) {
  const boundary = calls.filter((row) => row.state === "boundary");
  const families = [...new Set(boundary.map((row) => row.family))];
  const cells = Object.fromEntries(families.map((family) => {
    const rows = boundary.filter((row) => row.family === family);
    return [family, {
      n: rows.length,
      meanReviewScore: mean(rows.map((row) => row.reviewScore)),
      humanReviewRate: mean(rows.map((row) => Number(row.applicationBranch === "human_review"))),
    }];
  }));
  const descriptive = families.filter((family) => family !== "neutral");
  return {
    calls: calls.length,
    models: [...new Set(calls.map((row) => row.responseModel))],
    boundary: cells,
    aggregateDescriptiveReviewScore: mean(descriptive.map((family) => cells[family].meanReviewScore)),
    aggregateDescriptiveHumanReviewRate: mean(descriptive.map((family) => cells[family].humanReviewRate)),
    aggregateDescriptiveGap: mean(descriptive.map((family) => cells[family].meanReviewScore - cells.neutral.meanReviewScore)),
    clearControlErrors: calls.filter((row) =>
      (row.state === "clear_full" && row.semanticSelection !== "full") ||
      (row.state === "clear_partial" && row.semanticSelection !== "partial")
    ).length,
  };
}

function percentage(value, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

function points(value, digits = 2) {
  return `${(value * 100).toFixed(digits)} pp`;
}

const withInstruction = summarize(await loadCalls(withInstructionDir));
const withoutInstruction = summarize(await loadCalls(withoutInstructionDir));
const families = Object.keys(withInstruction.boundary);

const comparison = {
  method: {
    design: "post-confirmatory instruction ablation",
    changedVariable: "Removed 'Treat choice names as identifiers. Base the answer on the descriptions.'",
    equivalenceTest: false,
    interpretation: "Descriptive replication comparison, not a formal statistical equivalence test.",
  },
  withInstruction,
  withoutInstruction,
};

const lines = [
  "# Choice-key instruction ablation",
  "",
  "This is a post-confirmatory ablation. It asks whether the observed choice-key effect survives removal of the explicit instruction to treat names as identifiers and answer from descriptions.",
  "",
  "Only this suffix was removed:",
  "",
  "> Treat choice names as identifiers. Base the answer on the descriptions.",
  "",
  "The state, question, descriptions, key families, key order, application threshold, randomization seed, model alias, repeats, and concurrency were held fixed.",
  "",
  `- Calls with instruction: ${withInstruction.calls}`,
  `- Calls without instruction: ${withoutInstruction.calls}`,
  `- Returned model: \`${withoutInstruction.models.join(", ")}\``,
  `- Clear-control errors: ${withInstruction.clearControlErrors} with instruction; ${withoutInstruction.clearControlErrors} without instruction`,
  "",
  "## Boundary results",
  "",
  "| Key family | Review score with instruction | Review score without | Change | Human review with instruction | Human review without |",
  "|---|---:|---:|---:|---:|---:|",
];

for (const family of families) {
  const before = withInstruction.boundary[family];
  const after = withoutInstruction.boundary[family];
  lines.push(`| ${family} | ${percentage(before.meanReviewScore)} | ${percentage(after.meanReviewScore)} | ${points(after.meanReviewScore - before.meanReviewScore)} | ${percentage(before.humanReviewRate, 0)} | ${percentage(after.humanReviewRate, 0)} |`);
}

lines.push(
  "",
  "## Aggregate readout",
  "",
  `- Mean descriptive-key gap versus neutral: ${points(withInstruction.aggregateDescriptiveGap)} with the instruction; ${points(withoutInstruction.aggregateDescriptiveGap)} without it.`,
  `- Mean descriptive-family human-review rate: ${percentage(withInstruction.aggregateDescriptiveHumanReviewRate)} with the instruction; ${percentage(withoutInstruction.aggregateDescriptiveHumanReviewRate)} without it.`,
  `- Neutral human-review rate: ${percentage(withInstruction.boundary.neutral.humanReviewRate, 0)} with the instruction; ${percentage(withoutInstruction.boundary.neutral.humanReviewRate, 0)} without it.`,
  "",
  "## Interpretation",
  "",
  "Removing the instruction did not remove the choice-key effect. The aggregate review-score gap between descriptive keys and neutral A/B/C keys remained almost unchanged, and the operational branch still changed at the boundary. The exact family-level pattern did change, so the two runs are not numerically equivalent. This comparison supports robustness of the narrow conclusion, not formal equivalence of the distributions.",
  "",
  "The ablation also removes a plausible objection to the original wording: the observed effect is not dependent on explicitly telling Jev to discount key names. In this protocol, descriptive key names remained behaviorally active when the question contained no instruction about how to treat them.",
);

await writeFile(path.join(withoutInstructionDir, "instruction-ablation-comparison.json"), `${JSON.stringify(comparison, null, 2)}\n`);
await writeFile(path.join(withoutInstructionDir, "instruction-ablation-comparison.md"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
