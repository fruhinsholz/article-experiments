# Choice-key instruction ablation

This is a post-confirmatory ablation. It asks whether the observed choice-key effect survives removal of the explicit instruction to treat names as identifiers and answer from descriptions.

Only this suffix was removed:

> Treat choice names as identifiers. Base the answer on the descriptions.

The state, question, descriptions, key families, key order, application threshold, randomization seed, model alias, repeats, and concurrency were held fixed.

- Calls with instruction: 240
- Calls without instruction: 240
- Returned model: `jev-1.13.0`
- Clear-control errors: 0 with instruction; 0 without instruction

## Boundary results

| Key family | Review score with instruction | Review score without | Change | Human review with instruction | Human review without |
|---|---:|---:|---:|---:|---:|
| capacity | 44.55% | 40.70% | -3.85 pp | 10% | 0% |
| neutral | 48.75% | 48.15% | -0.60 pp | 45% | 35% |
| task_coverage | 39.95% | 44.10% | 4.15 pp | 0% | 0% |
| work_completion | 42.35% | 40.20% | -2.15 pp | 5% | 0% |

## Aggregate readout

- Mean descriptive-key gap versus neutral: -6.47 pp with the instruction; -6.48 pp without it.
- Mean descriptive-family human-review rate: 5.00% with the instruction; 0.00% without it.
- Neutral human-review rate: 45% with the instruction; 35% without it.

## Interpretation

Removing the instruction did not remove the choice-key effect. The aggregate review-score gap between descriptive keys and neutral A/B/C keys remained almost unchanged, and the operational branch still changed at the boundary. The exact family-level pattern did change, so the two runs are not numerically equivalent. This comparison supports robustness of the narrow conclusion, not formal equivalence of the distributions.

The ablation also removes a plausible objection to the original wording: the observed effect is not dependent on explicitly telling Jev to discount key names. In this protocol, descriptive key names remained behaviorally active when the question contained no instruction about how to treat them.
