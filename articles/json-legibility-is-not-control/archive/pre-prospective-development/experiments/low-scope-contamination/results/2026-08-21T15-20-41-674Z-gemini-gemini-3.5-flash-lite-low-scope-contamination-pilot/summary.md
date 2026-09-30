# Low Scope Contamination Summary

Provider: gemini
Model: gemini-3.5-flash-lite
Calls: 40
Errors: 0

Probe target: branch B contains `$5,000 flower gift`; local reading predicts `HOLD`. Inactive branch A contains `$100,000 contract`; cross-scope/global reading can make `$5,000` look low and predicts `BUY`.

| Condition | Local HOLD | Global BUY | Partial HOLD | Partial BUY | Other/error | Distinct outputs |
|---|---:|---:|---:|---:|---:|---|
| b_only_same_word | 3 | 7 | 0 | 0 | 0 | "BUY"<br>"HOLD" |
| inactive_a_same_word | 0 | 4 | 2 | 2 | 2 | "BUY"<br>"{\n  \"branch\": \"B\",\n  \"result\": \"HOLD\"\n}"<br>"{\n  \"branch\": \"B\",\n  \"result\": \"BUY\"\n}"<br>"{\n  \"branch\": \"B\",\n  \"reason\": \"The route_amount is $5, which is low. Therefore"<br>"{\"branch\": \"B\", \"result\": \"HOLD\"}"<br>"{\n  \"branch\": \"B\",\n  \"reason\": \"route_amount is $5, which is considered low, triggering" |
| inactive_a_different_word | 2 | 0 | 1 | 2 | 5 | "HOLD"<br>"```json\n{\n  \"branch\": \"B\",\n  \"x_value\": 5000,\n  \""<br>"{\n  \"branch\": \"B\",\n  \"evaluation\": \"x is low\",\n  \"token\": \"BUY\"\n"<br>"```json\n{\n  \"branch\": \"B\",\n  \"x\": \"$5,000\",\n  \"evaluation"<br>"{\n  \"branch\": \"B\",\n  \"reason\": \"route_amount is $5, which is small.\",\n  "<br>"```json\n{\n  \"branch\": \"B\",\n  \"x_value\": \"$5,000\",\n  "<br>"```json\n{\"branch\": \"B\"}\n```\nHOLD"<br>"```json\n{\"branch\": \"B\", \"x\": \"$5,000\", \"output\": \"BUY\"}\n```" |
| inactive_a_explicit_scope | 0 | 0 | 0 | 0 | 10 | "```json\n{\n  \"branch\": \"B\",\n  \"x\": \"$5,000\",\n  \"context"<br>"```json\n{\"branch\": \"B\", \"x\": \"$5,000\", \"context\": \"$5,000"<br>"{\n  \"branch\": \"B\",\n  \"evaluation\": \"x is $5,000, which is low in"<br>"{\n  \"branch\": \"B\",\n  \"evaluation\": \"x ($5,000) is low relative to typical" |

## Reading Rule

`HOLD` means the model interpreted `low` inside branch B using B's local flower-gift context. `BUY` means the larger contract frame, repeated word, or global prompt context likely shifted the local branch decision.
