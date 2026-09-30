# Question interference pilot

- Provider: `gemini`
- Model: `gemini-3.5-flash-lite`
- Repeats per condition: 50
- Temperature: 0
- Question mode: `criteria`

| Condition | n | Mean Q1 noul | Min | Max | Delta vs Q1 only |
|---|---:|---:|---:|---:|---:|
| q1_only | 50 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| q1_then_neutral | 50 | 0.0020 | 0.0000 | 0.1000 | 0.0020 |
| neutral_then_q1 | 50 | 0.0440 | 0.0000 | 0.2000 | 0.0440 |
| q1_then_oriented | 50 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| oriented_then_q1 | 50 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |

Errors: 0
