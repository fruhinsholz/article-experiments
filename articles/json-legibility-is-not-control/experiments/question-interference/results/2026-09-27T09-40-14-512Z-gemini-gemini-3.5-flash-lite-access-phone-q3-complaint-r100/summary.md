# Question interference pilot

- Provider: `gemini`
- Model: `gemini-3.5-flash-lite`
- Repeats per condition: 100
- Temperature: 0
- Question mode: `bare`
- Condition set: `complaint`

| Condition | n | Mean Q1 noul | Min | Max | Delta vs Q1 only |
|---|---:|---:|---:|---:|---:|
| q1_only | 100 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| q1_then_oriented_then_complaint | 100 | 0.0100 | 0.0000 | 0.1000 | 0.0100 |
| complaint_then_q1_then_oriented | 100 | 0.0150 | 0.0000 | 0.1000 | 0.0150 |

Errors: 0
