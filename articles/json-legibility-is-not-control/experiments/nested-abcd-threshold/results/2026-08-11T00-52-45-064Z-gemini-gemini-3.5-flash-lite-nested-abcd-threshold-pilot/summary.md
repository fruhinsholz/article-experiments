# Nested ABCD Threshold Summary

Provider: gemini
Model: gemini-3.5-flash-lite
Calls: 24
Errors: 0

Local rule under test: B should use the $5 A/B threshold; D should use the $100,000 C/D threshold.

## Local Agreement

| Condition | B local agreement | D local agreement | Both labels local |
|---|---:|---:|---:|
| control | 6/6 | 6/6 | 6/6 |
| prefix_free_text | 6/6 | 6/6 | 6/6 |
| suffix_free_text | 6/6 | 6/6 | 6/6 |
| system_rule | 6/6 | 6/6 | 6/6 |

## B LOW Counts By B Amount

| Condition | $5 | $50 | $500 | $5000 | $20000 | $100000 |
|---|---:|---:|---:|---:|---:|---:|
| control | 1 | 0 | 0 | 0 | 0 | 0 |
| prefix_free_text | 1 | 0 | 0 | 0 | 0 | 0 |
| suffix_free_text | 1 | 0 | 0 | 0 | 0 | 0 |
| system_rule | 1 | 0 | 0 | 0 | 0 | 0 |

## D LOW Counts By D Amount

| Condition | $5 | $50 | $500 | $5000 | $20000 | $100000 |
|---|---:|---:|---:|---:|---:|---:|
| control | 1 | 1 | 1 | 1 | 1 | 1 |
| prefix_free_text | 1 | 1 | 1 | 1 | 1 | 1 |
| suffix_free_text | 1 | 1 | 1 | 1 | 1 | 1 |
| system_rule | 1 | 1 | 1 | 1 | 1 | 1 |

## Reading Rule

If JSON hierarchy were acting like a stable control boundary, B would follow the $5 threshold and D would follow the $100,000 threshold. The experiment looks for cross-branch threshold contamination and for whether outside-text placement changes that behavior.
