#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "experiments/low-retrieved-context/results");
const OUT_MD = path.join(ROOT, "experiments/low-retrieved-context/results/publication-summary.md");
const OUT_CSV = path.join(ROOT, "experiments/low-retrieved-context/results/publication-summary.csv");

const CONTEXT_LABELS = new Map([
  ["fact_only", "Fact only"],
  ["retrieved_5_gift_card", "$5 gift card context"],
  ["retrieved_100000_contract", "$100k contract context"],
]);

const CONTEXT_ORDER = ["fact_only", "retrieved_5_gift_card", "retrieved_100000_contract"];
const MODEL_ORDER = ["gpt-4.1", "gpt-4.1-mini", "gemini-3.5-flash-lite", "gemini-3.6-flash"];

function money(value) {
  return "$" + Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function percent(summary) {
  return summary ? `${(summary.lowPct * 100).toFixed(1)}%` : "";
}

function estimate(band) {
  if (band.unbracketed) return `>${money(band.high)} in tested range`;
  if (band.lowLabel === "INVALID" || band.highLabel === "INVALID") return "failed";
  return `${money(band.low)} to ${money(band.high)}`;
}

function midpoint(band) {
  if (band.unbracketed || band.lowLabel === "INVALID" || band.highLabel === "INVALID") return "";
  return money((Number(band.low) + Number(band.high)) / 2);
}

function contextRank(contextId) {
  const index = CONTEXT_ORDER.indexOf(contextId);
  return index === -1 ? CONTEXT_ORDER.length : index;
}

function modelRank(model) {
  const index = MODEL_ORDER.indexOf(model);
  return index === -1 ? MODEL_ORDER.length : index;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function cleanRunDirs() {
  const entries = await readdir(RESULTS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.includes("publication-clean") && entry.name.endsWith("-low"))
    .map((entry) => path.join(RESULTS_DIR, entry.name))
    .filter((runDir) => existsSync(path.join(runDir, "threshold-bands.json")))
    .sort();
}

async function collect() {
  const rows = [];
  for (const runDir of await cleanRunDirs()) {
    const metadata = await readJson(path.join(runDir, "metadata.json"));
    const bands = await readJson(path.join(runDir, "threshold-bands.json"));
    const calls = (await readFile(path.join(runDir, "calls.jsonl"), "utf8")).split(/\r?\n/).filter(Boolean).length;
    for (const band of bands) rows.push({ ...band, runName: path.basename(runDir), runDir: path.relative(ROOT, runDir), provider: metadata.provider, commitHash: metadata.commitHash, createdAt: metadata.createdAt, calls });
  }
  return rows.sort((a, b) => contextRank(a.contextId) - contextRank(b.contextId) || modelRank(a.model) - modelRank(b.model) || a.model.localeCompare(b.model));
}

function renderCsv(rows) {
  const lines = ["context,model,provider,band_low,band_high,width,midpoint,lower_low_pct,upper_low_pct,unbracketed,run,calls,commit"];
  for (const row of rows) {
    lines.push([
      row.contextId,
      row.model,
      row.provider,
      row.low,
      row.high,
      row.width,
      midpoint(row).replace("$", "").replaceAll(",", ""),
      percent(row.lowProbability),
      percent(row.highProbability),
      Boolean(row.unbracketed),
      row.runName,
      row.calls,
      row.commitHash,
    ].join(","));
  }
  return `${lines.join("\n")}\n`;
}

function renderMarkdown(rows) {
  const runLines = [...new Map(rows.map((row) => [row.runName, row])).values()]
    .map((row) => `- \`${row.runName}\`: provider \`${row.provider}\`, ${row.calls} calls, commit \`${row.commitHash.slice(0, 7)}\`.`);
  const lines = [
    "# Retrieved Context Publication Clean Results",
    "",
    "Created from the clean publication runs only. Older exploratory and method-comparison runs remain in the repository, but should not be cited for article numbers unless explicitly labeled as historical context.",
    "",
    "Method: bounded probability band search over `$0..$20,000`, 10 samples per search point, 30 samples at final band endpoints, target boundary `P(LOW) = 50%`. The reported value is an empirical transition band, not an exact threshold.",
    "",
    "## Runs",
    "",
    ...runLines,
    "",
    "## Threshold Bands",
    "",
    "| Context | Model | Provider | Estimated band | Midpoint | Lower P(LOW) | Upper P(LOW) | Width | Note |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ];
  for (const row of rows) {
    const note = row.unbracketed ? "No crossing inside tested range." : "Estimated probability band.";
    lines.push(`| ${CONTEXT_LABELS.get(row.contextId) ?? row.contextId} | \`${row.model}\` | \`${row.provider}\` | ${estimate(row)} | ${midpoint(row) || ""} | ${percent(row.lowProbability)} | ${percent(row.highProbability)} | ${money(row.width)} | ${note} |`);
  }
  lines.push("");
  lines.push("## Article Use");
  lines.push("");
  lines.push("Use this table for article or appendix numbers. Do not mix it with the old scan/refinement runs when stating final values.");
  return `${lines.join("\n")}\n`;
}

const rows = await collect();
await mkdir(path.dirname(OUT_MD), { recursive: true });
await writeFile(OUT_MD, renderMarkdown(rows), "utf8");
await writeFile(OUT_CSV, renderCsv(rows), "utf8");
console.log(`Wrote ${path.relative(ROOT, OUT_MD)} and ${path.relative(ROOT, OUT_CSV)} from ${rows.length} bands.`);
