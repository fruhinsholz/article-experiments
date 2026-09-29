# Choice-key question-wording ablation

This post-confirmatory ablation asks whether the choice-key effect survives replacing the description-oriented question with an operational one.

Before:

> Which description best represents the person's current ability to complete essential work?

After:

> To what extent can the person currently perform their essential work?

Neither condition includes an instruction about how to treat choice names. The state, descriptions, key families, key order, application threshold, randomization seed, model alias, repeats, and concurrency were held fixed.

- Valid calls with descriptive question: 240/240
- Valid calls with operational question: 240/240
- Retried HTTP 529 requests in final operational run: 0
- Returned model: `jev-1.13.0`
- Clear-control errors: 0 before; 0 after

## Boundary results

| Key family | Review score before | Review score after | Change | Human review before | Human review after |
|---|---:|---:|---:|---:|---:|
| capacity | 40.70% | 43.45% | +2.75 pp | 0/20 | 1/20 |
| neutral | 48.15% | 47.10% | -1.05 pp | 7/20 | 7/20 |
| task_coverage | 44.10% | 32.25% | -11.85 pp | 0/20 | 0/20 |
| work_completion | 40.20% | 39.90% | -0.30 pp | 0/20 | 0/20 |

## Aggregate readout

- Mean descriptive-key gap versus neutral: -6.48 pp before; -8.57 pp after.
- Change in that gap: -2.08 pp.
- Mean descriptive-family human-review rate: 0.00% before; 1.67% after.
- Neutral human-review rate: 35% before; 35% after.

## Interpretation

The operational wording did not remove the choice-key effect. The aggregate gap between descriptive keys and neutral A/B/C keys increased in magnitude, and the application branch still differed at the boundary. The exact family-level distributions changed substantially, so the two runs are not numerically equivalent.

This strengthens the narrow robustness claim: the observed effect does not depend on either the explicit identifier instruction or a question that asks which description fits best. It remains post-confirmatory supporting evidence, not a new preregistered confirmatory result or proof that every reasonable key substitution will matter.
