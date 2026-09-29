# JSON Input LOW

Private exploratory experiment for the Prompt Edits article work.

This test asks a narrow question: if the same `LOW` refund classifier receives retrieved context and case data in different prompt formats, does JSON reduce or remove the observed movement of the implicit dollar boundary?

The current script is intentionally narrow:

- one fixed amount grid,
- prose and JSON variants side by side,
- no adaptive binary search in this experiment,
- enough samples in the main result set to compare format behavior at identical amounts.

## Formats

- `prose_same_block`: the original style, where retrieved context and case prose sit close together.
- `prose_separated`: retrieved context, case data, and task separated by delimiters.
- `json_flat`: a simple JSON object with retrieved context and refund amount in separate fields.
- `json_typed`: nested JSON with explicit input roles and an output schema.
- `json_typed_boundary_rule`: typed JSON plus an explicit `$100 LOW` rule in the prompt.

The last variant is a diagnostic control. If it produces the specified `$100` result, it shows that an explicit policy value can improve the prompt. If it does not produce a stable boundary, that is still part of the result: prompt-side policy text is not the same thing as deterministic enforcement outside the model.

## Current Readout

The publication-clean article table is generated from [manifest.json](manifest.json), not edited by hand. It now uses a matched fixed grid:

- OpenAI `gpt-5.6`, `n=100` per amount, no-added-context control.
- OpenAI `gpt-5.6`, `n=100` per amount, `$100k` retrieved-context prose condition.
- OpenAI `gpt-5.6`, `n=100` per amount, `$5 gift-card` retrieved-context prose condition.
- OpenAI `gpt-5.6`, `n=100` per amount, `$5 gift-card` retrieved-context explicit `$100` JSON boundary-rule condition.
- Gemini `gemini-3.6-flash`, `n=100` per amount, no-added-context control.
- Gemini `gemini-3.6-flash`, `n=100` per amount, `$100k` retrieved-context prose condition.
- Gemini `gemini-3.6-flash`, `n=100` per amount, `$5 gift-card` retrieved-context prose condition.
- Gemini `gemini-3.6-flash`, `n=100` per amount, `$5 gift-card` retrieved-context explicit `$100` JSON boundary-rule condition.

The table reports raw counts and error rates against the operational rule `LOW iff refund_claim_amount_usd <= 100`. It deliberately avoids fold multipliers. Regenerate the canonical article table with:

```bash
npm run results:json-input-low:table
```

The older format-comparison result set remains in [results/2026-08-01-json-format-results-summary/summary.md](results/2026-08-01-json-format-results-summary/summary.md). It is retained as exploratory evidence that JSON legibility did not isolate the boundary before inference. Do not use its fold multipliers or mixed-run table as the main article exhibit.

The exact method name for this experiment is `fixed amount grid`. It is not an adaptive binary search. The result set uses practical grids around the expected `$100` boundary and the observed drift range; the exact crossing point is not the claim.

## Provenance and Generated Outputs

Raw run directories are immutable evidence. The article table is a generated view over the publication-clean runs declared in [manifest.json](manifest.json). If a later run replaces the article numbers, update the manifest first, then regenerate the generated files:

- [generated/article-table.md](generated/article-table.md)
- [generated/article-table.json](generated/article-table.json)
- [generated/publication-clean/publication-clean-summary.md](generated/publication-clean/publication-clean-summary.md), the earlier `$100k` prose-focused view.
- [generated/publication-clean/publication-clean-summary.csv](generated/publication-clean/publication-clean-summary.csv), the earlier `$100k` prose-focused CSV.
- [generated/publication-clean/publication-clean-chart.svg](generated/publication-clean/publication-clean-chart.svg), the earlier `$100k` prose-focused chart.
- [generated/publication-clean/publication-clean-provenance.json](generated/publication-clean/publication-clean-provenance.json), the earlier `$100k` prose-focused provenance file.

The generated Markdown includes a provenance marker with the manifest path, source runs, and hash. The JSON output records hashes for the manifest, `summary.csv`, `metadata.json`, and `calls.jsonl` files.

Older clean and check batches remain in `results/` so readers can see how the experiment evolved, but they are not mixed into the article table unless promoted in the manifest.

## Conclusion

JSON changed the surface form of the prompt, but it did not remove the hidden-boundary problem in the exploratory format runs. The publication-clean result narrows the article-facing claim: with the ordinary prose prompt, retrieved context moves both OpenAI and Gemini strongly. A `$100k` enterprise note moves classifications above the code-owned `$100` boundary toward `LOW`; a `$5 gift-card` note moves classifications above `$5` toward `NOT_LOW`.

