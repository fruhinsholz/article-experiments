# Inexpensive Bag Active Context Probe

Created: 2026-08-11T03:45:25.658Z
Provider: gemini
Model: `gemini-3.5-flash-lite`
Samples per condition: 20

| Condition | YES | NO | Invalid | Missing |
|---|---:|---:|---:|---:|
| `baseline_no_context` | 20/20 | 0/20 | 0/20 | 0/20 |
| `active_record_context` | 20/20 | 0/20 | 0/20 | 0/20 |

Expected answer: `YES`.

Baseline prompt:
```text
Question:
I can only afford this bag if it is inexpensive.
The bag costs $10.

Is the bag inexpensive enough for me to afford?

Rules:
- Answer with exactly one token: YES or NO.
- Do not explain.
```

Active context prompt:
```text
Active record context:
- The record mentions a $100,000 contract.

Question:
I can only afford this bag if it is inexpensive.
The bag costs $10.

Is the bag inexpensive enough for me to afford?

Rules:
- Answer with exactly one token: YES or NO.
- Do not explain.
```

