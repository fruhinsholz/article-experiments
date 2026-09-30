# Low Scope Contamination Summary

Provider: anthropic
Model: claude-haiku-4-5-20251001
Calls: 40
Errors: 0

Probe target: branch B contains a calibrated flower-gift budget where `$5,000` is extremely expensive; local reading predicts `HOLD`. Inactive branch A contains `$100,000 contract`; cross-scope/global reading can make `$5,000` look low and predicts `BUY`.

| Condition | Local HOLD | Global BUY | Partial HOLD | Partial BUY | Other/error | Distinct outputs |
|---|---:|---:|---:|---:|---:|---|
| b_only_same_word | 10 | 0 | 0 | 0 | 0 | "HOLD" |
| inactive_a_same_word | 10 | 0 | 0 | 0 | 0 | "HOLD" |
| inactive_a_different_word | 10 | 0 | 0 | 0 | 0 | "HOLD" |
| inactive_a_explicit_scope | 10 | 0 | 0 | 0 | 0 | "HOLD" |

## Reading Rule

`HOLD` means the model interpreted `low` inside branch B using B's local flower-gift context. `BUY` means the larger contract frame, repeated word, or global prompt context likely shifted the local branch decision.
