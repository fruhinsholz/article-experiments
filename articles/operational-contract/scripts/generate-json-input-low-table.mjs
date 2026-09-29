#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const MANIFEST_PATH = "experiments/json-input-low/manifest.json";

const CONTEXT_LABELS = new Map([
  ["fact_only", "No added context"],
  ["retrieved_5_gift_card", "$5 gift-card context"],
  ["retrieved_100000_contract", "$100k retrieved context"],
]);

const FORMAT_LABELS = new Map([
  ["prose_same_block", "Prose prompt"],
  ["json_typed_boundary_rule", "Typed JSON with explicit $100 rule"],
]);

function rel(...parts) {
  return path.join(ROOT, ...parts);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(rel(relativePath), "utf8"));
}

async function hashFile(relativePath) {
  const data = await readFile(rel(relativePath));
  return createHash("sha256").update(data).digest("hex");
}

function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
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
  return "$" + Number(value).toLocaleString("en-US");
}

function resultLabel({ kind, count, total, expectedLabel }) {
  if (count === null || total === null) return "Not run";
  if (count !== 0 && count !== total) return "Mixed";
  if (kind === "errors") return count === 0 ? "Correct" : "Incorrect";
  if (expectedLabel === "LOW") return count === total ? "Correct" : "Incorrect";
  if (expectedLabel === "NOT_LOW") return count === 0 ? "Correct" : "Incorrect";
  throw new Error(`Unsupported expected label: ${expectedLabel}`);
}

function renderResult({ kind, count, total, expectedLabel, includePercent = false }) {
  const label = resultLabel({ kind, count, total, expectedLabel });
  const value = count === null || total === null
    ? "n/a"
    : `${count}/${total}${includePercent ? ` (${pct(count / total)})` : ""}`;
  return `<span class="json-low-result"><span class="json-low-result__value">${value}</span><span class="json-low-result__label">${label}</span></span>`;
}

async function fileInfo(relativePath) {
  const info = await stat(rel(relativePath));
  return {
    path: relativePath,
    bytes: info.size,
    sha256: await hashFile(relativePath),
  };
}

function runtimeLabel(amount, thresholdUsd) {
  return Number(amount) <= thresholdUsd ? "LOW" : "NOT_LOW";
}

function promptErrorCount(row, thresholdUsd) {
  const expected = runtimeLabel(row.amount, thresholdUsd);
  const low = Number(row.low);
  const notLow = Number(row.not_low);
  const invalid = Number(row.invalid);
  return expected === "LOW" ? notLow + invalid : low + invalid;
}

function rowKey(row) {
  return `${row.model}\u0000${row.context_id}\u0000${row.format_id}\u0000${row.amount}`;
}

function runSummaryIndex(rows) {
  return new Map(rows.map((row) => [rowKey(row), row]));
}

