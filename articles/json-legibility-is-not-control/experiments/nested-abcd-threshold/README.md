# Nested ABCD Threshold Probe

Date: 2026-08-11

This probe tests a two-level JSON shape:

```text
{{{A}{B}}{{C}{D}}}
```

The payload gives branch `A` a nearby `$5` note and branch `C` a nearby `$100,000` note. These notes are branch context, not definitions of `LOW`. The model must classify `B` and `D` as `LOW` or `NOT_LOW`.

## Question

Does an instruction like `Treat each JSON sub-object independently` make the model over-bind nearby branch notes and move the implicit meaning of `LOW`?

The desired reading is:

- `LOW` remains one task label.
- The `$5` and `$100,000` notes may be read as context.
- Those notes should not become branch-local definitions of `LOW`.

The probe varies where the outside branch-isolation rule appears:

| Condition | Format | Bet |
|---|---|---|
| `control` | No branch-independence instruction outside the JSON. | Baseline implicit `LOW` behavior. |
| `prefix_free_text` | Branch-independence instruction before JSON. | May increase branch-local over-binding. |
| `suffix_free_text` | Branch-independence instruction after JSON. | Prior probe suggests suffix text may be the strongest non-system placement. |
| `system_rule` | Branch-independence instruction in the system prompt. | Strongest test of whether independence language can distort the label. |

In short: `suffix_free_text` means the instruction is plain text after the JSON payload, not inside the JSON and not in the system prompt.

The note-matrix run also varies which branch notes are present:

| Note mode | Meaning |
|---|---|
| `none` | No branch-specific dollar note. |
| `a_only` | Only the `A` branch has the `$5` note near `B`. |
| `c_only` | Only the `C` branch has the `$100,000` note near `D`. |
| `both` | Both branch notes are present. |

## Case Modes

`diagonal` uses six cases where `B` and `D` have the same amount:

```text
$5, $50, $500, $5,000, $20,000, $100,000
```

This costs `4 conditions x 6 cases x repeats`.

`contrast` uses four deliberately crossed cases:

```text
B=$50 / D=$50,000
B=$500 / D=$5,000
B=$5,000 / D=$50
B=$100,000 / D=$5
```

This costs `4 conditions x 4 cases x repeats`.

`matrix` uses all B/D pairings from the same amount list.

This costs `4 conditions x 36 cases x repeats`.

## Run

```bash
npm run check:nested-abcd
npm run run:nested-abcd:gemini
npm run run:nested-abcd:gemini:contrast
npm run run:nested-abcd:gemini:note-matrix
```

Full matrix:

```bash
npm run run:nested-abcd:gemini:matrix
```

OpenAI, when `OPENAI_API_KEY` is available:

```bash
npm run run:nested-abcd:openai
```

Results are written under:

```text
experiments/nested-abcd-threshold/results/
```

Each run stores:

- `calls.jsonl`: raw request metadata, raw text, parsed labels, validation.
- `run.json`: conditions, amounts, prompts, cases, and jobs.
- `summary.md`: readable comparison tables.
- `summary.json`: aggregate counts.

## Reading Rule

This is not a test where `B` should use a `$5` threshold and `D` should use a `$100,000` threshold. That would already concede that `LOW` is branch-local.

The failure-shaped signal is:

- same amount, different labels for `B` and `D`;
- `B` behaving as if `$5` defines `LOW`;
- `D` behaving as if `$100,000` defines `LOW`;
- any increase in that behavior when the branch-independence instruction is added.

## Result Notes

The first two result directories in this experiment used an earlier local-threshold framing where `$5` explicitly defined `LOW` for `B` and `$100,000` explicitly defined `LOW` for `D`. Those runs are useful only as a positive JSON-legibility check.

The corrected branch-note framing starts here:

- `results/2026-08-11T01-09-59-376Z-gemini-gemini-3.5-flash-lite-nested-abcd-threshold-pilot/`
- `results/2026-08-11T01-10-03-488Z-gemini-gemini-3.5-flash-lite-nested-abcd-threshold-contrast/`

In the corrected Gemini pilot, the branch-independence instruction did not increase same-amount split labels. `B` and `D` behaved identically on the diagonal cases across all four conditions. In the contrast run, prefix and suffix branch-independence text made `B=$500` flip to `LOW`, while `D` did not move. This is a weak drift signal, not yet strong evidence.

The note-matrix run isolates the branch notes:

- `results/2026-08-11T01-24-40-384Z-gemini-gemini-3.5-flash-lite-nested-abcd-note-matrix-r3/`

This run used `contrast`, `note-mode all`, and `repeats 3` for 192 Gemini calls.

Main observations:

- With no branch notes, `B=$500` was `LOW` in `3/3` calls and `D=$5,000` was `LOW` in `0/3` calls across comparable controls. This is the baseline implicit label behavior for this prompt.
- `C:$100,000` alone moved `D=$5,000` to `LOW` in the plain control condition: `3/3`, versus `0/3` with no notes. That is the clearest local over-binding signal.
- `A:$5` alone moved `B=$500` away from `LOW` under `control`, `prefix_free_text`, and `suffix_free_text`: `1/3`, versus `3/3` with no notes.
- Both notes together did not make the `$100,000` effect stronger. In this run, `D=$5,000` stayed `0/3` under `both`.
- The strongest `$5` effect was `suffix_free_text/both`, where `B=$500` was `LOW` in `0/3` calls. This suggests suffix branch-independence text can amplify the nearby `$5` note for `B`, while not symmetrically amplifying the `$100,000` note for `D`.

Simple influence view:

| Condition | Note mode | B influenced? | D influenced? |
|---|---|---|---|
| `control` | `a_only` | yes | n/a |
| `control` | `c_only` | n/a | yes |
| `control` | `both` | yes | no |
| `prefix_free_text` | `a_only` | yes | n/a |
| `prefix_free_text` | `c_only` | n/a | yes, weak |
| `prefix_free_text` | `both` | no | no |
| `suffix_free_text` | `a_only` | yes | n/a |
| `suffix_free_text` | `c_only` | n/a | yes, weak |
| `suffix_free_text` | `both` | yes | no |
| `system_rule` | `a_only` | no | n/a |
| `system_rule` | `c_only` | n/a | yes, weak |
| `system_rule` | `both` | yes, weak | no |
