# JSON Control Boundary Probe

Date: 2026-07-31

This probe compares `Meursault's bet` against observed model behavior.

## Completed Runs

The committed result directories currently contain Gemini runs only.

| Provider | Model | Samples | Calls | Result Directory |
|---|---:|---:|---:|---|
| Gemini | `gemini-3.5-flash-lite` | 20 | 160 | `results/2026-07-31T05-32-32-961Z-gemini-gemini-3.5-flash-lite-meursault-bet-initial/` |
| Gemini | `gemini-3.5-flash-lite` | 100 | 800 | `results/2026-07-31T05-33-39-330Z-gemini-gemini-3.5-flash-lite-meursault-bet-100-samples/` |

Total Gemini calls used: 960/1000.

No OpenAI/GPT result directory is committed in this repository state.

## 100-Sample Result

Each cell shows how often the model answered `LOW`. This is a probe of whether instruction placement changes the model's implicit judgment, not a search for the correct threshold.

| Condition | $5 | $50 | $80 | $100 | $500 | $1000 | $5000 | $20000 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `control` | 100/100 | 100/100 | 100/100 | 100/100 | 47/100 | 42/100 | 37/100 | 31/100 |
| `prefix_free_text` | 100/100 | 100/100 | 100/100 | 100/100 | 30/100 | 26/100 | 17/100 | 12/100 |
| `suffix_free_text` | 100/100 | 100/100 | 100/100 | 100/100 | 6/100 | 4/100 | 2/100 | 2/100 |
| `top_level_instruction` | 100/100 | 100/100 | 100/100 | 100/100 | 81/100 | 79/100 | 62/100 | 52/100 |
| `top_level_note` | 100/100 | 100/100 | 100/100 | 100/100 | 30/100 | 23/100 | 13/100 | 10/100 |
| `per_object_instruction` | 100/100 | 100/100 | 100/100 | 100/100 | 58/100 | 44/100 | 19/100 | 6/100 |
| `system_rule` | 100/100 | 100/100 | 100/100 | 94/100 | 0/100 | 0/100 | 0/100 | 0/100 |

Transform positive control: 100/100.

## Comparison To The Bet

What matched:

- The transform positive control succeeded completely, which supports JSON form competence.
- The system rule was clearly strongest, especially above `$500`.
- Suffix was the strongest non-system placement, as expected.
- JSON-adjacent or JSON-embedded instructions were not equivalent to a system rule.

What surprised me:

- `top_level_instruction` moved in the wrong direction for this setup. It increased `LOW` classifications at high amounts relative to control.
- `per_object_instruction` helped at very high amounts, but not consistently at `$500` or `$1000`.
- Prefix and note behaved similarly, suggesting field naming mattered less than expected for those two conditions.

Provisional read:

> The model can use JSON form and instruction placement as cues, but the cues do not behave like a deterministic execution boundary. JSON is legible; procedural authority remains unstable unless the rule is outside the data.
