# Question interference pilot

- Provider: `gemini`
- Model: `gemini-3.5-flash-lite`
- Repeats per condition: 20
- Temperature: 0
- Question mode: `bare`

| Condition | n | Mean Q1 noul | Min | Max | Delta vs Q1 only |
|---|---:|---:|---:|---:|---:|
| q1_only | 20 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| q1_then_neutral | 20 | 0.0150 | 0.0000 | 0.1000 | 0.0150 |
| neutral_then_q1 | 20 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| q1_then_oriented | 20 | 0.0100 | 0.0000 | 0.1000 | 0.0100 |
| oriented_then_q1 | 20 | 0.1150 | 0.0000 | 0.2000 | 0.1150 |

Errors: 0
