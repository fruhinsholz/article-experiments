#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const MANIFEST_PATH = "experiments/json-input-low/manifest.json";
const DEFAULT_OUT = "experiments/json-input-low/generated/publication-clean";
const TARGET_CONTEXTS = ["fact_only", "retrieved_100000_contract"];
const TARGET_FORMAT = "prose_same_block";
const THRESHOLD_USD = 100;

const CONTEXT_LABELS = new Map([
  ["fact_only", "No added context"],
  ["retrieved_100000_contract", "$100k retrieved context"],
]);

function usage() {
  return `Usage: node scripts/summarize-json-input-low-publication.mjs --runs <runDir,runDir> [--out <dir>]\n\nBuilds article-facing prompt-only, control, and runtime-enforced artifacts from fixed-grid JSON Input LOW runs.\n`;
}

function parseArgs(argv) {
  const args = { runs: [], out: DEFAULT_OUT, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case "--runs": args.runs = argv[++i].split(",").map((v) => v.trim()).filter(Boolean); break;
      case "--out": args.out = argv[++i]; break;
      case "--help":
      case "-h": args.help = true; break;
      default: throw new Error(`Unknown argument: ${argv[i]}`);
    }
  }
  return args;
}

function rel(p) {
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(rel(filePath), "utf8"));
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function money(value) {
  return `$${Number(value).toLocaleString("en-US")}`;
}

async function fileInfo(filePath) {
  const absolute = rel(filePath);
  const bytes = (await stat(absolute)).size;
  const data = await readFile(absolute);
  return { path: filePath, bytes, sha256: createHash("sha256").update(data).digest("hex") };
}

function runtimeLabel(amount) {
  return Number(amount) <= THRESHOLD_USD ? "LOW" : "NOT_LOW";
}

function promptErrorCount(row) {
  const amount = Number(row.amount);
  const expected = runtimeLabel(amount);
  const low = Number(row.low);
  const notLow = Number(row.not_low);
  const invalid = Number(row.invalid);
  return expected === "LOW" ? notLow + invalid : low + invalid;
}

async function loadRun(runDir) {
  const metadataPath = path.join(runDir, "metadata.json");
  const summaryPath = path.join(runDir, "summary.csv");
  const metadata = JSON.parse(await readFile(rel(metadataPath), "utf8"));
  const summaryRows = parseCsv(await readFile(rel(summaryPath), "utf8"));
  return { runDir, metadataPath, summaryPath, metadata, summaryRows };
}

function buildRows(runs) {
  const rows = [];
  const runtimeKeys = new Set();
  for (const run of runs) {
    for (const row of run.summaryRows) {
      if (!TARGET_CONTEXTS.includes(row.context_id) || row.format_id !== TARGET_FORMAT) continue;
      const total = Number(row.total);
      const amount = Number(row.amount);
      const low = Number(row.low);
      const notLow = Number(row.not_low);
      const invalid = Number(row.invalid);
      const expected = runtimeLabel(amount);
      const promptErrors = promptErrorCount(row);
      rows.push({
        model: row.model,
        response_models: row.response_models,
        condition: "prompt_only",
        context_id: row.context_id,
        format_id: row.format_id,
        amount,
        threshold_usd: THRESHOLD_USD,
        expected_label: expected,
        total,
        low,
        not_low: notLow,
        invalid,
        error_count: promptErrors,
        error_rate: total ? promptErrors / total : 0,
        low_rate: total ? low / total : 0,
        source_run_dir: run.runDir,
      });
      const runtimeKey = `${row.model}\u0000${amount}\u0000${total}`;
      if (!runtimeKeys.has(runtimeKey)) {
        runtimeKeys.add(runtimeKey);
        rows.push({
          model: row.model,
          response_models: "runtime_deterministic",
          condition: "runtime_enforced",
          context_id: "runtime_rule",
          format_id: "runtime_rule",
          amount,
          threshold_usd: THRESHOLD_USD,
          expected_label: expected,
          total,
          low: expected === "LOW" ? total : 0,
          not_low: expected === "NOT_LOW" ? total : 0,
          invalid: 0,
          error_count: 0,
          error_rate: 0,
          low_rate: expected === "LOW" ? 1 : 0,
          source_run_dir: run.runDir,
        });
      }
    }
  }
  return rows.sort((a, b) => `${a.model}:${a.condition}:${a.context_id}:${a.amount}`.localeCompare(`${b.model}:${b.condition}:${b.context_id}:${b.amount}`, undefined, { numeric: true }));
}