function buildTableRows({ manifest, config, runIndexes }) {
  const thresholdUsd = config.threshold_usd;
  const tableRows = [];
  for (const rowSpec of config.rows) {
    const controlIndex = rowSpec.control_run_id ? runIndexes.get(rowSpec.control_run_id) : null;
    const contextIndex = runIndexes.get(rowSpec.context_run_id);
    const controlContextId = rowSpec.control_context_id ?? "fact_only";
    const contextId = rowSpec.context_id ?? "retrieved_100000_contract";
    const formatId = rowSpec.format_id ?? config.format_id;
    if (rowSpec.control_run_id && !controlIndex) throw new Error(`Missing control run index: ${rowSpec.control_run_id}`);
    if (!contextIndex) throw new Error(`Missing context run index: ${rowSpec.context_run_id}`);
    for (const amount of config.amounts) {
      const control = controlIndex?.byCell.get(`${rowSpec.model}\u0000${controlContextId}\u0000${formatId}\u0000${amount}`) ?? null;
      const context = contextIndex.byCell.get(`${rowSpec.model}\u0000${contextId}\u0000${formatId}\u0000${amount}`);
      if (rowSpec.control_run_id && !control) throw new Error(`Missing control row for ${rowSpec.model} ${formatId} ${controlContextId} amount ${amount}`);
      if (!context) throw new Error(`Missing context row for ${rowSpec.model} ${formatId} ${contextId} amount ${amount}`);
      const total = Number(context.total);
      const expected = runtimeLabel(amount, thresholdUsd);
      tableRows.push({
        model: rowSpec.model,
        provider: rowSpec.provider,
        section_id: rowSpec.section_id ?? contextId,
        section_label: rowSpec.section_label ?? CONTEXT_LABELS.get(contextId) ?? contextId,
        format_id: formatId,
        format_label: FORMAT_LABELS.get(formatId) ?? formatId,
        amount,
        threshold_usd: thresholdUsd,
        expected_label: expected,
        control: control ? {
          run_id: rowSpec.control_run_id,
          context_id: controlContextId,
          low: Number(control.low),
          not_low: Number(control.not_low),
          invalid: Number(control.invalid),
          total: Number(control.total),
          error_count: promptErrorCount(control, thresholdUsd),
        } : null,
        retrieved_context: {
          run_id: rowSpec.context_run_id,
          context_id: contextId,
          low: Number(context.low),
          not_low: Number(context.not_low),
          invalid: Number(context.invalid),
          total,
          error_count: promptErrorCount(context, thresholdUsd),
        },
        runtime_enforced: {
          low: expected === "LOW" ? total : 0,
          not_low: expected === "NOT_LOW" ? total : 0,
          invalid: 0,
          total,
          error_count: 0,
        },
      });
    }
  }
  return tableRows.sort((a, b) => `${a.section_id}:${a.model}:${a.format_id}:${a.amount}`.localeCompare(`${b.section_id}:${b.model}:${b.format_id}:${b.amount}`, undefined, { numeric: true }));
}

function renderMarkdown({ config, tableRows, provenanceHash }) {
  const sourceRunIds = [...new Set(tableRows.flatMap((row) => [row.control?.run_id, row.retrieved_context.run_id]).filter(Boolean))];
  const lines = [
    `<!-- generated:json-input-low-table manifest:${MANIFEST_PATH} source_runs:${sourceRunIds.join(",")} hash:${provenanceHash} -->`,
    "",
    "Publication-clean LOW boundary probe. Counts are generated from fixed-grid `n=100` runs. The table compares prompt-only classification under retrieved context with deterministic runtime enforcement. It intentionally reports raw counts instead of fold multipliers.",
    "",
    `Operational rule: \`LOW iff refund_claim_amount_usd <= ${config.threshold_usd}\`.`,
    `Default prompt format: \`${config.format_id}\`.`,
    "",
  ];
  for (const sectionId of [...new Set(tableRows.map((row) => row.section_id))]) {
    const sectionRows = tableRows.filter((row) => row.section_id === sectionId);
    lines.push(`## ${sectionRows[0].section_label}`, "");
    for (const model of [...new Set(sectionRows.map((row) => row.model))].sort()) {
      for (const formatId of [...new Set(sectionRows.filter((row) => row.model === model).map((row) => row.format_id))].sort()) {
        const rows = sectionRows.filter((item) => item.model === model && item.format_id === formatId).sort((a, b) => a.amount - b.amount);
        lines.push(`### ${model} - ${rows[0].format_label}`, "", "| Amount | Expected | Control LOW | Control errors | Context LOW | Context errors | Runtime errors |", "| ---: | --- | ---: | ---: | ---: | ---: | ---: |");
        for (const row of rows) {
          const cells = {
            controlLow: renderResult({
              kind: "low",
              count: row.control?.low ?? null,
              total: row.control?.total ?? null,
              expectedLabel: row.expected_label,
            }),
            controlErrors: renderResult({
              kind: "errors",
              count: row.control?.error_count ?? null,
              total: row.control?.total ?? null,
              expectedLabel: row.expected_label,
              includePercent: true,
            }),
            contextLow: renderResult({
              kind: "low",
              count: row.retrieved_context.low,
              total: row.retrieved_context.total,
              expectedLabel: row.expected_label,
            }),
            contextErrors: renderResult({
              kind: "errors",
              count: row.retrieved_context.error_count,
              total: row.retrieved_context.total,
              expectedLabel: row.expected_label,
              includePercent: true,
            }),
            runtimeErrors: renderResult({
              kind: "errors",
              count: row.runtime_enforced.error_count,
              total: row.runtime_enforced.total,
              expectedLabel: row.expected_label,
            }),
          };
          lines.push(`| ${money(row.amount)} | \`${row.expected_label}\` | ${cells.controlLow} | ${cells.controlErrors} | ${cells.contextLow} | ${cells.contextErrors} | ${cells.runtimeErrors} |`);
        }
        lines.push("");
      }
    }
  }
  lines.push("Caption: `Control` is the matched no-added-context run when available. `Context` is the retrieved-context condition named by the section. In error columns, `Correct` means `0/100` errors and `Incorrect` means `100/100` errors. In LOW columns, `Correct` depends on `Expected`: `100/100` LOW is correct for `LOW`, and `0/100` LOW is correct for `NOT_LOW`. `Mixed` means behavior was not stable across the 100 trials. `n/a` means not run or not applicable in this condition, not failure. `Runtime errors` are derived by applying the code-owned rule to the same amount grid, not by making another model call. Generated from `" + MANIFEST_PATH + "`.");
  lines.push("");
  lines.push(`<!-- /generated:json-input-low-table -->`);
  return `${lines.join("\n")}\n`;
}