The important result is not that JSON confused the model. The retrieved context continued to influence the model-resolved boundary in ordinary prose. In the publication-clean gift-card run, the `json_typed_boundary_rule` condition applies the explicit `$100` rule perfectly for both models at `n=100`. That is useful but should not be overstated: it shows that explicit prompt-side policy can help in this probe, not that prompt text is equivalent to runtime enforcement.

The no-context controls are not perfectly smooth either, which is part of the honest readout. They show that a prompt-only classifier is not the same thing as deterministic enforcement even without retrieved context. The retrieved-context prose conditions make the movement much stronger and directionally interpretable: the models treat `LOW` relative to nearby contextual scale, not as a consequence-bearing `$100` boundary. That points to the same recommendation: consequence-bearing thresholds should be explicit, versioned, and enforced outside ordinary model interpretation.

Do not read this probe as a model ranking. The useful claim is narrower: structured input and explicit policy text can improve legibility and behavior, but legibility is not the same thing as owning the operational boundary.

## Concrete Input Example

These are the exact user prompt bodies generated for one comparable cell:

- context: `retrieved_100000_contract`
- amount: `$1,000`
- retrieved context: `A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period.`

The system prompt is the same for every format:

```text
You are a classification component. Use only the facts in the case. Do not infer social, moral, or hardship considerations unless they are explicitly part of the case. Return only the requested label.
```

### `prose_same_block`

```text
Retrieved context:
A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period.

Case:
A customer submitted a refund claim for $1,000 for a consumer purchase.

Classify the claim amount as exactly one label:
LOW
NOT_LOW

Return only the label.
```

### `prose_separated`

```text
Retrieved context:
A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period.

---

Case data:
Refund claim amount: $1,000
Purchase type: consumer purchase

---

Task:
Classify the claim amount as exactly one label:
LOW
NOT_LOW

Return only the label.
```

### `json_flat`

```json
{
  "retrieved_context": "A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period.",
  "refund_claim_amount_usd": 1000,
  "purchase_type": "consumer_purchase",
  "task": "Classify the claim amount as exactly one label: LOW or NOT_LOW. Return only the label."
}
```

### `json_typed`

```json
{
  "inputs": {
    "retrieved_context": {
      "kind": "separate_retrieved_note",
      "text": "A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period."
    },
    "case": {
      "refund_claim_amount_usd": 1000,
      "purchase_type": "consumer_purchase"
    }
  },
  "output_schema": {
    "label": {
      "enum": [
        "LOW",
        "NOT_LOW"
      ]
    }
  },
  "instruction": "Classify only the case refund amount. Return only the label."
}
```

### `json_typed_boundary_rule`

```json
{
  "policy": {
    "decision_threshold_usd": 100,
    "rule": "LOW iff refund_claim_amount_usd <= decision_threshold_usd; otherwise NOT_LOW."
  },
  "inputs": {
    "retrieved_context": {
      "kind": "separate_retrieved_note",
      "text": "A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period."
    },
    "case": {
      "refund_claim_amount_usd": 1000,
      "purchase_type": "consumer_purchase"
    }
  },
  "output_schema": {
    "label": {
      "enum": [
        "LOW",
        "NOT_LOW"
      ]
    }
  },
  "instruction": "Use only decision_threshold_usd as the approval boundary. Do not infer thresholds from retrieved_context."
}
```

## Run

Live OpenAI and Gemini runs should be executed under the shared Infisical provider-key project on `eric-bee`; do not use `us-blog/private/infisical-access.env` for these experiments.

```bash
token=$(sudo -n infisical-admin admin-login --plain --silent)
```

```bash
sudo -n infisical-admin run --token "$token" --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 --env prod --path /shared -- npm run thresholds:low:json-input -- --provider openai --models gpt-5.5,gpt-5.6 --contexts all --formats all --amounts 25,50,75,100,150,250,500,1000,5000,10000,20000 --samples 30 --max-output-tokens 1024 --max-calls 11000 --concurrency 8 --gzip-jsonl --label clean-openai-gpt55-gpt56-fixed-grid-json-s30
```

For a first cheaper pass, use only the two most relevant contexts:

```bash
sudo -n infisical-admin run --token "$token" --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 --env prod --path /shared -- npm run thresholds:low:json-input -- --provider openai --models gpt-5.5,gpt-5.6 --contexts fact_only,retrieved_100000_contract --formats prose_same_block,json_typed_boundary_rule --amounts 100,200 --samples 1 --max-output-tokens 1024 --max-calls 50 --concurrency 4 --label micro-smoke-openai-gpt55-gpt56-json-max1024-s1
```