function renderCsv(rows) {
  const headers = ["model", "response_models", "condition", "context_id", "format_id", "amount", "threshold_usd", "expected_label", "total", "low", "not_low", "invalid", "error_count", "error_rate", "low_rate", "source_run_dir"];
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => row[header]).join(",")).join("\n")}\n`;
}

function indexRows(rows, model, condition, contextId) {
  return new Map(rows
    .filter((row) => row.model === model && row.condition === condition && row.context_id === contextId)
    .map((row) => [row.amount, row]));
}

function renderMarkdown(rows, provenance) {
  const models = [...new Set(rows.map((row) => row.model))].sort();
  const lines = [
    "# Publication-Clean LOW Boundary Probe",
    "",
    "This artifact compares the no-added-context control, the $100k retrieved-context condition, and runtime-owned enforcement on the same fixed amount grid. The runtime-enforced condition is deterministic and derived from the same cases; it does not spend additional model calls.",
    "",
    `Threshold: LOW iff refund_claim_amount_usd <= $${THRESHOLD_USD}.`,
    "Prompt format: " + TARGET_FORMAT + ".",
    "",
  ];
  for (const model of models) {
    lines.push(`## ${model}`, "", "| Amount | No-context LOW | No-context errors | $100k-context LOW | $100k-context errors | Runtime errors |", "| ---: | ---: | ---: | ---: | ---: | ---: |");
    const control = indexRows(rows, model, "prompt_only", "fact_only");
    const context = indexRows(rows, model, "prompt_only", "retrieved_100000_contract");
    const runtime = indexRows(rows, model, "runtime_enforced", "runtime_rule");
    const amounts = [...new Set([...control.keys(), ...context.keys(), ...runtime.keys()])].sort((a, b) => a - b);
    for (const amount of amounts) {
      const c = control.get(amount);
      const k = context.get(amount);
      const r = runtime.get(amount);
      lines.push(`| ${money(amount)} | ${c ? `${c.low}/${c.total}` : ""} | ${c ? `${c.error_count}/${c.total} (${pct(c.error_rate)})` : ""} | ${k ? `${k.low}/${k.total}` : ""} | ${k ? `${k.error_count}/${k.total} (${pct(k.error_rate)})` : ""} | ${r ? `${r.error_count}/${r.total}` : "0"} |`);
    }
    lines.push("");
  }
  lines.push(
    "## Method",
    "",
    "- The no-context control receives only the refund claim case and the LOW/NOT_LOW task.",
    "- The retrieved-context condition receives the same case plus a separate $100,000 contract note.",
    "- The expected operational rule is evaluated independently as `LOW iff amount <= 100`.",
    "- The runtime-enforced condition represents code-owned enforcement over the same amount values, not a second LLM condition.",
    "- The intended article claim is not a model ranking; it is that a consequence-bearing threshold should be owned by runtime code rather than prompt interpretation.",
    "",
    "## Provenance",
    "",
  );
  for (const file of provenance.source_files) lines.push(`- ${file.path} sha256=${file.sha256}`);
  return `${lines.join("\n")}\n`;
}

