#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_ROOT = path.join(ROOT, "experiments/enough-evidence-sufficiency/results");
const OUT_DIR = path.join(ROOT, "images/results/enough-thresholds");
const INDEX_FILE = path.join(ROOT, "docs/enough-thresholds.md");

const MODEL_COLORS = ["#0f766e", "#2563eb", "#be123c", "#7c3aed", "#c2410c", "#334155"];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "run";
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function findEnoughRuns() {
  if (!existsSync(RESULTS_ROOT)) return [];
  const entries = await readdir(RESULTS_ROOT, { withFileTypes: true });
  const runs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const runDir = path.join(RESULTS_ROOT, entry.name);
    const thresholdsFile = path.join(runDir, "enough-thresholds.json");
    if (!existsSync(thresholdsFile)) continue;
    runs.push({
      runName: entry.name,
      runDir,
      thresholdsFile,
      metadataFile: path.join(runDir, "metadata.json"),
    });
  }
  return runs.sort((a, b) => a.runName.localeCompare(b.runName));
}

function byModel(thresholds) {
  const result = new Map();
  for (const item of thresholds) {
    if (!result.has(item.model)) result.set(item.model, {});
    result.get(item.model)[item.mode] = item;
  }
  return [...result.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function fmt(value) {
  if (value === null || value === undefined || value === "") return "n/a";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return String(value);
}

function buildSvg({ runName, metadata, thresholds }) {
  const models = byModel(thresholds);
  const width = 960;
  const rowH = 72;
  const top = 86;
  const bottom = 64;
  const height = top + models.length * rowH + bottom;
  const left = 220;
  const countX = left;
  const qualityX = 575;
  const axisW = 285;
  const countScale = (value) => countX + (Number(value) / 10) * axisW;
  const qualityScale = (value) => qualityX + ((Number(value) - 1) / 9) * axisW;

  const rows = [];
  for (const [index, [model, item]] of models.entries()) {
    const y = top + index * rowH;
    const color = MODEL_COLORS[index % MODEL_COLORS.length];
    const count = item.evidence_count;
    const quality = item.quality;
    const countLow = count?.low ?? null;
    const countHigh = count?.high ?? null;
    const qualityLow = quality?.low ?? null;
    const qualityHigh = quality?.high ?? null;
    rows.push(`<text x="24" y="${y + 25}" font-size="13" font-weight="700" fill="#0f172a">${escapeXml(model)}</text>`);
    rows.push(`<text x="24" y="${y + 45}" font-size="11" fill="#64748b">${escapeXml(count?.candidates?.length ?? 0)} count candidates; ${escapeXml(quality?.candidates?.length ?? 0)} quality candidates</text>`);
    rows.push(`<line x1="${countX}" y1="${y + 24}" x2="${countX + axisW}" y2="${y + 24}" stroke="#cbd5e1" stroke-width="2"/>`);
    rows.push(`<line x1="${qualityX}" y1="${y + 24}" x2="${qualityX + axisW}" y2="${y + 24}" stroke="#cbd5e1" stroke-width="2"/>`);
    if (Number.isFinite(countLow) && Number.isFinite(countHigh)) {
      rows.push(`<rect x="${countScale(countLow)}" y="${y + 17}" width="${Math.max(2, countScale(countHigh) - countScale(countLow))}" height="14" rx="2" fill="${color}" opacity="0.82"><title>${escapeXml(`Evidence count band: ${fmt(countLow)} to ${fmt(countHigh)}`)}</title></rect>`);
      rows.push(`<text x="${countScale(countHigh) + 8}" y="${y + 28}" font-size="12" fill="#334155">${escapeXml(count?.unbracketed ? "unbracketed" : `>= ${fmt(count?.threshold)}`)}</text>`);
    }
    if (Number.isFinite(qualityLow) && Number.isFinite(qualityHigh)) {
      rows.push(`<rect x="${qualityScale(qualityLow)}" y="${y + 17}" width="${Math.max(2, qualityScale(qualityHigh) - qualityScale(qualityLow))}" height="14" rx="2" fill="${color}" opacity="0.82"><title>${escapeXml(`Quality score band: ${fmt(qualityLow)} to ${fmt(qualityHigh)}`)}</title></rect>`);
      rows.push(`<text x="${qualityScale(qualityHigh) + 8}" y="${y + 28}" font-size="12" fill="#334155">${escapeXml(quality?.unbracketed ? "unbracketed" : `>= ${fmt(quality?.threshold)}`)}</text>`);
    }
    rows.push(`<text x="${qualityX}" y="${y + 50}" font-size="11" fill="#64748b">${escapeXml(quality?.activeEvidenceCount ? `${quality.activeEvidenceCount} active rows, inactive rows at 1` : "")}</text>`);
  }

  const ticks = [];
  for (const value of [0, 2, 4, 6, 8, 10]) {
    ticks.push(`<line x1="${countScale(value)}" y1="62" x2="${countScale(value)}" y2="${height - bottom + 8}" stroke="#f1f5f9"/>`);
    ticks.push(`<text x="${countScale(value)}" y="70" text-anchor="middle" font-size="10" fill="#64748b">${value}</text>`);
  }
  for (const value of [1, 3, 5, 7, 9, 10]) {
    ticks.push(`<line x1="${qualityScale(value)}" y1="62" x2="${qualityScale(value)}" y2="${height - bottom + 8}" stroke="#f1f5f9"/>`);
    ticks.push(`<text x="${qualityScale(value)}" y="70" text-anchor="middle" font-size="10" fill="#64748b">${value}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">ENOUGH contract thresholds</title>
<desc id="desc">Two-phase ENOUGH threshold search. The left panel shows the minimum count of strong evidence rows. The right panel shows the minimum active-row score for that count.</desc>
<rect width="100%" height="100%" fill="#ffffff"/>
<text x="24" y="30" font-size="19" font-weight="700" fill="#0f172a">ENOUGH contract thresholds</text>
<text x="24" y="52" font-size="12" fill="#475569">Run: ${escapeXml(runName)}. Commit: ${escapeXml(metadata?.commitHash ?? "unknown")}. Majority over ${escapeXml(metadata?.samplesPerState ?? "n/a")} samples per candidate.</text>
<text x="${countX}" y="44" font-size="13" font-weight="700" fill="#334155">Minimum strong evidence rows</text>
<text x="${qualityX}" y="44" font-size="13" font-weight="700" fill="#334155">Minimum score for those rows</text>
${ticks.join("\n")}
${rows.join("\n")}
</svg>
`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(INDEX_FILE), { recursive: true });
  const written = [];
  for (const run of await findEnoughRuns()) {
    const thresholds = await readJson(run.thresholdsFile);
    const metadata = existsSync(run.metadataFile) ? await readJson(run.metadataFile) : null;
    const fileName = `${slug(run.runName)}.svg`;
    await writeFile(path.join(OUT_DIR, fileName), buildSvg({ runName: run.runName, metadata, thresholds }), "utf8");
    written.push({ runName: run.runName, fileName });
  }

  const lines = [
    "# ENOUGH Threshold Figures",
    "",
    "Each SVG is generated from `enough-thresholds.json`. The left band is the minimum number of strong evidence rows; the right band is the minimum score for that count.",
    "",
    ...written.map((item) => `- [${item.runName}](../images/results/enough-thresholds/${item.fileName})`),
  ];
  await writeFile(INDEX_FILE, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${written.length} ENOUGH threshold SVGs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
