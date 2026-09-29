# Choice-label contamination pilot

- Model requested: `jev-latest`
- Repeats per condition: 5
- State mode: `ambiguous`
- Condition set: `permutations`
- State, question, key vocabulary, key order, and description set are constant.
- Only the assignment of descriptions to keys changes; all six assignments are tested.

- Probability-delta baseline: `permutation_1_full_partial_none`

| Condition | n | P(full) | P(partial) | P(none) | Partial delta vs baseline | Selected |
|---|---:|---:|---:|---:|---:|---|
| permutation_1_full_partial_none | 5 | 0.0880 | 0.9120 | 0.0000 | 0.0000 | {"partial":5} |
| permutation_2_full_none_partial | 5 | 0.3400 | 0.6380 | 0.0220 | -0.2740 | {"partial":5} |
| permutation_3_partial_full_none | 5 | 0.1980 | 0.8020 | 0.0000 | -0.1100 | {"partial":5} |
| permutation_4_partial_none_full | 5 | 0.0440 | 0.9460 | 0.0100 | 0.0340 | {"partial":5} |
| permutation_5_none_full_partial | 5 | 0.6160 | 0.3740 | 0.0100 | -0.5380 | {"full":5} |
| permutation_6_none_partial_full | 5 | 0.0240 | 0.9760 | 0.0000 | 0.0640 | {"partial":5} |

Errors: 0
