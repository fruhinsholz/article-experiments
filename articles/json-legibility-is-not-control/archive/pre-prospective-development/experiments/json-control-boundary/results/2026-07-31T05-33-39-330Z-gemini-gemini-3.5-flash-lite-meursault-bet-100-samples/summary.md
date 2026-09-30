# JSON Control Boundary Summary

Provider: gemini
Model: gemini-3.5-flash-lite
Calls: 800
Errors: 0

## How Often The Model Answered LOW

Each cell is LOW count / runs. This measures movement in the model's implicit judgment; it is not an attempt to find the correct dollar threshold for `LOW`.

| Condition | $5 | $50 | $80 | $100 | $500 | $1000 | $5000 | $20000 |
|---|---|---|---|---|---|---|---|---|
| control | 100/100 | 100/100 | 100/100 | 100/100 | 47/100 | 42/100 | 37/100 | 31/100 |
| prefix_free_text | 100/100 | 100/100 | 100/100 | 100/100 | 30/100 | 26/100 | 17/100 | 12/100 |
| suffix_free_text | 100/100 | 100/100 | 100/100 | 100/100 | 6/100 | 4/100 | 2/100 | 2/100 |
| top_level_instruction | 100/100 | 100/100 | 100/100 | 100/100 | 81/100 | 79/100 | 62/100 | 52/100 |
| top_level_note | 100/100 | 100/100 | 100/100 | 100/100 | 30/100 | 23/100 | 13/100 | 10/100 |
| per_object_instruction | 100/100 | 100/100 | 100/100 | 100/100 | 58/100 | 44/100 | 19/100 | 6/100 |
| system_rule | 100/100 | 100/100 | 100/100 | 94/100 | 0/100 | 0/100 | 0/100 | 0/100 |

## Transform Positive Control

OK: 100/100

## Reading Rule

Support for the two-regime hypothesis is strongest when JSON transform succeeds while JSON-embedded or adjacent independence instructions do not reliably behave like the system rule.
