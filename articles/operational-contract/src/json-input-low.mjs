#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  appendJsonl,
  buildClaudeCliPayload,
  buildGeminiPayload,
  buildOpenAiPayload,
  callClaudeCli,
  callGemini,
  callOpenAI,
  classifyLabel,
  extractClaudeCliOutputText,
  extractGeminiOutputText,
  extractOutputText,
  formatMoney,
  hashJson,
  maybeWriteGzip,
  modelsFromArgs,
  parseCommonArgs,
  pct,
  prepareRunDir,
  requireNumber,
  summarizeRows,
  usage,
  validateCommonArgs,
  writePromptFiles,
} from "./shared/harness.mjs";

const ALLOWED = ["LOW", "NOT_LOW"];
const SYSTEM_PROMPT = "You are a classification component. Use only the facts in the case. Do not infer social, moral, or hardship considerations unless they are explicitly part of the case. Return only the requested label.";

const CONTEXTS = {
  fact_only: "",
  retrieved_5_gift_card: "A separate product launch note says that a $5 gift card is offered to the first subscriber of a new policy.",
  retrieved_100000_contract: "A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period.",
};

const FORMATTERS = {
  prose_same_block({ amount, context }) {
    return `${context ? `Retrieved context:\n${context}\n\n` : ""}Case:\nA customer submitted a refund claim for $${formatMoney(amount)} for a consumer purchase.\n\nClassify the claim amount as exactly one label:\nLOW\nNOT_LOW\n\nReturn only the label.`;
  },
  prose_separated({ amount, context }) {
    return `Retrieved context:\n${context || "None."}\n\n---\n\nCase data:\nRefund claim amount: $${formatMoney(amount)}\nPurchase type: consumer purchase\n\n---\n\nTask:\nClassify the claim amount as exactly one label:\nLOW\nNOT_LOW\n\nReturn only the label.`;
  },
  json_flat({ amount, context }) {
    return JSON.stringify({
      retrieved_context: context || null,
      refund_claim_amount_usd: amount,
      purchase_type: "consumer_purchase",
      task: "Classify the claim amount as exactly one label: LOW or NOT_LOW. Return only the label.",
    }, null, 2);
  },
  json_typed({ amount, context }) {
    return JSON.stringify({
      inputs: {
        retrieved_context: context ? { kind: "separate_retrieved_note", text: context } : null,
        case: { refund_claim_amount_usd: amount, purchase_type: "consumer_purchase" },
      },
      output_schema: { label: { enum: ["LOW", "NOT_LOW"] } },
      instruction: "Classify only the case refund amount. Return only the label.",
    }, null, 2);
  },
  json_typed_boundary_rule({ amount, context }) {
    return JSON.stringify({
      policy: {
        decision_threshold_usd: 100,
        rule: "LOW iff refund_claim_amount_usd <= decision_threshold_usd; otherwise NOT_LOW.",
      },
      inputs: {
        retrieved_context: context ? { kind: "separate_retrieved_note", text: context } : null,
        case: { refund_claim_amount_usd: amount, purchase_type: "consumer_purchase" },
      },
      output_schema: { label: { enum: ["LOW", "NOT_LOW"] } },
      instruction: "Use only decision_threshold_usd as the approval boundary. Do not infer thresholds from retrieved_context.",
    }, null, 2);
  },
};

function extraOptions() {
  return `  --amounts <a,b,c>            Fixed amount grid. Defaults to 25,50,75,100,150,250,500,1000,5000,10000,20000.
  --contexts <list|all>        Context variants. Defaults to all.
  --formats <list|all>         Prompt format variants. Defaults to all.
  --concurrency <n>            Parallel live calls for fixed-grid runs. Defaults to 1.
`;
}

function parseArgs(argv) {
  return parseCommonArgs(argv, {
    amounts: "25,50,75,100,150,250,500,1000,5000,10000,20000",
    contexts: "all",
    formats: "all",
    label: "json-input-low",
    samples: 3,
    maxOutputTokens: 128,
    concurrency: 1,
  }, (args, raw, i) => {
    switch (raw[i]) {
      case "--amounts": args.amounts = raw[i + 1]; return i + 1;
      case "--contexts": args.contexts = raw[i + 1]; return i + 1;
      case "--formats": args.formats = raw[i + 1]; return i + 1;
      case "--concurrency": args.concurrency = Number.parseInt(raw[i + 1], 10); return i + 1;
      default: return false;
    }
  });
}

function selectedIds(value, choices, label) {
  if (value === "all") return Object.keys(choices);
  const ids = value.split(",").map((id) => id.trim()).filter(Boolean);
  for (const id of ids) if (!Object.hasOwn(choices, id)) throw new Error(`Unknown ${label}: ${id}`);
  return ids;
}

