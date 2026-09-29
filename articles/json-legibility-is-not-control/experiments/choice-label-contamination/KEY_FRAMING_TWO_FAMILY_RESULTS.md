# Impediment and prevention key families: results

Date: 2026-09-28 (America/Los_Angeles)

Result directory:
`results/2026-09-29T02-06-01-709Z-jev-jev-latest-key-framing-followup/`

## Design actually executed

The run crossed the same six states and fixed choice descriptions used in the
blind natural-key replication with five key families:

- neutral `A/B/C`;
- `duty_coverage`;
- `work_capacity_level`;
- `work_impediment`:
  `essential_work_unimpeded`, `essential_work_impeded`,
  `essential_work_halted`;
- `duty_prevention`:
  `no_essential_duty_prevented`, `some_essential_duties_prevented`,
  `all_essential_duties_prevented`.

The state, question, descriptions, threshold, model alias, sampling plan, and
temperature were held fixed. The run used 20 complete balanced blocks, producing
600 calls. The immutable `run.json` in the result directory records the exact
stimulus snapshot and randomized job order used for this run.

## Execution

- Valid calls: 600/600
- Errors: 0
- Retries: 0
- Returned model: `jev-1.13.0`

## Boundary-state means

The review score is `P(partial) + P(none)`.

| Family | Mean review score |
|---|---:|
| `duty_coverage` | 28.40% |
| `work_capacity_level` | 45.11% |
| `duty_prevention` | 45.86% |
| neutral `A/B/C` | 48.85% |
| `work_impediment` | 57.24% |

The two benchmark families closely reproduced their earlier means:
`duty_coverage` moved from 27.95% to 28.40%, and `work_capacity_level` from
45.19% to 45.11%.

## Paired contrasts

Intervals are hierarchical bootstrap 95% intervals over states and paired
blocks.

| Contrast | Difference | 95% interval | Direction | Threshold branch changes |
|---|---:|---:|---|---:|
| `work_impediment - duty_coverage` | +28.84 pp | [+25.85, +31.94] pp | positive in 4/4 states | 20 |
| `work_impediment - work_capacity_level` | +12.13 pp | [+6.88, +19.78] pp | positive in 4/4 states | 20 |
| `duty_prevention - duty_coverage` | +17.46 pp | [+10.84, +22.90] pp | positive in 4/4 states | 1 |
| `duty_prevention - work_capacity_level` | +0.75 pp | [-2.75, +4.20] pp | positive in 2/4 states | 1 |
| `work_impediment - duty_prevention` | +11.37 pp | [+7.45, +16.64] pp | positive in 4/4 states | 19 |

## Interpretation

`duty_prevention` behaved very similarly to `work_capacity_level` in this run.
Their mean difference was only +0.75 percentage points, the interval crossed
zero, and the direction split two states to two. Because no equivalence margin
was specified, this is evidence of similarity, not formal equivalence.

`work_impediment` was not merely another version of the previous high-scoring
family. It increased the review score by 12.13 points relative to
`work_capacity_level` and by 11.37 points relative to `duty_prevention`, with the
same direction in all four boundary states. It also changed the application
branch in the two states nearest the threshold.

This suggests that the lexical framing matters beyond simple negative polarity.
Both new families describe obstruction, but `unimpeded / impeded / halted`
produced a materially stronger pull toward partial work than the logically
reversed `no / some / all duties prevented` family.

The clear-state guardrails remained perfect across all five families:

- clear full: 100/100 full selections and automatic branches;
- clear partial: 100/100 partial selections and human-review branches.

The result strengthens the narrow engineering conclusion: semantically coherent
choice identifiers can shift a fixed Jev distribution, and key vocabulary can
affect thresholded behavior without causing errors on clear cases.
