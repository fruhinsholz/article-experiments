# Low Threshold Bands

Created: 2026-07-29T18:47:12.807Z
Commit: 7ca53d045534dfe5b05e7e3de2b2209c2ed50b41

| Model | Context | Lower observed bound | Upper observed bound | Width | Lower P(LOW) | Upper P(LOW) | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `gpt-5.5` | `fact_only` | 996.1 | 1015.63 | 19.53 | 93.3% | 0.0% | Estimated probability band, not an exact threshold. |
| `gpt-5.5` | `retrieved_5_gift_card` | 488.28 | 507.81 | 19.53 | 100.0% | 0.0% | Estimated probability band, not an exact threshold. |
| `gpt-5.5` | `retrieved_100000_contract` | 19980.47 | 20000 | 19.53 | 100.0% | 46.7% | Estimated probability band, not an exact threshold. |
| `gpt-5.6` | `fact_only` | 97.66 | 117.19 | 19.53 | 100.0% | 13.3% | Estimated probability band, not an exact threshold. |
| `gpt-5.6` | `retrieved_5_gift_card` | 39.06 | 58.59 | 19.53 | 70.0% | 16.7% | Estimated probability band, not an exact threshold. |
| `gpt-5.6` | `retrieved_100000_contract` | 0 | 20000 | 20000 | 100.0% | 66.7% | No P(LOW) crossing inside the tested range. |
