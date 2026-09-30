# Short Similar-Person Prompt Probe

Provider: openai  
Model: gpt-5.6  
Calls: 48  
Errors: 0

## Prompt Under Test

```text
Decide whether they are similar enough to represent the same person.
```

The records, contexts, repeats, output schema, and system instruction are otherwise the same as the subtle temporal CRM probe.

## Result

| Step | Context | same_record | possible_duplicate | new_record |
|---:|---|---:|---:|---:|
| 4 | baseline | 4/4 | 0/4 | 0/4 |
| 4 | phone_recent | 4/4 | 0/4 | 0/4 |
| 4 | phone_legacy | 4/4 | 0/4 | 0/4 |
| 4 | email_recent | 4/4 | 0/4 | 0/4 |
| 4 | support_incident | 4/4 | 0/4 | 0/4 |
| 4 | irreversible_merge | 4/4 | 0/4 | 0/4 |
| 6 | baseline | 3/4 | 1/4 | 0/4 |
| 6 | phone_recent | 2/4 | 2/4 | 0/4 |
| 6 | phone_legacy | 4/4 | 0/4 | 0/4 |
| 6 | email_recent | 4/4 | 0/4 | 0/4 |
| 6 | support_incident | 0/4 | 4/4 | 0/4 |
| 6 | irreversible_merge | 0/4 | 4/4 | 0/4 |

## Reading

The shorter prompt makes the context effect sharper than the previous longer neutral prompt.

Step 4 remains stable: GPT-5.6 treats the records as the same person under every context.

Step 6 is the boundary case. With no context, the model returns 3 same_record and 1 possible_duplicate. With a recent support incident or irreversible merge consequence, it returns 0 same_record and 4 possible_duplicate.

The strongest article-safe interpretation is narrow:

> When a record pair is already near the uncertainty boundary, the same phrase, records, model, and output schema can produce different operational decisions when subtle CRM context changes the perceived cost or risk of the judgment.

This should remain a small supporting example, not a primary proof.
