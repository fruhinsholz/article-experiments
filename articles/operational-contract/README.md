# Prompt Contract Experiments

This repository contains the reproducible evidence behind [When Model Judgment Becomes an Operational Contract](https://blog.fruhinsholz.com/articles/when-model-judgment-becomes-an-operational-contract/). The article argues that prompts can hide operational contracts: when model judgment controls a consequence-bearing value, the boundary should be externalized, pinned, versioned, and enforced outside the model.

The repository is intentionally narrow. It is not a benchmark suite and it is not a general prompt-bias archive. It keeps only the experiments used by the article, the scripts needed to reproduce them, the latest clean result sets, generated result images, generated article tables, and a downloadable skill for finding similar contract-shaped risks, plus an experimental protocol for context-influence benches around exact labels and thresholds.

The article uses two kinds of examples. First, the `LOW` refund experiment shows that a vague label can hide a dollar threshold. The same refund case is classified under three context conditions: fact only, nearby context mentioning a `$5` gift card, and nearby context mentioning a `$100,000` contract. The tested case does not change, but the observed transition band for `LOW` moves.

Second, the `ENOUGH` evidence experiment shows the same pattern for sufficiency judgment. A prompt asks whether ten scored evidence rows are enough. The experiment probes how many strong rows are needed, then how strong those rows must be. The point is not to recover the model's true rule. The point is that a production sufficiency rule should be owned by code and policy, not implied by the word `ENOUGH`.

## Experiments

If you came from the article and only want to check the evidence, start with [docs/experiments.md](docs/experiments.md). It is the guided map: what to look at first, where the figures come from, where the raw calls live, and what the experiments do and do not prove. You can inspect the evidence without installing anything or rerunning the scripts.

Use [docs/workflow.md](docs/workflow.md) only when you want to rerun the experiments or maintain the generated outputs.

- [LOW Retrieved Context](experiments/low-retrieved-context/): refund amount classification with fact-only, `$5` gift-card, and `$100,000` contract context variants.
- [ENOUGH Evidence Sufficiency](experiments/enough-evidence-sufficiency/): two-phase probe for minimum evidence count and minimum active-row score.
- [JSON Input LOW](experiments/json-input-low/): supplementary probe for whether prose, raw JSON, or typed JSON formatting isolates the hidden `LOW` boundary before inference. Its article table is generated from a manifest.
- [Prompt Contract Audit Skill](skills/prompt-contract-audit/): a reusable skill for finding possible hidden prompt contracts in a codebase.
- [Experimental Prompt Threshold Map](experimental/prompt-threshold-map/): an experimental context-influence protocol for testing whether injected, irrelevant, ambiguous, or poison context moves a hidden boundary while the actual case stays fixed.

## Repository Layout

```text
README.md
experiments/
  low-retrieved-context/
    README.md
    results/
  enough-evidence-sufficiency/
    README.md
    results/
  json-input-low/
    README.md
    manifest.json
    generated/
    results/
specs/
  low.md
  low-retrieved-context.md
  enough.md
src/
  low-retrieved-context.mjs
  enough.mjs
  shared/harness.mjs
scripts/
images/results/
skills/prompt-contract-audit/
experimental/prompt-threshold-map/
docs/
```

## Setup

Use Node.js 20 or newer.

```bash
npm install
npm run check
```

Live runs need `OPENAI_API_KEY` or `GEMINI_API_KEY` in the environment. Do not commit secrets. On `eric-bee`, use the shared Infisical provider-key project instead of hand-maintained `.env.local` files:

```bash
token=$(sudo -n infisical-admin admin-login --plain --silent)
sudo -n infisical-admin run \
  --token "$token" \
  --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 \
  --env prod \
  --path /shared \
  -- npm run <script> -- <args>
```

The canonical secret location is documented in [infra/infisical/ai-provider-keys.md](infra/infisical/ai-provider-keys.md). The `us-blog/private/infisical-access.env` file points to the `Blog management` project, not to AI provider keys.

## Smoke Test

Run this before the full article reproduction commands. It checks that a fresh checkout can install, build the generated views, reach a live model provider, parse allowed labels, and write usable result files without spending the calls needed for the publication runs.

The commands below use Gemini because the sample is intentionally small. Use any equivalent configured provider if you are testing a different key.

```bash
npm install --package-lock=false
npm run check

token=$(sudo -n infisical-admin admin-login --plain --silent)
sudo -n infisical-admin run --token "$token" --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 --env prod --path /shared -- npm run thresholds:low:retrieved-context -- --provider gemini --models gemini-3.5-flash-lite --contexts fact_only --samples 1 --refine-samples 1 --epochs 1 --max-output-tokens 256 --reasoning-effort none --max-calls 20 --label smoke-gemini-low
sudo -n infisical-admin run --token "$token" --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 --env prod --path /shared -- npm run thresholds:enough -- --provider gemini --models gemini-3.5-flash-lite --mode contract --samples 1 --epochs 1 --max-output-tokens 256 --reasoning-effort none --max-calls 20 --label smoke-gemini-enough
npm run results:graphs
```

Expected result:

- `npm run check` exits successfully.
- The LOW smoke run writes a new directory under `experiments/low-retrieved-context/results/` and reports only `LOW`, `NOT_LOW`, or both.
- The ENOUGH smoke run writes a new directory under `experiments/enough-evidence-sufficiency/results/` and reports only `ENOUGH`, `NOT_ENOUGH`, or both.
- The generated summaries report `0` invalid labels, `0` truncations, and `0` request errors.
- `npm run results:graphs` leaves the committed publication figures and summaries unchanged. `git status --short` should show only the new smoke result directories, if you keep them.

This is only a health check. It does not replace the full commands below and should not be used as article evidence.

## Reproduce The Article Runs

LOW retrieved context:

```bash
npm run thresholds:low:retrieved-context -- --models gpt-4.1-mini,gpt-4.1 --contexts all --samples 10 --refine-samples 30 --epochs 10 --max 20000 --max-calls 2000 --gzip-jsonl --label publication-clean-openai
npm run thresholds:low:retrieved-context -- --models gpt-5.5,gpt-5.6 --contexts all --samples 10 --refine-samples 30 --epochs 10 --max 20000 --max-output-tokens 1024 --max-calls 2000 --gzip-jsonl --label publication-clean-openai-gpt55-gpt56-max1024
npm run thresholds:low:retrieved-context -- --provider gemini --models gemini-3.5-flash-lite,gemini-3.6-flash --contexts all --samples 10 --refine-samples 30 --epochs 10 --max 20000 --max-output-tokens 256 --reasoning-effort none --max-calls 2500 --gzip-jsonl --label publication-clean-gemini
```

ENOUGH evidence sufficiency:

```bash
npm run thresholds:enough -- --models gpt-4.1-mini,gpt-4.1 --mode contract --samples 10 --epochs 7 --max-calls 400 --gzip-jsonl --label publication-clean-openai-enough
npm run thresholds:enough -- --models gpt-5.5,gpt-5.6 --mode contract --samples 10 --epochs 7 --converge-width 0.25 --max-output-tokens 1024 --max-calls 400 --gzip-jsonl --label publication-clean-openai-gpt55-gpt56-enough-max1024
npm run thresholds:enough -- --provider gemini --models gemini-3.5-flash-lite,gemini-3.6-flash --mode contract --samples 10 --epochs 7 --max-output-tokens 256 --reasoning-effort none --max-calls 400 --gzip-jsonl --label publication-clean-gemini-enough
```

Regenerate figures and publication summaries:

```bash
npm run results:graphs
```

Regenerate only the JSON input article table:

```bash
npm run results:json-input-low:table
```

## Evidence Rule

The repository is the audit trail: exact prompts, fixtures, commands, model identifiers, raw calls, generated summaries, and figures. Start with [docs/experiments.md](docs/experiments.md).

Treat these results as probes of hidden operational boundaries, not model rankings. The raw calls in each experiment's `results/` directory are the durable evidence. Generated summaries, images, and article tables are convenience views over those calls. For JSON input tables, the manifest explains which batch is article-facing and which batches are retained as historical or supporting evidence.
