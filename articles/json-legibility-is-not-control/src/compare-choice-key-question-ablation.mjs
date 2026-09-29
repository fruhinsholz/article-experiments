#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [descriptiveQuestionArg, operationalQuestionArg] = process.argv.slice(2);
if (!descriptiveQuestionArg || !operationalQuestionArg) {
  throw new Error("Usage: node src/compare-choice-key-question-ablation.mjs <descriptive-question-result-dir> <operational-question-result-dir>");
}

const descriptiveQuestionDir = path.resolve(descriptiveQuestionArg);
const operationalQuestionDir = path.resolve(operationalQuestionArg);

async function loadCalls(directory) {
  return (await readFile(path.join(directory, "calls.jsonl"), "utf8"))
    .trim().split("\n").filter(Boolean).map(JSON.parse);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(allCalls) {
  const calls = allCalls.filter((row) => !row.error);
  const boundary = calls.filter((row) => row.state === "boundary");
  const families = [...new Set(boundary.map((row) => row.family))];
  const cells = Object.fromEntries(families.map((family) => {
    const rows = boundary.filter((row) => row.family === family);
    return [family, {
      n: rows.length,
      meanReviewScore: mean(rows.map((row) => row.reviewScore)),
      humanReviewCount: rows.filter((row) => row.applicationBranch === "human_review").length,
      humanReviewRate: mean(rows.map((row) => Number(row.applicationBranch === "human_review"))),
    }];
  }));
  const descriptive = families.filter((family) => family !== "neutral");
  return {
    plannedCalls: allCalls.length,
    validCalls: calls.length,
    errors: allCalls.length - calls.length,
    models: [...new Set(calls.map((row) => row.responseModel))],
    requestRetries: calls.reduce((sum, row) => sum + Math.max(0, (row.requestAttempts ?? 1) - 1), 0),
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
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(digits)} pp`;
}

const descriptiveQuestion = summarize(await loadCalls(descriptiveQuestionDir));
const operationalQuestion = summarize(await loadCalls(operationalQuestionDir));
const families = Object.keys(descriptiveQuestion.boundary);

const comparison = {
  method: {
    design: "post-confirmatory question-wording ablation",
    changedVariable: "Replaced a description-oriented question with an operational question.",
    before: "Which description best represents the person's current ability to complete essential work?",
    after: "To what extent can the person currently perform their essential work?",
    heldFixed: ["state", "descriptions", "key families", "key order", "application threshold", "randomization seed", "model alias", "repeats", "concurrency"],
    equivalenceTest: false,
    interpretation: "Descriptive robustness comparison, not a formal statistical equivalence test.",
  },
  descriptiveQuestion,
  operationalQuestion,
};

const lines = [
  "# Choice-key question-wording ablation",
  "",
  "This post-confirmatory ablation asks whether the choice-key effect survives replacing the description-oriented question with an operational one.",
  "",
  "Before:",
  "",
  "> Which description best represents the person's current ability to complete essential work?",
  "",
  "After:",
  "",
  "> To what extent can the person currently perform their essential work?",
  "",
  "Neither condition includes an instruction about how to treat choice names. The state, descriptions, key families, key order, application threshold, randomization seed, model alias, repeats, and concurrency were held fixed.",
  "",
  `- Valid calls with descriptive question: ${descriptiveQuestion.validCalls}/${descriptiveQuestion.plannedCalls}`,
  `- Valid calls with operational question: ${operationalQuestion.validCalls}/${operationalQuestion.plannedCalls}`,
  `- Retried HTTP 529 requests in final operational run: ${operationalQuestion.requestRetries}`,
  `- Returned model: \`${operationalQuestion.models.join(", ")}\``,
  `- Clear-control errors: ${descriptiveQuestion.clearControlErrors} before; ${operationalQuestion.clearControlErrors} after`,
  "",
  "## Boundary results",
  "",
  "| Key family | Review score before | Review score after | Change | Human review before | Human review after |",
  "|---|---:|---:|---:|---:|---:|",
];

for (const family of families) {
  const before = descriptiveQuestion.boundary[family];
  const after = operationalQuestion.boundary[family];
  lines.push(`| ${family} | ${percentage(before.meanReviewScore)} | ${percentage(after.meanReviewScore)} | ${points(after.meanReviewScore - before.meanReviewScore)} | ${before.humanReviewCount}/${before.n} | ${after.humanReviewCount}/${after.n} |`);
}

lines.push(
  "",
  "## Aggregate readout",
  "",
  `- Mean descriptive-key gap versus neutral: ${points(descriptiveQuestion.aggregateDescriptiveGap)} before; ${points(operationalQuestion.aggregateDescriptiveGap)} after.`,
  `- Change in that gap: ${points(operationalQuestion.aggregateDescriptiveGap - descriptiveQuestion.aggregateDescriptiveGap)}.`,
  `- Mean descriptive-family human-review rate: ${percentage(descriptiveQuestion.aggregateDescriptiveHumanReviewRate)} before; ${percentage(operationalQuestion.aggregateDescriptiveHumanReviewRate)} after.`,
  `- Neutral human-review rate: ${percentage(descriptiveQuestion.boundary.neutral.humanReviewRate, 0)} before; ${percentage(operationalQuestion.boundary.neutral.humanReviewRate, 0)} after.`,
  "",
  "## Interpretation",
  "",
  "The operational wording did not remove the choice-key effect. The aggregate gap between descriptive keys and neutral A/B/C keys increased in magnitude, and the application branch still differed at the boundary. The exact family-level distributions changed substantially, so the two runs are not numerically equivalent.",
  "",
  "This strengthens the narrow robustness claim: the observed effect does not depend on either the explicit identifier instruction or a question that asks which description fits best. It remains post-confirmatory supporting evidence, not a new preregistered confirmatory result or proof that every reasonable key substitution will matter.",
);

await writeFile(path.join(operationalQuestionDir, "question-ablation-comparison.json"), `${JSON.stringify(comparison, null, 2)}\n`);
await writeFile(path.join(operationalQuestionDir, "question-ablation-comparison.md"), `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
