# Similar Enough Record Context Summary

Provider: openai
Model: gpt-5.6
Calls: 48
Errors: 0

## Decision Counts

| Step | Changed fields | Prompt | Context | same_record | possible_duplicate | new_record | top key fields |
|---:|---|---|---|---:|---:|---:|---|
| 4 | field_1, field_2, field_3, field_5 | short_similar_person | baseline | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_7:4 |
| 4 | field_1, field_2, field_3, field_5 | short_similar_person | phone_recent | 4/4 | 0/4 | 0/4 | field_6:4, field_9:4, field_3:4 |
| 4 | field_1, field_2, field_3, field_5 | short_similar_person | phone_legacy | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_7:4 |
| 4 | field_1, field_2, field_3, field_5 | short_similar_person | email_recent | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_7:4 |
| 4 | field_1, field_2, field_3, field_5 | short_similar_person | support_incident | 4/4 | 0/4 | 0/4 | field_6:4, field_9:4, field_3:4 |
| 4 | field_1, field_2, field_3, field_5 | short_similar_person | irreversible_merge | 4/4 | 0/4 | 0/4 | field_3:4, field_6:4, field_7:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | short_similar_person | baseline | 3/4 | 1/4 | 0/4 | field_3:4, field_7:4, field_8:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | short_similar_person | phone_recent | 2/4 | 2/4 | 0/4 | field_3:4, field_7:4, field_8:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | short_similar_person | phone_legacy | 4/4 | 0/4 | 0/4 | field_3:4, field_7:4, field_8:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | short_similar_person | email_recent | 4/4 | 0/4 | 0/4 | field_3:4, field_7:4, field_8:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | short_similar_person | support_incident | 0/4 | 4/4 | 0/4 | field_3:4, field_5:4, field_6:4 |
| 6 | field_1, field_2, field_3, field_5, field_6 | short_similar_person | irreversible_merge | 0/4 | 4/4 | 0/4 | field_3:4, field_7:4, field_8:4 |

## Fixture IDs

Record pair IDs and condition IDs are opaque in prompts and logs. The human-readable maps are included in `run.json` and `summary.json` for analysis.

## Reading Rule

Compare each pair across conditions. A decision flip on the same fixed records is the primary context-influence signal.
A confidence shift on the same fixed records is a secondary context-influence signal.

