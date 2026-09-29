# Similar Enough Record Context Summary

Provider: gemini
Model: gemini-3.5-flash-lite
Calls: 192
Errors: 0

## Decision Counts

| Step | Changed fields | Prompt | Context | same_record | possible_duplicate | new_record | top key fields |
|---:|---|---|---|---:|---:|---:|---|
| 0 | none | neutral | none | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 0 | none | neutral | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 0 | none | neutral | phone_confirmation | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 0 | none | duplicate_pressure | none | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 0 | none | duplicate_pressure | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 0 | none | duplicate_pressure | phone_confirmation | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 1 | field_1 | neutral | none | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 1 | field_1 | neutral | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_2:4, field_3:4, field_5:4 |
| 1 | field_1 | neutral | phone_confirmation | 4/4 | 0/4 | 0/4 | field_2:4, field_3:4, field_5:4 |
| 1 | field_1 | duplicate_pressure | none | 4/4 | 0/4 | 0/4 | field_2:4, field_3:4, field_5:4 |
| 1 | field_1 | duplicate_pressure | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_2:4, field_3:4, field_5:4 |
| 1 | field_1 | duplicate_pressure | phone_confirmation | 4/4 | 0/4 | 0/4 | field_2:4, field_3:4, field_5:4 |
| 2 | field_1, field_2 | neutral | none | 4/4 | 0/4 | 0/4 | field_3:4, field_5:4, field_6:4 |
| 2 | field_1, field_2 | neutral | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_3:4, field_5:4, field_6:4 |
| 2 | field_1, field_2 | neutral | phone_confirmation | 4/4 | 0/4 | 0/4 | field_3:4, field_5:4, field_6:4 |
| 2 | field_1, field_2 | duplicate_pressure | none | 3/4 | 1/4 | 0/4 | field_3:4, field_5:4, field_6:4 |
| 2 | field_1, field_2 | duplicate_pressure | duplicate_backlog | 2/4 | 2/4 | 0/4 | field_3:4, field_5:4, field_6:4 |
| 2 | field_1, field_2 | duplicate_pressure | phone_confirmation | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 3 | field_1, field_2, field_3 | neutral | none | 4/4 | 0/4 | 0/4 | field_5:4, field_6:4, field_9:4 |
| 3 | field_1, field_2, field_3 | neutral | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_5:4, field_6:4, field_9:4 |
| 3 | field_1, field_2, field_3 | neutral | phone_confirmation | 4/4 | 0/4 | 0/4 | field_5:4, field_6:4, field_9:4 |
| 3 | field_1, field_2, field_3 | duplicate_pressure | none | 4/4 | 0/4 | 0/4 | field_5:4, field_6:4, field_9:4 |
| 3 | field_1, field_2, field_3 | duplicate_pressure | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_5:4, field_6:4, field_9:4 |
| 3 | field_1, field_2, field_3 | duplicate_pressure | phone_confirmation | 4/4 | 0/4 | 0/4 | field_5:4, field_6:4, field_9:4 |
| 4 | field_1, field_2, field_3, field_5 | neutral | none | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_7:3 |
| 4 | field_1, field_2, field_3, field_5 | neutral | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 4 | field_1, field_2, field_3, field_5 | neutral | phone_confirmation | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_9:4 |
| 4 | field_1, field_2, field_3, field_5 | duplicate_pressure | none | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 4 | field_1, field_2, field_3, field_5 | duplicate_pressure | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_9:4 |
| 4 | field_1, field_2, field_3, field_5 | duplicate_pressure | phone_confirmation | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 5 | field_1, field_2, field_3, field_5 | neutral | none | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_6:4 |
| 5 | field_1, field_2, field_3, field_5 | neutral | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_6:4, field_9:4, field_3:3 |
| 5 | field_1, field_2, field_3, field_5 | neutral | phone_confirmation | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_9:4 |
| 5 | field_1, field_2, field_3, field_5 | duplicate_pressure | none | 4/4 | 0/4 | 0/4 | field_6:4, field_7:4, field_9:4 |
| 5 | field_1, field_2, field_3, field_5 | duplicate_pressure | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_6:4, field_7:4, field_9:4 |
| 5 | field_1, field_2, field_3, field_5 | duplicate_pressure | phone_confirmation | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_6:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | neutral | none | 3/4 | 1/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | neutral | duplicate_backlog | 3/4 | 1/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | neutral | phone_confirmation | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | duplicate_pressure | none | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | duplicate_pressure | duplicate_backlog | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | duplicate_pressure | phone_confirmation | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 7 | field_1, field_2, field_3, field_5, field_6, field_8, field_10 | neutral | none | 2/4 | 2/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 7 | field_1, field_2, field_3, field_5, field_6, field_8, field_10 | neutral | duplicate_backlog | 4/4 | 0/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 7 | field_1, field_2, field_3, field_5, field_6, field_8, field_10 | neutral | phone_confirmation | 2/4 | 2/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 7 | field_1, field_2, field_3, field_5, field_6, field_8, field_10 | duplicate_pressure | none | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 7 | field_1, field_2, field_3, field_5, field_6, field_8, field_10 | duplicate_pressure | duplicate_backlog | 1/4 | 3/4 | 0/4 | field_1:4, field_2:4, field_3:4 |
| 7 | field_1, field_2, field_3, field_5, field_6, field_8, field_10 | duplicate_pressure | phone_confirmation | 0/4 | 4/4 | 0/4 | field_1:4, field_2:4, field_3:4 |

## Fixture IDs

Record pair IDs and condition IDs are opaque in prompts and logs. The human-readable maps are included in `run.json` and `summary.json` for analysis.

## Reading Rule

Compare each pair across conditions. A decision flip on the same fixed records is the primary context-influence signal.
A rise in `field_5` as a key field under `context_phone_capture` is a secondary anchoring signal.

