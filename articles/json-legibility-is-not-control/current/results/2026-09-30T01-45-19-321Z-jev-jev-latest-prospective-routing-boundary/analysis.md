# Prospective routing-boundary results

- Valid calls: 720
- Errors: 0
- Retries: 0
- Returned model version(s): `jev-1.13.0`
- Frozen success decision: **SUPPORTED**

## Primary result

Across the two primary states, `work_impediment` minus `duty_prevention` shifted the review score by **+6.88 pp** (complete-block bootstrap 95% interval **[+5.63 pp, +8.13 pp]**).

The human-review rate changed by **+25.00 pp** (95% interval **[+15.00 pp, +35.83 pp]**).

| State | Prevention score | Impediment score | Difference | Review-rate difference |
|---|---:|---:|---:|---:|
| `r05_maybe_one_slight_delay` | 46.63% | 52.15% | +5.52 pp | +15.00 pp |
| `r06_unsure_one_slight_delay` | 47.68% | 55.93% | +8.25 pp | +35.00 pp |
| `r04_close_to_normal_pace` | 13.63% | 25.97% | +12.33 pp | +0.00 pp |
| `r08_one_duty_slightly_slower` | 88.48% | 94.65% | +6.17 pp | +0.00 pp |
| `clear_full` | 0.00% | 0.00% | +0.00 pp | +0.00 pp |
| `clear_partial` | 100.00% | 100.00% | +0.00 pp | +0.00 pp |

## Primary threshold transitions

- automatic to human review: 33
- human review to automatic: 3
- automatic under both: 32
- human review under both: 52

## Guardrails

| State | Family | Correct route | Accuracy |
|---|---|---:|---:|
| `clear_full` | `duty_prevention` | 60/60 | 100.00% |
| `clear_full` | `work_impediment` | 60/60 | 100.00% |
| `clear_partial` | `duty_prevention` | 60/60 | 100.00% |
| `clear_partial` | `work_impediment` | 60/60 | 100.00% |

## Frozen success criteria

- PASS: `scoreShiftAtLeastFivePoints`
- PASS: `scoreIntervalAboveZero`
- PASS: `bothPrimaryStatesPositive`
- PASS: `reviewRateIncreaseWithIntervalAboveZero`
- PASS: `guardrailsAtLeast95Percent`
- PASS: `oneReturnedModelVersion`

Earlier experiments were test-bed development and are excluded from these estimates and the success decision.
