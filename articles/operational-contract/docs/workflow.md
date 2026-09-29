# Workflow

This repo contains article-grade experiments for the Prompt Edits / Operational Contract article. Keep the main path small: source code, prompt specs, current clean result directories, generated figures, generated article tables, and the prompt-contract audit skill.

Use [docs/experiments.md](experiments.md) as the public evidence map. It lists the current clean run directories, the raw evidence files, figure indexes, reproduction paths, and limits.

## Running

```bash
npm install
npm run check
```

Live provider runs need `OPENAI_API_KEY` or `GEMINI_API_KEY` in the environment. Do not commit secrets.

On `eric-bee`, load shared provider keys from Infisical project `ai-provider-keys`, environment `prod`, path `/shared`. Run the target command under `infisical run`:

```bash
token=$(sudo -n infisical-admin admin-login --plain --silent)
sudo -n infisical-admin run \
  --token "$token" \
  --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 \
  --env prod \
  --path /shared \
  -- npm run <script> -- <args>
```

Do not use `us-blog/private/infisical-access.env` for these runs; it targets the `Blog management` project, not shared AI provider keys. See [infra/infisical/ai-provider-keys.md](../infra/infisical/ai-provider-keys.md).

## Results

Each experiment stores its clean runs under its local `results/` directory. A run directory contains raw `calls.jsonl`, metadata, exact prompts, fixture data, summaries, and threshold files. Raw calls are the evidence. Markdown, CSV, SVG, and article table files are generated views over that evidence.

For JSON input probes, [experiments/json-input-low/manifest.json](../experiments/json-input-low/manifest.json) is the article-facing provenance source. It declares the raw run used for article table values and records which older or supporting batches are retained for audit context.

Current article citations should use only the run directories listed in [docs/experiments.md](experiments.md) and the experiment READMEs.

## Figures

Regenerate figures, publication summaries, and generated article tables with:

```bash
npm run results:graphs
```

LOW figures are written to `images/results/price-vs-iteration/`. ENOUGH figures are written to `images/results/enough-thresholds/`. The JSON input LOW article table is written to `experiments/json-input-low/generated/`.

To regenerate or verify only the JSON input LOW article table:

```bash
npm run results:json-input-low:table
npm run results:json-input-low:table:check
```

When a new JSON run should replace article numbers, update `experiments/json-input-low/manifest.json` first, then regenerate the table. Do not edit the article table by hand.

## Citation

For article or appendix numbers, cite only the current clean result directories listed in [docs/experiments.md](experiments.md), each experiment README, and any experiment manifest that governs generated article tables. Do not mix in exploratory runs.
