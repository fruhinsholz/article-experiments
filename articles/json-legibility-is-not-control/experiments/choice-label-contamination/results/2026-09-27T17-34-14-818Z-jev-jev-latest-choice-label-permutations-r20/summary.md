# Choice-label contamination pilot

- Model requested: `jev-latest`
- Repeats per condition: 20
- State mode: `ambiguous`
- Condition set: `permutations`
- State, question, key vocabulary, key order, and description set are constant.
- Only the assignment of descriptions to keys changes; all six assignments are tested.

- Probability-delta baseline: `permutation_1_full_partial_none`

| Condition | n | P(full) | P(partial) | P(none) | Partial delta vs baseline | Selected |
|---|---:|---:|---:|---:|---:|---|
| permutation_1_full_partial_none | 20 | 0.0815 | 0.9185 | 0.0000 | 0.0000 | {"partial":20} |
| permutation_2_full_none_partial | 20 | 0.3410 | 0.6380 | 0.0210 | -0.2805 | {"partial":20} |
| permutation_3_partial_full_none | 20 | 0.2075 | 0.7925 | 0.0000 | -0.1260 | {"partial":20} |
| permutation_4_partial_none_full | 20 | 0.0455 | 0.9445 | 0.0100 | 0.0260 | {"partial":20} |
| permutation_5_none_full_partial | 20 | 0.6320 | 0.3585 | 0.0095 | -0.5600 | {"full":20} |
| permutation_6_none_partial_full | 20 | 0.0280 | 0.9720 | 0.0000 | 0.0535 | {"partial":20} |

Errors: 0
