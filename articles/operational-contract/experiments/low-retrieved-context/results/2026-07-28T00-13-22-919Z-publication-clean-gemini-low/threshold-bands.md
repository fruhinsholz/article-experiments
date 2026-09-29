# Low Threshold Bands

Created: 2026-07-28T00:13:22.919Z
Commit: d6a77c06ec2217c3b09764a60c08d220cc59a381

| Model | Context | Lower observed bound | Upper observed bound | Width | Lower P(LOW) | Upper P(LOW) | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `gemini-3.5-flash-lite` | `fact_only` | 78.13 | 97.66 | 19.53 | 80.0% | 23.3% | Estimated probability band, not an exact threshold. |
| `gemini-3.5-flash-lite` | `retrieved_5_gift_card` | 39.06 | 58.59 | 19.53 | 63.3% | 0.0% | Estimated probability band, not an exact threshold. |
| `gemini-3.5-flash-lite` | `retrieved_100000_contract` | 10585.94 | 10605.47 | 19.53 | 83.3% | 33.3% | Estimated probability band, not an exact threshold. |
| `gemini-3.6-flash` | `fact_only` | 39.06 | 58.59 | 19.53 | 90.0% | 30.0% | Estimated probability band, not an exact threshold. |
| `gemini-3.6-flash` | `retrieved_5_gift_card` | 0 | 19.53 | 19.53 | 100.0% | 0.0% | Estimated probability band, not an exact threshold. |
| `gemini-3.6-flash` | `retrieved_100000_contract` | 0 | 20000 | 20000 | 100.0% | 73.3% | No P(LOW) crossing inside the tested range. |