function renderSvg(rows) {
  const promptRows = rows.filter((row) => row.condition === "prompt_only");
  const series = [];
  for (const model of [...new Set(promptRows.map((row) => row.model))].sort()) {
    for (const contextId of TARGET_CONTEXTS) {
      const rowsForSeries = promptRows.filter((row) => row.model === model && row.context_id === contextId).sort((a, b) => a.amount - b.amount);
      if (rowsForSeries.length) series.push({ model, contextId, rows: rowsForSeries });
    }
  }
  const amounts = [...new Set(promptRows.map((row) => row.amount))].sort((a, b) => a - b);
  const width = 980;
  const height = 460;
  const margin = { left: 70, right: 30, top: 45, bottom: 78 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const x = (amount) => margin.left + (amounts.indexOf(amount) / Math.max(1, amounts.length - 1)) * plotW;
  const y = (rate) => margin.top + (1 - rate) * plotH;
  const colors = ["#2563eb", "#60a5fa", "#dc2626", "#f97316"];
  const dash = new Map([["fact_only", "6 4"], ["retrieved_100000_contract", ""]]);
  const lines = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`, `<title id="title">LOW boundary error rate by amount</title>`, `<desc id="desc">No-context control, $100k retrieved-context condition, and runtime enforcement error rates.</desc>`, `<rect width="100%" height="100%" fill="#ffffff"/>`, `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#111827"/>`, `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#111827"/>`];
  for (let tick = 0; tick <= 1.0001; tick += 0.25) {
    const yy = y(tick);
    lines.push(`<line x1="${margin.left}" y1="${yy}" x2="${width - margin.right}" y2="${yy}" stroke="#e5e7eb"/>`);
    lines.push(`<text x="${margin.left - 12}" y="${yy + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#374151">${Math.round(tick * 100)}%</text>`);
  }
  for (const amount of amounts) {
    const xx = x(amount);
    lines.push(`<text x="${xx}" y="${height - margin.bottom + 24}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#374151">${money(amount)}</text>`);
  }
  lines.push(`<text x="${width / 2}" y="${height - 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#111827">Refund claim amount</text>`);
  lines.push(`<text x="22" y="${height / 2}" transform="rotate(-90 22 ${height / 2})" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#111827">Error rate against $100 rule</text>`);
  lines.push(`<line x1="${x(100)}" y1="${margin.top}" x2="${x(100)}" y2="${height - margin.bottom}" stroke="#6b7280" stroke-dasharray="4 4"/>`);
  lines.push(`<text x="${x(100) + 6}" y="${margin.top + 15}" font-family="Arial, sans-serif" font-size="12" fill="#374151">$100 runtime threshold</text>`);
  series.forEach((item, index) => {
    const points = item.rows.map((row) => `${x(row.amount)},${y(row.error_rate)}`).join(" ");
    const color = colors[index % colors.length];
    const dashAttr = dash.get(item.contextId) ? ` stroke-dasharray="${dash.get(item.contextId)}"` : "";
    lines.push(`<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5"${dashAttr}/>`);
    for (const row of item.rows) lines.push(`<circle cx="${x(row.amount)}" cy="${y(row.error_rate)}" r="3.5" fill="${color}"/>`);
    const legendY = margin.top + index * 22;
    lines.push(`<line x1="${width - 330}" y1="${legendY}" x2="${width - 305}" y2="${legendY}" stroke="${color}" stroke-width="2.5"${dashAttr}/>`);
    lines.push(`<text x="${width - 298}" y="${legendY + 4}" font-family="Arial, sans-serif" font-size="12" fill="#111827">${item.model}, ${CONTEXT_LABELS.get(item.contextId)}</text>`);
  });
  lines.push(`<line x1="${margin.left}" y1="${y(0)}" x2="${width - margin.right}" y2="${y(0)}" stroke="#059669" stroke-width="2" stroke-dasharray="8 4"/>`);
  lines.push(`<text x="${width - 298}" y="${margin.top + series.length * 22 + 4}" font-family="Arial, sans-serif" font-size="12" fill="#111827">runtime-enforced: 0%</text>`);
  lines.push(`</svg>`);
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(usage()); return; }
  if (!args.runs.length) {
    const manifest = await readJson(MANIFEST_PATH);
    const config = manifest.publication_clean_table;
    if (!config) throw new Error("Pass --runs <runDir,runDir> or define manifest.publication_clean_table.");
    const runsById = new Map(manifest.runs.map((run) => [run.id, run]));
    args.runs = [...new Set(config.rows
      .filter((row) => TARGET_CONTEXTS.includes(row.context_id ?? "retrieved_100000_contract") && (row.format_id ?? config.format_id) === TARGET_FORMAT)
      .flatMap((row) => [row.control_run_id, row.context_run_id])
      .filter(Boolean))]
      .map((runId) => {
        const run = runsById.get(runId);
        if (!run) throw new Error(`Missing run in manifest: ${runId}`);
        return run.run_dir;
      });
  }
  const runs = [];
  for (const runDir of args.runs) runs.push(await loadRun(runDir));
  const rows = buildRows(runs);
  if (!rows.length) throw new Error(`No rows found for contexts ${TARGET_CONTEXTS.join(",")} and format ${TARGET_FORMAT}.`);
  const outDir = rel(args.out);
  await mkdir(outDir, { recursive: true });
  const sourceFiles = [];
  for (const run of runs) {
    sourceFiles.push(await fileInfo(run.metadataPath));
    sourceFiles.push(await fileInfo(run.summaryPath));
    sourceFiles.push(await fileInfo(path.join(run.runDir, "calls.jsonl")));
  }
  const provenance = { schema_version: "json-input-low.publication-clean.v2", created_at: new Date().toISOString(), target_contexts: TARGET_CONTEXTS, target_format: TARGET_FORMAT, threshold_usd: THRESHOLD_USD, source_files: sourceFiles };
  await writeFile(path.join(outDir, "publication-clean-summary.csv"), renderCsv(rows), "utf8");
  await writeFile(path.join(outDir, "publication-clean-summary.md"), renderMarkdown(rows, provenance), "utf8");
  await writeFile(path.join(outDir, "publication-clean-chart.svg"), renderSvg(rows), "utf8");
  await writeFile(path.join(outDir, "publication-clean-provenance.json"), `${JSON.stringify({ ...provenance, rows }, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), outDir)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
