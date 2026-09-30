# Nested ABCD Threshold Summary

Provider: gemini
Model: gemini-3.5-flash-lite
Calls: 192
Errors: 0

Probe target: LOW should remain one task label. The $5 and $100,000 branch notes are not definitions of LOW.

## Branch-Note Anchor Agreement

This is the failure-shaped metric: B behaving as if $5 defines LOW and D behaving as if $100,000 defines LOW.

| Condition | Note mode | B matches $5 anchor | D matches $100,000 anchor | Both match anchors | Same-amount split labels |
|---|---|---:|---:|---:|---:|
| control | a_only | 8/12 | 6/12 | 6/12 | 0/0 |
| control | both | 7/12 | 6/12 | 6/12 | 0/0 |
| control | c_only | 6/12 | 9/12 | 6/12 | 0/0 |
| control | none | 6/12 | 6/12 | 6/12 | 0/0 |
| prefix_free_text | a_only | 8/12 | 6/12 | 6/12 | 0/0 |
| prefix_free_text | both | 6/12 | 6/12 | 6/12 | 0/0 |
| prefix_free_text | c_only | 6/12 | 7/12 | 6/12 | 0/0 |
| prefix_free_text | none | 6/12 | 6/12 | 6/12 | 0/0 |
| suffix_free_text | a_only | 8/12 | 6/12 | 6/12 | 0/0 |
| suffix_free_text | both | 9/12 | 6/12 | 6/12 | 0/0 |
| suffix_free_text | c_only | 6/12 | 7/12 | 6/12 | 0/0 |
| suffix_free_text | none | 6/12 | 6/12 | 6/12 | 0/0 |
| system_rule | a_only | 6/12 | 6/12 | 6/12 | 0/0 |
| system_rule | both | 7/12 | 6/12 | 6/12 | 0/0 |
| system_rule | c_only | 6/12 | 7/12 | 6/12 | 0/0 |
| system_rule | none | 6/12 | 6/12 | 6/12 | 0/0 |

## Simple Influence View

Influence means the branch note changed the diagnostic LOW count compared with the same condition and no branch note.

| Condition | Note mode | B influenced? | D influenced? | Evidence |
|---|---|---|---|---|
| control | a_only | yes | n/a | B $500 LOW 1 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |
| control | c_only | n/a | yes | B $500 LOW 3 vs 3 baseline; D $5,000 LOW 3 vs 0 baseline |
| control | both | yes | no | B $500 LOW 2 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |
| prefix_free_text | a_only | yes | n/a | B $500 LOW 1 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |
| prefix_free_text | c_only | n/a | yes | B $500 LOW 3 vs 3 baseline; D $5,000 LOW 1 vs 0 baseline |
| prefix_free_text | both | no | no | B $500 LOW 3 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |
| suffix_free_text | a_only | yes | n/a | B $500 LOW 1 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |
| suffix_free_text | c_only | n/a | yes | B $500 LOW 3 vs 3 baseline; D $5,000 LOW 1 vs 0 baseline |
| suffix_free_text | both | yes | no | B $500 LOW 0 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |
| system_rule | a_only | no | n/a | B $500 LOW 3 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |
| system_rule | c_only | n/a | yes | B $500 LOW 3 vs 3 baseline; D $5,000 LOW 1 vs 0 baseline |
| system_rule | both | yes | no | B $500 LOW 2 vs 3 baseline; D $5,000 LOW 0 vs 0 baseline |

## B LOW Counts By B Amount

| Condition | $50 | $500 | $5000 | $100000 |
|---|---:|---:|---:|---:|
| control/a_only | 3 | 1 | 0 | 0 |
| control/both | 3 | 2 | 0 | 0 |
| control/c_only | 3 | 3 | 0 | 0 |
| control/none | 3 | 3 | 0 | 0 |
| prefix_free_text/a_only | 3 | 1 | 0 | 0 |
| prefix_free_text/both | 3 | 3 | 0 | 0 |
| prefix_free_text/c_only | 3 | 3 | 0 | 0 |
| prefix_free_text/none | 3 | 3 | 0 | 0 |
| suffix_free_text/a_only | 3 | 1 | 0 | 0 |
| suffix_free_text/both | 3 | 0 | 0 | 0 |
| suffix_free_text/c_only | 3 | 3 | 0 | 0 |
| suffix_free_text/none | 3 | 3 | 0 | 0 |
| system_rule/a_only | 3 | 3 | 0 | 0 |
| system_rule/both | 3 | 2 | 0 | 0 |
| system_rule/c_only | 3 | 3 | 0 | 0 |
| system_rule/none | 3 | 3 | 0 | 0 |

## D LOW Counts By D Amount

| Condition | $5 | $50 | $5000 | $50000 |
|---|---:|---:|---:|---:|
| control/a_only | 3 | 3 | 0 | 0 |
| control/both | 3 | 3 | 0 | 0 |
| control/c_only | 3 | 3 | 3 | 0 |
| control/none | 3 | 3 | 0 | 0 |
| prefix_free_text/a_only | 3 | 3 | 0 | 0 |
| prefix_free_text/both | 3 | 3 | 0 | 0 |
| prefix_free_text/c_only | 3 | 3 | 1 | 0 |
| prefix_free_text/none | 3 | 3 | 0 | 0 |
| suffix_free_text/a_only | 3 | 3 | 0 | 0 |
| suffix_free_text/both | 3 | 3 | 0 | 0 |
| suffix_free_text/c_only | 3 | 3 | 1 | 0 |
| suffix_free_text/none | 3 | 3 | 0 | 0 |
| system_rule/a_only | 3 | 3 | 0 | 0 |
| system_rule/both | 3 | 3 | 0 | 0 |
| system_rule/c_only | 3 | 3 | 1 | 0 |
| system_rule/none | 3 | 3 | 0 | 0 |

## Reading Rule

If JSON hierarchy plus branch independence causes the model to over-bind nearby notes, B may behave as if $5 defines LOW and D may behave as if $100,000 defines LOW. That would be a failure for stable label meaning: the notes are branch context, not definitions of LOW.
