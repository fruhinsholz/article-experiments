#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_ROOT = path.join(ROOT, "experiments/low-retrieved-context/results");
const OUT_DIR = path.join(ROOT, "images/results/price-vs-iteration");
const INDEX_FILE = path.join(ROOT, "docs/price-vs-iteration.md");

const LABEL_COLORS = {
  LOW: "#0f766e",
  NOT_LOW: "#be123c",
  INVALID: "#e5e7eb",
};

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

function money(value) {
  return "$" + Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

async function readJsonl(file) {
  const raw = await readFile(file, "utf8");
  return raw.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
}

async function findRunDirs() {
  if (!existsSync(RESULTS_ROOT)) return [];
  const entries = await readdir(RESULTS_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(RESULTS_ROOT, entry.name))
    .filter((runDir) => existsSync(path.join(runDir, "threshold-bands.json")))
    .sort();
}

function groupRows(rows, runName) {
  const contextGroups = new Map();
  const modelGroups = new Map();
  for (const row of rows) {
    if (row.type !== "completion" || row.testbed !== "low" || !Number.isFinite(row.amount)) continue;
    const contextId = row.contextId ?? "unknown_context";
    const contextKey = `${runName}\t${row.model}\t${contextId}`;
    if (!contextGroups.has(contextKey)) contextGroups.set(contextKey, { runName, model: row.model, contextId, rows: [] });
    contextGroups.get(contextKey).rows.push(row);

    const modelKey = `${runName}\t${row.model}`;
    if (!modelGroups.has(modelKey)) modelGroups.set(modelKey, { runName, model: row.model, contextId: "all_contexts", rows: [] });
    modelGroups.get(modelKey).rows.push(row);
  }
  return [
    ...contextGroups.values(),
    ...[...modelGroups.values()].filter((group) => new Set(group.rows.map((row) => row.contextId ?? "unknown_context")).size > 1),
  ];
}

function buildSvg(group) {
  const rows = group.rows
    .slice()
    .sort(compareTraceRows);

  const xGroups = buildXGroups(rows);
  const maxXIndex = Math.max(1, xGroups.length - 1);
  const amounts = rows.map((row) => Math.max(1, row.amount));
  const minAmount = Math.max(1, Math.min(...amounts));
  const maxAmount = Math.max(...amounts, minAmount + 1);
  const logMin = Math.log10(minAmount);
  const logMax = Math.log10(maxAmount);
  const pad = Math.max(0.08, (logMax - logMin) * 0.08);

  const width = 920;
  const height = 520;
  const left = 92;
  const right = 96;
  const top = 72;
  const bottom = 102;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const x = (xIndex) => left + (xIndex / maxXIndex) * plotW;
  const y = (amount) => top + (1 - ((Math.log10(Math.max(1, amount)) - logMin + pad) / (logMax - logMin + pad * 2))) * plotH;

  const yTicks = logTicks(minAmount, maxAmount);
  const experimentBands = buildExperimentBands(xGroups);
  for (const band of experimentBands) {
    for (let index = band.start; index <= band.end; index += 1) {
      xGroups[index].label = `bucket ${index - band.start}`;
    }
  }

  const grid = [
    ...yTicks.map((tick) => `<line x1="${left}" y1="${y(tick).toFixed(1)}" x2="${width - right}" y2="${y(tick).toFixed(1)}" stroke="#e5e7eb"/><text x="${left - 10}" y="${y(tick) + 4}" text-anchor="end" font-size="11" fill="#475569">${escapeXml(money(tick))}</text>`),
    ...experimentBands.flatMap((band) => experimentTicks(band).map((tick) => `<line x1="${x(tick.xIndex).toFixed(1)}" y1="${top}" x2="${x(tick.xIndex).toFixed(1)}" y2="${height - bottom}" stroke="#f3f4f6"/><text x="${x(tick.xIndex).toFixed(1)}" y="${height - bottom + 22}" text-anchor="middle" font-size="11" fill="#64748b">${escapeXml(tick.label)}</text>`)),
    ...experimentBands.slice(1).map((band) => `<line x1="${x(band.start - 0.5).toFixed(1)}" y1="${top}" x2="${x(band.start - 0.5).toFixed(1)}" y2="${height - bottom}" stroke="#cbd5e1" stroke-dasharray="4 5"/>`),
  ].join("\n");

  const bandLabels = experimentBands.map((band) => {
    const center = (band.start + band.end) / 2;
    return `<text x="${x(center).toFixed(1)}" y="${height - bottom + 44}" text-anchor="middle" font-size="10" fill="#64748b">${escapeXml(experimentLabel(band))}</text>`;
  }).join("\n");

  const spark = [];
  for (const [groupIndex, xGroup] of xGroups.entries()) {
    const sorted = xGroup.rows.slice().sort((a, b) => a.sampleIndex - b.sampleIndex || a.amount - b.amount || String(a.createdAt).localeCompare(String(b.createdAt)));
    const centerX = x(xGroup.xIndex);
    const previousX = groupIndex > 0 ? x(xGroups[groupIndex - 1].xIndex) : left;
    const nextX = groupIndex < xGroups.length - 1 ? x(xGroups[groupIndex + 1].xIndex) : width - right;
    const bucketLeft = groupIndex > 0 ? (previousX + centerX) / 2 : left;
    const bucketRight = groupIndex < xGroups.length - 1 ? (centerX + nextX) / 2 : width - right;
    const availableW = Math.max(4, bucketRight - bucketLeft - 4);
    const barW = Math.max(1.8, Math.min(6.8, availableW / Math.max(1, sorted.length) - 1));
    const barH = 5;
    for (const [index, row] of sorted.entries()) {
      const sampleX = sorted.length <= 1
        ? centerX
        : bucketLeft + 2 + (index + 0.5) * (availableW / sorted.length);
      const fill = LABEL_COLORS[row.label] ?? LABEL_COLORS.INVALID;
      const title = `${group.model}, ${group.contextId}, ${xGroup.label}, epoch ${row.epoch}, sample ${row.sampleIndex + 1}, ${money(row.amount)}, ${row.label}`;
      spark.push(`<rect x="${(sampleX - barW / 2).toFixed(1)}" y="${(y(row.amount) - barH / 2).toFixed(1)}" width="${barW.toFixed(1)}" height="${barH}" rx="1" fill="${fill}" opacity="0.88"><title>${escapeXml(title)}</title></rect>`);
    }
  }

  const traceLines = buildTraceLineSegments(xGroups)
    .map((segment) => {
      const points = segment.map((xGroup) => {
        const amount = xGroup.rows[0]?.amount ?? 1;
        return `${x(xGroup.xIndex).toFixed(1)},${y(amount).toFixed(1)}`;
      }).join(" ");
      return `<polyline points="${points}" fill="none" stroke="#94a3b8" stroke-width="1.4" opacity="0.55"/>`;
    })
    .join("\n");

  const convergenceLabels = buildConvergenceLabels(experimentBands, xGroups, y, x, width - right);

  const labelLegend = [
    ["LOW", LABEL_COLORS.LOW],
    ["NOT_LOW", LABEL_COLORS.NOT_LOW],
    ["failed", LABEL_COLORS.INVALID],
  ].map(([label, color], index) => {
    const lx = width - right - 220 + index * 78;
    const ly = 42;
    return `<circle cx="${lx}" cy="${ly}" r="5" fill="${color}"/><text x="${lx + 10}" y="${ly + 4}" font-size="12" fill="#334155">${escapeXml(label)}</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(group.runName)} binary discovery trace</title>
<desc id="desc">Chronological binary threshold discovery for ${escapeXml(group.model)} and ${escapeXml(group.contextId)}. Independent contexts and probe phases are separated visually; lines are drawn only across comparable binary-search points. The y-axis is log-scaled refund amount. Green marks LOW, red marks NOT_LOW, and light gray marks invalid output.</desc>
<rect width="100%" height="100%" fill="#ffffff"/>
<text x="${left}" y="28" font-size="19" font-weight="700" fill="#0f172a">${escapeXml(group.model)} binary discovery</text>
<text x="${left}" y="50" font-size="12" fill="#475569">Run: ${escapeXml(group.runName)}. Context: ${escapeXml(group.contextId)}. Y-axis is logarithmic dollars.</text>
${labelLegend}
<rect x="${left}" y="${top}" width="${plotW}" height="${plotH}" fill="#ffffff"/>
${grid}
${traceLines}
${spark.join("\n")}
${convergenceLabels}
${bandLabels}
<text x="${left + plotW / 2}" y="${height - 36}" text-anchor="middle" font-size="12" fill="#334155">Samples within each 10-run bucket, reset at each experiment segment</text>
<text transform="translate(26 ${top + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="12" fill="#334155">Refund amount, log scale</text>
</svg>\n`;
}

function compareTraceRows(a, b) {
  return String(a.createdAt).localeCompare(String(b.createdAt))
    || a.epoch - b.epoch
    || a.amount - b.amount
    || a.sampleIndex - b.sampleIndex;
}

function buildXGroups(rows) {
  const groups = [];
  for (const row of rows) {
    const key = `${row.contextId ?? ""}\t${row.epoch}\t${row.amount}\t${row.candidateKind ?? ""}`;
    let group = groups.at(-1);
    if (group?.key !== key) group = null;
    if (!group) {
      group = {
        key,
        xIndex: groups.length,
        epoch: row.epoch,
        amount: row.amount,
        contextId: row.contextId ?? "unknown_context",
        rows: [],
      };
      group.label = `bucket ${group.xIndex}`;
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

function buildExperimentBands(groups) {
  const bands = [];
  for (const group of groups) {
    const previous = bands.at(-1);
    const phase = experimentPhase(group);
    if (previous?.contextId === group.contextId && previous?.phase === phase) {
      previous.end = group.xIndex;
    } else {
      bands.push({ contextId: group.contextId, phase, start: group.xIndex, end: group.xIndex });
    }
  }
  return bands;
}

function experimentTicks(band) {
  const length = band.end - band.start + 1;
  const offsets = length <= 3
    ? [...Array(length).keys()]
    : [0, Math.floor((length - 1) / 2), length - 1];
  return [...new Set(offsets)].map((offset) => ({
    xIndex: band.start + offset,
    label: `b${offset}`,
  }));
}

function buildConvergenceLabels(bands, groups, y, x, plotRight) {
  return bands
    .filter((band) => band.phase === "binary search")
    .map((band) => groups[band.end])
    .filter(Boolean)
    .map((group) => {
      const amount = group.rows[0]?.amount;
      if (!Number.isFinite(amount)) return "";
      const gx = x(group.xIndex);
      const gy = y(amount);
      const labelX = Math.min(gx + 12, plotRight + 10);
      const label = money(amount);
      return `<line x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${(labelX - 4).toFixed(1)}" y2="${gy.toFixed(1)}" stroke="#64748b" stroke-width="1"/><text x="${labelX.toFixed(1)}" y="${(gy + 4).toFixed(1)}" font-size="11" font-weight="700" fill="#0f172a">${escapeXml(label)}</text>`;
    })
    .join("\n");
}

function buildTraceLineSegments(groups) {
  const segments = [];
  let current = [];
  for (const group of groups) {
    const previous = current.at(-1);
    const comparable = group.rows[0]?.candidateKind === "binary_midpoint"
      && previous?.rows[0]?.candidateKind === "binary_midpoint"
      && previous.contextId === group.contextId;
    if (comparable) {
      current.push(group);
    } else {
      if (current.length > 1) segments.push(current);
      current = group.rows[0]?.candidateKind === "binary_midpoint" ? [group] : [];
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

function experimentPhase(group) {
  const kind = group.rows[0]?.candidateKind ?? "unknown";
  if (kind === "boundary_low" || kind === "boundary_high") return "boundary probes";
  if (kind === "binary_midpoint") return "binary search";
  return kind.replaceAll("_", " ");
}

function experimentLabel(band) {
  return shortContextLabel(band.contextId) + " / " + band.phase;
}

function shortContextLabel(contextId) {
  return String(contextId)
    .replace("retrieved_100000_contract", "100k contract")
    .replace("retrieved_5_gift_card", "5 gift card")
    .replace("fact_only", "fact only");
}

function logTicks(min, max) {
  const start = Math.floor(Math.log10(Math.max(1, min)));
  const end = Math.ceil(Math.log10(Math.max(1, max)));
  const ticks = [];
  for (let exponent = start; exponent <= end; exponent += 1) {
    for (const multiplier of [1, 2, 5]) {
      const value = multiplier * 10 ** exponent;
      if (value >= min && value <= max) ticks.push(value);
    }
  }
  return [...new Set(ticks)].sort((a, b) => a - b);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(INDEX_FILE), { recursive: true });

  const groups = [];
  for (const runDir of await findRunDirs()) {
    const callsFile = path.join(runDir, "calls.jsonl");
    if (!existsSync(callsFile)) continue;
    groups.push(...groupRows(await readJsonl(callsFile), path.basename(runDir)));
  }

  const written = [];
  for (const group of groups.filter((item) => item.rows.length > 0)) {
    const fileName = `${slug(group.runName)}__${slug(group.model)}__${slug(group.contextId)}.svg`;
    await writeFile(path.join(OUT_DIR, fileName), buildSvg(group), "utf8");
    written.push({ ...group, fileName });
  }

  const lines = ["# Binary Discovery Traces", ""];
  lines.push("Each SVG is generated from raw LOW test-bed JSONL. X is grouped into local buckets per experiment segment instead of a single global t0..tN sequence. Each bucket renders the ten samples as a short 5 px bar of non-overlapping rectangles. Y is refund amount on a log scale. Independent contexts and probe phases are separated visually. Lines are drawn only across comparable binary-search midpoint probes, never between unrelated boundary checks or different contexts. Binary-search segments annotate the final sampled amount at the right edge.");
  lines.push("");
  for (const item of written.sort((a, b) => a.fileName.localeCompare(b.fileName))) {
    lines.push(`- [${item.runName} / ${item.model} / ${item.contextId}](../images/results/price-vs-iteration/${item.fileName})`);
  }
  await writeFile(INDEX_FILE, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${written.length} binary-discovery SVGs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
