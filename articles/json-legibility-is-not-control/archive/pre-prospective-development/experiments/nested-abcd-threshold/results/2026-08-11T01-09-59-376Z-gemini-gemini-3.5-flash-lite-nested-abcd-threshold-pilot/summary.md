# Nested ABCD Threshold Summary

Provider: gemini
Model: gemini-3.5-flash-lite
Calls: 24
Errors: 0

Probe target: LOW should remain one task label. The $5 and $100,000 branch notes are not definitions of LOW.

## Branch-Note Anchor Agreement

This is the failure-shaped metric: B behaving as if $5 defines LOW and D behaving as if $100,000 defines LOW.

| Condition | B matches $5 anchor | D matches $100,000 anchor | Both match anchors | Same-amount split labels |
|---|---:|---:|---:|---:|
| control | 5/6 | 2/6 | 1/6 | 0/6 |
| prefix_free_text | 5/6 | 2/6 | 1/6 | 0/6 |
| suffix_free_text | 5/6 | 2/6 | 1/6 | 0/6 |
| system_rule | 5/6 | 2/6 | 1/6 | 0/6 |

## B LOW Counts By B Amount

| Condition | $5 | $50 | $500 | $5000 | $20000 | $100000 |
|---|---:|---:|---:|---:|---:|---:|
| control | 1 | 1 | 0 | 0 | 0 | 0 |
| prefix_free_text | 1 | 1 | 0 | 0 | 0 | 0 |
| suffix_free_text | 1 | 1 | 0 | 0 | 0 | 0 |
| system_rule | 1 | 1 | 0 | 0 | 0 | 0 |

## D LOW Counts By D Amount

| Condition | $5 | $50 | $500 | $5000 | $20000 | $100000 |
|---|---:|---:|---:|---:|---:|---:|
| control | 1 | 1 | 0 | 0 | 0 | 0 |
| prefix_free_text | 1 | 1 | 0 | 0 | 0 | 0 |
| suffix_free_text | 1 | 1 | 0 | 0 | 0 | 0 |
| system_rule | 1 | 1 | 0 | 0 | 0 | 0 |

## Reading Rule

If JSON hierarchy plus branch independence causes the model to over-bind nearby notes, B may behave as if $5 defines LOW and D may behave as if $100,000 defines LOW. That would be a failure for stable label meaning: the notes are branch context, not definitions of LOW.
