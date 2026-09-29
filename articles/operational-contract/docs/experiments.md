# Experiments

This is the audit trail for the article [When Model Judgment Becomes an Operational Contract](https://blog.fruhinsholz.com/articles/when-model-judgment-becomes-an-operational-contract/). Start here if you want to inspect the evidence without reading the whole repository.

The repository contains two article-grade experiments and one supplementary JSON-format probe. They are probes of hidden operational contracts, not benchmarks and not model rankings.

## What To Inspect First

1. Read the experiment READMEs:
   - [LOW Retrieved Context](../experiments/low-retrieved-context/)
   - [ENOUGH Evidence Sufficiency](../experiments/enough-evidence-sufficiency/)
   - [JSON Input LOW](../experiments/json-input-low/)
2. Check the generated figures:
   - [LOW price vs iteration figures](price-vs-iteration.md)
   - [ENOUGH threshold figures](enough-thresholds.md)
3. Inspect raw calls and generated summaries in the result directories listed below.
4. Use [docs/workflow.md](workflow.md) only when you want to rerun the experiments or regenerate the figures.

## Experiment 1: LOW Retrieved Context

Question: can the vague label `LOW` hide a dollar threshold, and can nearby retrieved context move that threshold while the actual refund case stays unchanged?

Current clean result directories:

- [OpenAI gpt-4.1 and gpt-4.1-mini](../experiments/low-retrieved-context/results/2026-07-28T00-02-02-696Z-publication-clean-openai-low/)
- [OpenAI gpt-5.5 and gpt-5.6](../experiments/low-retrieved-context/results/2026-07-29T18-47-12-806Z-publication-clean-openai-gpt55-gpt56-max1024-low/)
- [Gemini 3.5 and 3.6](../experiments/low-retrieved-context/results/2026-07-28T00-13-22-919Z-publication-clean-gemini-low/)

Important files:

- Script: [src/low-retrieved-context.mjs](../src/low-retrieved-context.mjs)
- Prompt spec: [specs/low.md](../specs/low.md)
- Retrieved-context fixture: [specs/low-retrieved-context.md](../specs/low-retrieved-context.md)
- Shared harness: [src/shared/harness.mjs](../src/shared/harness.mjs)

Each result directory contains raw `calls.jsonl`, `metadata.json`, exact prompt templates, fixture data, threshold bands, summaries, and analysis notes. The raw calls are the durable evidence. Markdown, CSV, and SVG files are generated views over those calls.

Minimal reproduction path:

```bash
npm install
npm run thresholds:low:retrieved-context -- --models gpt-4.1-mini,gpt-4.1 --contexts all --samples 10 --refine-samples 30 --epochs 10 --max 20000 --max-calls 2000 --gzip-jsonl --label publication-clean-openai
npm run results:price-iteration
```

## Supplementary Probe: JSON Input LOW

Question: if the same `LOW` refund classifier receives retrieved context and case data in flat or typed JSON, does that structure remove the movement of the implicit dollar boundary?

Current consolidated summary:

Current article-facing provenance:

- Manifest: [experiments/json-input-low/manifest.json](../experiments/json-input-low/manifest.json)
- Generated article table: [experiments/json-input-low/generated/article-table.md](../experiments/json-input-low/generated/article-table.md)
- Generated table data and hashes: [experiments/json-input-low/generated/article-table.json](../experiments/json-input-low/generated/article-table.json)
- Source runs: the manifest-declared OpenAI gpt-5.5/gpt-5.6 fixed-grid run plus Gemini `$100k` dense and `$5` check runs.

Historical and supporting summary:

- [OpenAI and Gemini JSON-format result summary](../experiments/json-input-low/results/2026-08-01-json-format-results-summary/summary.md)

Important files:

- Script: [src/json-input-low.mjs](../src/json-input-low.mjs)
- Table generator: [scripts/generate-json-input-low-table.mjs](../scripts/generate-json-input-low-table.mjs)
- README: [experiments/json-input-low/README.md](../experiments/json-input-low/README.md)
- Shared harness: [src/shared/harness.mjs](../src/shared/harness.mjs)

This probe is not a replacement for the main LOW experiment. It checks a practical formatting question: separating fields in JSON can make a prompt cleaner, but the tested models still interpreted those fields together.

Raw JSON probe runs are retained in place. Article-facing values come from the manifest-declared source run and are regenerated with:

```bash
npm run results:json-input-low:table
npm run results:json-input-low:table:check
```

## Experiment 2: ENOUGH Evidence Sufficiency

Question: can the vague label `ENOUGH` hide a sufficiency policy over evidence count and evidence strength?

Current clean result directories:

- [OpenAI gpt-4.1 and gpt-4.1-mini](../experiments/enough-evidence-sufficiency/results/2026-07-28T03-26-10-470Z-publication-clean-openai-enough-enough/)
- [OpenAI gpt-5.5 and gpt-5.6](../experiments/enough-evidence-sufficiency/results/2026-07-29T19-37-52-355Z-publication-clean-openai-gpt55-gpt56-enough-max1024-enough/)
- [Gemini 3.5 and 3.6](../experiments/enough-evidence-sufficiency/results/2026-07-28T03-20-39-966Z-publication-clean-gemini-enough-enough/)

Important files:

- Script: [src/enough.mjs](../src/enough.mjs)
- Prompt spec: [specs/enough.md](../specs/enough.md)
- Shared harness: [src/shared/harness.mjs](../src/shared/harness.mjs)

Each result directory contains raw `calls.jsonl`, `metadata.json`, exact prompt templates, fixture data, threshold files, summaries, and analysis notes. The raw calls are the durable evidence.

Minimal reproduction path:

```bash
npm install
npm run thresholds:enough -- --models gpt-4.1-mini,gpt-4.1 --mode contract --samples 10 --epochs 7 --max-calls 400 --gzip-jsonl --label publication-clean-openai-enough
npm run results:enough-thresholds
```

## What Not To Conclude

- Do not treat these numbers as universal model thresholds.
- Do not treat cross-model differences as a leaderboard.
- Do not infer causality from one prompt wording beyond the tested surface.
- Do not use the result as a business policy.

The claim is narrower and more useful: if a consequence-bearing boundary can be moved by context, model version, prompt wording, or evidence layout, then the boundary is an operational contract. Own it outside the prompt.

## Use This In Your Own System

The reusable review artifacts are [skills/prompt-contract-audit](../skills/prompt-contract-audit/) and [experimental/prompt-threshold-map](../experimental/prompt-threshold-map/). The audit skill finds prompts or agent instructions where a model decides a threshold, sufficiency rule, safety boundary, routing rule, permission rule, publication rule, deletion rule, or spend boundary. The threshold-map skill then turns exact labels and nearby numeric gates into a testable map.

Use them to find candidates for review and map the labels or thresholds that carry them. Then write the boundary as code, schema, policy, tests, or versioned configuration before it controls production consequences.