Gemini reruns use the same Infisical wrapper:

```bash
sudo -n infisical-admin run --token "$token" --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 --env prod --path /shared -- npm run thresholds:low:json-input -- --provider gemini --models gemini-3.6-flash --contexts fact_only,retrieved_100000_contract --formats json_typed_boundary_rule --amounts 25,50,75,100,150,250,500,1000,5000,10000,20000 --samples 100 --max-output-tokens 256 --reasoning-effort none --max-calls 2500 --concurrency 8 --gzip-jsonl --label gemini-json-boundary-rule-control-s100
```

If API keys are not loaded but the local Claude CLI is authenticated:

```bash
npm run thresholds:low:json-input -- --provider claude-cli --models sonnet --contexts fact_only,retrieved_100000_contract --formats all --samples 2 --amounts 50,100,150,500,1000,5000,10000,20000 --max-output-tokens 128 --max-calls 250 --label exploratory-claude-json-vs-prose
```

## Publication-Clean Boundary Probe

The publication-clean probe is the article-facing replacement for ratio-heavy mixed-run evidence. It uses one fixed grid and `n=100` per amount per model. The runtime-enforced condition is derived deterministically from the same amount values and does not spend extra model calls.

Publication runs:

- OpenAI no-context control: `experiments/json-input-low/results/2026-08-02T18-27-05-695Z-publication-clean-control-openai-gpt56-s100-json-input-low`
- OpenAI `$100k` prose: `experiments/json-input-low/results/2026-08-02T17-21-15-563Z-publication-clean-openai-gpt56-s100-json-input-low`
- OpenAI `$5 gift-card` prose plus explicit-rule JSON: `experiments/json-input-low/results/2026-08-02T19-25-24-689Z-publication-clean-gift-card-openai-gpt56-s100-json-input-low`
- Gemini no-context control: `experiments/json-input-low/results/2026-08-02T18-32-02-384Z-publication-clean-control-gemini-36-flash-s100-json-input-low`
- Gemini `$100k` prose: `experiments/json-input-low/results/2026-08-02T17-24-22-436Z-publication-clean-gemini-36-flash-s100-json-input-low`
- Gemini `$5 gift-card` prose plus explicit-rule JSON: `experiments/json-input-low/results/2026-08-02T19-32-20-026Z-publication-clean-gift-card-gemini-36-flash-s100-json-input-low`

The canonical article table is manifest-driven:

```bash
npm run results:json-input-low:table
```

Regenerate the consolidated publication artifacts with:

```bash
npm run results:json-input-low:publication -- --runs experiments/json-input-low/results/2026-08-02T18-27-05-695Z-publication-clean-control-openai-gpt56-s100-json-input-low,experiments/json-input-low/results/2026-08-02T17-21-15-563Z-publication-clean-openai-gpt56-s100-json-input-low,experiments/json-input-low/results/2026-08-02T19-25-24-689Z-publication-clean-gift-card-openai-gpt56-s100-json-input-low,experiments/json-input-low/results/2026-08-02T18-32-02-384Z-publication-clean-control-gemini-36-flash-s100-json-input-low,experiments/json-input-low/results/2026-08-02T17-24-22-436Z-publication-clean-gemini-36-flash-s100-json-input-low,experiments/json-input-low/results/2026-08-02T19-32-20-026Z-publication-clean-gift-card-gemini-36-flash-s100-json-input-low --out experiments/json-input-low/generated/publication-clean
```

Generated artifacts:

- `experiments/json-input-low/generated/publication-clean/publication-clean-summary.md`
- `experiments/json-input-low/generated/publication-clean/publication-clean-summary.csv`
- `experiments/json-input-low/generated/publication-clean/publication-clean-chart.svg`
- `experiments/json-input-low/generated/publication-clean/publication-clean-provenance.json`

Those `publication-clean` files are retained as the `$100k` prose-focused chart and summary. For the article-facing source of truth after the `$5 gift-card` clean run, use `generated/article-table.md` and `generated/article-table.json`.

Article-facing interpretation: do not use fold multipliers such as `560x` for this result. Report raw counts, error rates, `n`, exact models, exact amounts, and provenance. The narrow claim is that a model-resolved consequence boundary moved under retrieved context in this probe, while code-owned runtime enforcement stayed deterministic. The explicit-rule JSON result should be presented as a useful prompt-side improvement and a diagnostic control, not as a replacement for runtime ownership.
