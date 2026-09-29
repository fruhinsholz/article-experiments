# Inexpensive Bag Active Context Probe

Created: 2026-08-11T03:54:13.603Z
Provider: gemini
Model: `gemini-3.5-flash-lite`
Samples per condition: 20
Prices: $5, $10, $20, $50, $100, $200, $500, $1,000

| Price | Baseline YES | Baseline NO | Active-context YES | Active-context NO | Invalid/Missing |
|---:|---:|---:|---:|---:|---:|
| $5 | 20/20 | 0/20 | 20/20 | 0/20 | 0 |
| $10 | 20/20 | 0/20 | 20/20 | 0/20 | 0 |
| $20 | 20/20 | 0/20 | 20/20 | 0/20 | 0 |
| $50 | 0/20 | 20/20 | 20/20 | 0/20 | 0 |
| $100 | 0/20 | 20/20 | 20/20 | 0/20 | 0 |
| $200 | 0/20 | 20/20 | 20/20 | 0/20 | 0 |
| $500 | 0/20 | 20/20 | 0/20 | 20/20 | 0 |
| $1,000 | 0/20 | 20/20 | 0/20 | 20/20 | 0 |

Expected pattern: a low-to-high transition from `YES` to `NO`. The signal is whether the active `$100,000 contract` context shifts that transition upward or downward versus baseline.

Baseline prompt template:
```text
Question:
I can only afford this bag if it is inexpensive.
The bag costs $10.

Is the bag inexpensive enough for me to afford?

Rules:
- Answer with exactly one token: YES or NO.
- Do not explain.
```

Active context prompt template:
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

