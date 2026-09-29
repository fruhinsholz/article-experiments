# Choice-label contamination pilot

- Model requested: `jev-latest`
- Repeats per condition: 20
- State mode: `ambiguous`
- Condition set: `neutral-permutations`
- State, question, key vocabulary, key order, and description set are constant.
- Only the assignment of descriptions to keys changes; all six assignments are tested.

- Probability-delta baseline: `neutral_permutation_1_full_partial_none`

| Condition | n | P(full) | P(partial) | P(none) | Partial delta vs baseline | Selected |
|---|---:|---:|---:|---:|---:|---|
| neutral_permutation_1_full_partial_none | 20 | 0.0505 | 0.9495 | 0.0000 | 0.0000 | {"partial":20} |
| neutral_permutation_2_full_none_partial | 20 | 0.0815 | 0.9185 | 0.0000 | -0.0310 | {"partial":20} |
| neutral_permutation_3_partial_full_none | 20 | 0.0930 | 0.9070 | 0.0000 | -0.0425 | {"partial":20} |
| neutral_permutation_4_partial_none_full | 20 | 0.1035 | 0.8965 | 0.0000 | -0.0530 | {"partial":20} |
| neutral_permutation_5_none_full_partial | 20 | 0.1210 | 0.8790 | 0.0000 | -0.0705 | {"partial":20} |
| neutral_permutation_6_none_partial_full | 20 | 0.1130 | 0.8870 | 0.0000 | -0.0625 | {"partial":20} |

Errors: 0