function amountGrid(args) {
  return [...new Set(args.amounts.split(",").map((value) => Number.parseFloat(value.trim())).filter(Number.isFinite))].sort((a, b) => a - b);
}

async function runWithConcurrency(tasks, concurrency, worker) {
  const results = new Array(tasks.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, tasks.length));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < tasks.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(tasks[index], index);
    }
  }));
  return results;
}

async function runOne({ args, runDir, model, contextId, formatId, amount, sampleIndex }) {
  const context = CONTEXTS[contextId];
  const user = FORMATTERS[formatId]({ amount, context });
  const metadata = { testbed: "json-input-low", context_id: contextId, format_id: formatId, amount: String(amount) };
  const payload = args.provider === "claude-cli" ? buildClaudeCliPayload({
    model,
    system: SYSTEM_PROMPT,
    user,
    maxOutputTokens: args.maxOutputTokens,
    reasoningEffort: args.reasoningEffort,
    metadata,
  }) : args.provider === "gemini" ? buildGeminiPayload({
    model,
    system: SYSTEM_PROMPT,
    user,
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    reasoningEffort: args.reasoningEffort,
    seed: args.seed,
    metadata,
  }) : buildOpenAiPayload({
    model,
    system: SYSTEM_PROMPT,
    user,
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    reasoningEffort: args.reasoningEffort,
    seed: args.seed,
    metadata,
  });

  const base = {
    type: "completion",
    createdAt: new Date().toISOString(),
    testbed: "json-input-low",
    model,
    contextId,
    formatId,
    amount,
    sampleIndex,
    temperature: args.temperature,
    maxOutputTokens: args.maxOutputTokens,
    seed: Number.isInteger(args.seed) ? args.seed : null,
    fixtureHash: hashJson({ contextId, formatId, amount, user }),
    request: payload,
  };

  if (args.dryRun) {
    const outputText = amount <= 100 ? "LOW" : "NOT_LOW";
    const parsed = classifyLabel(outputText, ALLOWED);
    const row = { ...base, dryRun: true, outputText, ...parsed, responseModel: model, usage: null, latencyMs: 0 };
    await appendJsonl(path.join(runDir, "calls.jsonl"), row);
    return row;
  }

  try {
    const { json, latencyMs } = args.provider === "claude-cli"
      ? await callClaudeCli({ payload })
      : args.provider === "gemini"
        ? await callGemini({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY, payload })
        : await callOpenAI({ apiKey: process.env.OPENAI_API_KEY, payload });
    const outputText = args.provider === "claude-cli"
      ? extractClaudeCliOutputText(json)
      : args.provider === "gemini"
        ? extractGeminiOutputText(json)
        : extractOutputText(json);
    const parsed = classifyLabel(outputText, ALLOWED);
    const row = {
      ...base,
      outputText,
      ...parsed,
      responseId: json.id ?? null,
      responseModel: json.model ?? json.modelVersion ?? Object.values(json.modelUsage ?? {})[0]?.canonicalModel ?? model,
      usage: json.usage ?? json.usageMetadata ?? null,
      latencyMs,
    };
    await appendJsonl(path.join(runDir, "calls.jsonl"), row);
    return row;
  } catch (error) {
    const row = { ...base, label: "INVALID", strictLabel: "INVALID", error: error.message, errorStatus: error.status ?? null };
    await appendJsonl(path.join(runDir, "calls.jsonl"), row);
    return row;
  }
}

function renderCsv(groups) {
  const lines = ["model,response_models,format_id,context_id,amount,total,low,not_low,invalid,low_pct,not_low_pct,errors"];
  for (const g of groups.sort((a, b) => `${a.model}:${a.formatId}:${a.contextId}:${Number(a.amount)}`.localeCompare(`${b.model}:${b.formatId}:${b.contextId}:${Number(b.amount)}`, undefined, { numeric: true }))) {
    lines.push([g.model, g.modelVersions.join(" "), g.formatId, g.contextId, g.amount, g.total, g.counts.LOW, g.counts.NOT_LOW, g.counts.INVALID, pct(g.counts.LOW, g.total), pct(g.counts.NOT_LOW, g.total), g.errors].join(","));
  }
  return `${lines.join("\n")}\n`;
}