async function main() {
  const check = process.argv.includes("--check");
  const manifest = await readJson(MANIFEST_PATH);
  const config = manifest.publication_clean_table;
  if (!config) throw new Error("manifest.publication_clean_table is required.");
  const runsById = new Map(manifest.runs.map((run) => [run.id, run]));
  const runIds = [...new Set(config.rows.flatMap((row) => [row.control_run_id, row.context_run_id]).filter(Boolean))];
  const runIndexes = new Map();
  for (const runId of runIds) {
    const run = runsById.get(runId);
    if (!run) throw new Error(`Missing run: ${runId}`);
    if (run.status !== "current") throw new Error(`Publication-clean source run is not current: ${runId}`);
    const summaryPath = path.join(run.run_dir, "summary.csv");
    runIndexes.set(runId, {
      run,
      summaryPath,
      metadataPath: path.join(run.run_dir, "metadata.json"),
      callsPath: path.join(run.run_dir, "calls.jsonl"),
      byCell: runSummaryIndex(parseCsv(await readFile(rel(summaryPath), "utf8"))),
    });
  }

  const tableRows = buildTableRows({ manifest, config, runIndexes });
  const manifestHash = await hashFile(MANIFEST_PATH);
  const sourceFiles = [];
  for (const runId of runIds) {
    const runIndex = runIndexes.get(runId);
    sourceFiles.push(
      { run_id: runId, ...(await fileInfo(runIndex.summaryPath)) },
      { run_id: runId, ...(await fileInfo(runIndex.metadataPath)) },
      { run_id: runId, ...(await fileInfo(runIndex.callsPath)) },
    );
  }
  const output = {
    schema_version: "json-input-low.article-table.v3",
    manifest_path: MANIFEST_PATH,
    manifest_sha256: manifestHash,
    source_run_ids: runIds,
    source_run_dirs: runIds.map((runId) => runsById.get(runId).run_dir),
    source_files: sourceFiles,
    contexts: Object.fromEntries((config.contexts ?? []).map((id) => [id, CONTEXT_LABELS.get(id) ?? id])),
    threshold_usd: config.threshold_usd,
    format_id: config.format_id,
    formats: [...new Set(tableRows.map((row) => row.format_id))],
    provenance_hash: hashJson({ manifestHash, runIds, sourceFiles, tableRows }),
    table_rows: tableRows,
  };
  const markdown = renderMarkdown({ config, tableRows, provenanceHash: output.provenance_hash });
  const jsonText = `${JSON.stringify(output, null, 2)}\n`;

  const markdownPath = config.outputs.markdown;
  const jsonPath = config.outputs.json;
  if (check) {
    const currentMarkdown = await readFile(rel(markdownPath), "utf8");
    const currentJson = await readFile(rel(jsonPath), "utf8");
    if (currentMarkdown !== markdown || currentJson !== jsonText) {
      throw new Error("Generated JSON input LOW table is stale. Run npm run results:json-input-low:table.");
    }
    console.log("JSON input LOW generated table is current.");
    return;
  }

  await mkdir(path.dirname(rel(markdownPath)), { recursive: true });
  await writeFile(rel(markdownPath), markdown, "utf8");
  await writeFile(rel(jsonPath), jsonText, "utf8");
  console.log(`Wrote ${markdownPath} and ${jsonPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
