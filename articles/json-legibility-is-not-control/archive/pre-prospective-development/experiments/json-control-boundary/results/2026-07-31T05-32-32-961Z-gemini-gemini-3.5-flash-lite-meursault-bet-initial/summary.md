# JSON Control Boundary Summary

Provider: gemini
Model: gemini-3.5-flash-lite
Calls: 160
Errors: 0

## How Often The Model Answered LOW

Each cell is LOW count / runs. This measures movement in the model's implicit judgment; it is not an attempt to find the correct dollar threshold for `LOW`.

| Condition | $5 | $50 | $80 | $100 | $500 | $1000 | $5000 | $20000 |
|---|---|---|---|---|---|---|---|---|
| control | 20/20 | 20/20 | 20/20 | 20/20 | 7/20 | 7/20 | 6/20 | 6/20 |
| prefix_free_text | 20/20 | 20/20 | 20/20 | 20/20 | 7/20 | 7/20 | 4/20 | 4/20 |
| suffix_free_text | 20/20 | 20/20 | 20/20 | 20/20 | 1/20 | 1/20 | 1/20 | 0/20 |
| top_level_instruction | 20/20 | 20/20 | 20/20 | 20/20 | 16/20 | 15/20 | 13/20 | 8/20 |
| top_level_note | 20/20 | 20/20 | 20/20 | 20/20 | 5/20 | 4/20 | 3/20 | 1/20 |
| per_object_instruction | 20/20 | 20/20 | 20/20 | 20/20 | 13/20 | 10/20 | 5/20 | 1/20 |
| system_rule | 20/20 | 20/20 | 20/20 | 18/20 | 0/20 | 0/20 | 0/20 | 0/20 |

## Transform Positive Control

OK: 20/20

## Reading Rule

Support for the two-regime hypothesis is strongest when JSON transform succeeds while JSON-embedded or adjacent independence instructions do not reliably behave like the system rule.
