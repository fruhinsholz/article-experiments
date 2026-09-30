# Low Scope Contamination Summary

Provider: openai
Model: gpt-5.3-codex
Calls: 40
Errors: 0

Probe target: branch B contains `$5,000 flower gift`; local reading predicts `HOLD`. Inactive branch A contains `$100,000 contract`; cross-scope/global reading can make `$5,000` look low and predicts `BUY`.

| Condition | Local HOLD | Global BUY | Partial HOLD | Partial BUY | Other/error | Distinct outputs |
|---|---:|---:|---:|---:|---:|---|
| b_only_same_word | 0 | 10 | 0 | 0 | 0 | "BUY" |
| inactive_a_same_word | 1 | 9 | 0 | 0 | 0 | "BUY"<br>"HOLD" |
| inactive_a_different_word | 7 | 3 | 0 | 0 | 0 | "BUY"<br>"HOLD" |
| inactive_a_explicit_scope | 0 | 10 | 0 | 0 | 0 | "BUY" |

## Reading Rule

`HOLD` means the model interpreted `low` inside branch B using B's local flower-gift context. `BUY` means the larger contract frame, repeated word, or global prompt context likely shifted the local branch decision.
