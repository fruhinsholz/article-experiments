# Blocking-language key-family pilot analysis

Date: 2026-09-28 America/Los_Angeles  
Provider response model: `jev-1.13.0`  
Calls: 180/180 valid, no errors or retries  
Design: six families, six states, five complete balanced blocks

This is an exploratory pilot. It extends the completed blind natural-key
replication and is not part of its preregistered confirmatory evidence.

## Boundary-state aggregate

The aggregate below includes the four boundary states only, with 20 calls per
family. The review score is `P(partial) + P(none)`.

| Family | Mean review score | Human-review branch | Selected full / partial / none |
|---|---:|---:|---:|
| `neutral` | 48.40% | 8/20 | 13 / 7 / 0 |
| `duty_coverage` | 28.80% | 5/20 | 15 / 5 / 0 |
| `work_capacity_level` | 46.80% | 5/20 | 15 / 5 / 0 |
| `essential_work_impediment` | 57.65% | 13/20 | 7 / 13 / 0 |
| `duty_prevention` | 46.75% | 5/20 | 15 / 5 / 0 |
| `essential_work_blockage` | 45.80% | 5/20 | 15 / 5 / 0 |

## Paired exploratory contrasts

Effects are mean review-score differences over the four boundary states. The
intervals are hierarchical paired bootstrap intervals, resampling states and
blocks. With only five blocks, they should be read as pilot uncertainty, not as
confirmatory inference.

| Contrast | Effect | Exploratory 95% interval |
|---|---:|---:|
| `essential_work_impediment - duty_coverage` | +28.85 pp | [+25.60, +31.85] pp |
| `essential_work_impediment - work_capacity_level` | +10.85 pp | [+5.60, +18.15] pp |
| `duty_prevention - duty_coverage` | +17.95 pp | [+10.95, +23.10] pp |
| `duty_prevention - work_capacity_level` | -0.05 pp | [-3.45, +3.50] pp |
| `essential_work_blockage - duty_coverage` | +17.00 pp | [+12.90, +21.85] pp |
| `essential_work_blockage - work_capacity_level` | -1.00 pp | [-5.75, +5.80] pp |

## Interpretation

The latest proposed family,
`essential_work_not_blocked / essential_work_partially_blocked /
essential_work_fully_blocked`, behaved almost exactly like
`work_capacity_level` in this pilot. Its mean review score was one percentage
point lower, and it produced the same aggregate selected-choice and branch
counts.

The prevention family also matched `work_capacity_level` closely. The distinct
result was the impediment family:
`essential_work_unimpeded / essential_work_impeded / essential_work_halted`.
It increased the aggregate review score and changed eight additional calls to
the human-review branch relative to `work_capacity_level`.

All six families were perfectly stable on both clear controls. The observed
effect is therefore concentrated in ambiguous states rather than reflecting a
general inability to map the key semantics to the fixed descriptions.

This pilot does not establish semantic equivalence or a general ranking of the
families. It shows that `blocked` and `prevented` tracked the earlier
`work_capacity` framing here, while `impeded` shifted the distribution further
toward partial capability.
