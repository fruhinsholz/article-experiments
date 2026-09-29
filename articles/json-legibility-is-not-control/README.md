# JSON Legibility Control

Date: 2026-07-31

This repository is a separate exploration space for a possible article idea:

> JSON is legible to the model, but legibility is not control.

It is intentionally separate from `prompt-contract-experiments` so these probes do not pollute the canonical evidence for `Prompt Edits Are Architecture Changes`.

## Question

Can a model transform and generate JSON correctly while still failing to treat JSON as an enforceable control structure before the first inference?

The distinction under test:

- Form competence: the model can read, transform, and generate JSON.
- Procedural authority: JSON structure becomes an enforceable object tree or execution boundary during inference.

## Experiment

The main task gives the model a JSON payload containing a strong global anchor and several refund claim amounts. It asks for one `LOW` or `NOT_LOW` label per item. The only variable is where the instruction `Treat each JSON sub-object independently` appears.

`LOW` is deliberately left implicit. The experiment is not trying to discover the correct dollar value of `LOW`; it uses changes in `LOW` labels to show whether JSON placement can control an implicit judgment.

| Condition | Format | Bet |
|---|---|---|
| `control` | No independence instruction | Anchor contamination remains strong. |
| `prefix_free_text` | Instruction before JSON | Small to medium effect possible, not reliable enforcement. |
| `suffix_free_text` | Instruction after JSON | Highest non-system chance of effect. |
| `top_level_instruction` | JSON field named `instruction` | Possible but unstable effect. |
| `top_level_note` | JSON field named `note` | Weak effect expected. |
| `per_object_instruction` | Each item has an `instruction` field | Interesting failure case if it does not isolate. |
| `system_rule` | System prompt contains the rule | Strongest effect expected. |
| `json_transform_positive_control` | Separate JSON transformation task | High success expected. |

## Run

```bash
npm run check
npm run run:openai
npm run run:gemini
```

Live runs require `OPENAI_API_KEY` or `GEMINI_API_KEY`. Results are written under:

```text
experiments/json-control-boundary/results/
```

Each run stores:

- `calls.jsonl`: raw request metadata, raw text, parsed labels, validation.
- `summary.md`: readable comparison table.
- `summary.json`: aggregate counts.

## Call Budget

Authorized by Eric:

- GPT: up to 1000 calls.
- Gemini: up to 1000 calls.

Default full run per provider:

- 7 classification conditions x 20 repetitions = 140 calls per provider.
- 20 JSON transformation positive controls per provider.
- 160 calls per provider.