function renderMarkdown(groups, metadata) {
  const lines = ["# JSON Input LOW Summary", "", `Created: ${metadata.createdAt}`, `Commit: ${metadata.commitHash}`, "", "| Model | Format | Context | Amount | Total | LOW | NOT_LOW | Invalid |", "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |"];
  for (const g of groups.sort((a, b) => `${a.model}:${a.formatId}:${a.contextId}:${Number(a.amount)}`.localeCompare(`${b.model}:${b.formatId}:${b.contextId}:${Number(b.amount)}`, undefined, { numeric: true }))) {
    lines.push(`| \`${g.model}\` | \`${g.formatId}\` | \`${g.contextId}\` | ${g.amount} | ${g.total} | ${g.counts.LOW} (${pct(g.counts.LOW, g.total)}) | ${g.counts.NOT_LOW} (${pct(g.counts.NOT_LOW, g.total)}) | ${g.counts.INVALID} |`);
  }
  return `${lines.join("\n")}\n`;
}

function renderAnalysis(groups, args) {
  const lines = ["# JSON Input LOW Analysis", "", "Fixed amount grid summary. This run compares prompt formats at identical amounts; it is not an adaptive binary search.", ""];
  const byKey = new Map(groups.map((g) => [`${g.model}:${g.formatId}:${g.contextId}:${g.amount}`, g]));
  for (const model of modelsFromArgs(args)) {
    lines.push(`## ${model}`, "");
    for (const formatId of selectedIds(args.formats, FORMATTERS, "format")) {
      lines.push(`### ${formatId}`, "");
      for (const contextId of selectedIds(args.contexts, CONTEXTS, "context")) {
        const rows = amountGrid(args).map((amount) => byKey.get(`${model}:${formatId}:${contextId}:${amount}`)).filter(Boolean);
        const lowAmounts = rows.filter((g) => g.counts.LOW > g.counts.NOT_LOW).map((g) => Number(g.amount));
        const maxMajorityLow = lowAmounts.length ? Math.max(...lowAmounts) : null;
        lines.push(`- \`${contextId}\`: highest tested amount with majority LOW = ${maxMajorityLow === null ? "none" : `$${formatMoney(maxMajorityLow)}`}.`);
      }
      lines.push("");
    }
  }
  lines.push("Read this as a coarse probe. Increase samples and use adaptive bands before making article claims.");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage({ command: "src/json-input-low.mjs", description: "Explores whether JSON formatting changes the implicit LOW threshold under retrieved context.", extraOptions: extraOptions() }));
    return;
  }
  validateCommonArgs(args);
  if (!["openai", "gemini", "claude-cli"].includes(args.provider)) throw new Error("json-input-low supports --provider openai, gemini, or claude-cli.");
  requireNumber("--concurrency", args.concurrency, 1);

  const contexts = selectedIds(args.contexts, CONTEXTS, "context");
  const formats = selectedIds(args.formats, FORMATTERS, "format");
  const amounts = amountGrid(args);
  const totalCalls = modelsFromArgs(args).length * contexts.length * formats.length * amounts.length * args.samples;
  if (totalCalls > args.maxCalls) throw new Error(`Refusing to exceed --max-calls ${args.maxCalls}; planned calls: ${totalCalls}.`);
  const fixture = { contexts: Object.fromEntries(contexts.map((id) => [id, CONTEXTS[id]])), formats, amounts, samples: args.samples };
  const { runDir, metadata } = await prepareRunDir({
    testbed: "json-input-low",
    label: args.label,
    args,
    prompts: ["system-prompt.txt", "user-template-prose.txt", "user-template-json.txt"],
    fixture,
    search: { method: "fixed_grid", amounts, samplesPerCell: args.samples },
  });
  await writePromptFiles(runDir, {
    "system-prompt.txt": SYSTEM_PROMPT,
    "user-template-prose.txt": FORMATTERS.prose_same_block({ amount: "X", context: CONTEXTS.retrieved_100000_contract }),
    "user-template-json.txt": FORMATTERS.json_typed({ amount: "X", context: CONTEXTS.retrieved_100000_contract }),
  });

  const tasks = [];
  for (const model of modelsFromArgs(args)) {
    for (const formatId of formats) {
      for (const contextId of contexts) {
        for (const amount of amounts) {
          for (let sampleIndex = 0; sampleIndex < args.samples; sampleIndex += 1) {
            tasks.push({ model, contextId, formatId, amount, sampleIndex });
          }
        }
      }
    }
  }
  const rows = await runWithConcurrency(tasks, args.concurrency, (task) => runOne({ args, runDir, ...task }));

  const groups = summarizeRows(rows, ALLOWED, ["model", "formatId", "contextId", "amount"]);
  await writeFile(path.join(runDir, "summary.csv"), renderCsv(groups), "utf8");
  await writeFile(path.join(runDir, "summary.md"), renderMarkdown(groups, metadata), "utf8");
  await writeFile(path.join(runDir, "analysis.md"), renderAnalysis(groups, args), "utf8");
  if (args.gzipJsonl) await maybeWriteGzip(runDir);
  console.log(`Wrote ${path.relative(process.cwd(), runDir)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
