# Low Threshold Bands

Created: 2026-07-28T00:02:02.697Z
Commit: d6a77c06ec2217c3b09764a60c08d220cc59a381

| Model | Context | Lower observed bound | Upper observed bound | Width | Lower P(LOW) | Upper P(LOW) | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `gpt-4.1-mini` | `fact_only` | 156.25 | 175.78 | 19.53 | 53.3% | 3.3% | Estimated probability band, not an exact threshold. |
| `gpt-4.1-mini` | `retrieved_5_gift_card` | 0 | 19.53 | 19.53 | 100.0% | 13.3% | Estimated probability band, not an exact threshold. |
| `gpt-4.1-mini` | `retrieved_100000_contract` | 0 | 20000 | 20000 | 100.0% | 100.0% | No P(LOW) crossing inside the tested range. |
| `gpt-4.1` | `fact_only` | 156.25 | 175.78 | 19.53 | 70.0% | 26.7% | Estimated probability band, not an exact threshold. |
| `gpt-4.1` | `retrieved_5_gift_card` | 0 | 19.53 | 19.53 | 100.0% | 50.0% | Estimated probability band, not an exact threshold. |
| `gpt-4.1` | `retrieved_100000_contract` | 0 | 20000 | 20000 | 100.0% | 100.0% | No P(LOW) crossing inside the tested range. |
