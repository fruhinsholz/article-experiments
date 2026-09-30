# Low Scope Contamination Summary

Provider: anthropic
Model: claude-haiku-4-5-20251001
Calls: 40
Errors: 0

Probe target: branch B contains `$5,000 flower gift`; local reading predicts `HOLD`. Inactive branch A contains `$100,000 contract`; cross-scope/global reading can make `$5,000` look low and predicts `BUY`.

| Condition | Local HOLD | Global BUY | Partial HOLD | Partial BUY | Other/error | Distinct outputs |
|---|---:|---:|---:|---:|---:|---|
| b_only_same_word | 0 | 0 | 0 | 0 | 10 | "# Analysis\n\n**Routing Rule Application:**\n- route_amount: \"$5\" (low)\n- Routing rule: \"If route_amount" |
| inactive_a_same_word | 0 | 0 | 0 | 0 | 10 | "# Execution\n\n**Step 1: Apply routing rule**\n- route_amount: \"$5\" (low)\n- Routing rule: \"" |
| inactive_a_different_word | 0 | 0 | 0 | 0 | 10 | "# Execution\n\n**Routing Rule Analysis:**\n- route_amount: \"$5\" (small)\n- Decision: Execute branch B\n\n**Branch" |
| inactive_a_explicit_scope | 0 | 0 | 0 | 0 | 10 | "# Execution\n\n**Routing Rule:** route_amount is \"$5\" (low) → Execute **Branch B**\n\n**Branch B Execution:**" |

## Reading Rule

`HOLD` means the model interpreted `low` inside branch B using B's local flower-gift context. `BUY` means the larger contract frame, repeated word, or global prompt context likely shifted the local branch decision.
