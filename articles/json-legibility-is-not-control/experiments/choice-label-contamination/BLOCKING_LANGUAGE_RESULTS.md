# Blocking-language key-family results

Date: 2026-09-28
Model returned by Jev: `jev-1.13.0`

## Design

Two related runs used the same operational question, descriptions, four boundary
states, two clear-state guardrails, threshold, and temperature:

1. A 600-call follow-up with 20 balanced blocks compared `work_impediment` and
   `duty_prevention` with `A/B/C`, `duty_coverage`, and
   `work_capacity_level`.
2. A 180-call exploratory pilot with five balanced blocks added
   `essential_work_blockage` and repeated all contemporaneous references.

Both runs completed with zero errors and zero retries.

## Boundary-state results

| Key family | Mean review score | Blocks | Interpretation |
|---|---:|---:|---|
| `A/B/C` | 48.85% | 20 | Secondary neutral reference |
| `duty_coverage` | 28.40% | 20 | Lowest review score |
| `work_capacity_level` | 45.11% | 20 | Ordered level reference |
| `work_impediment` | 57.24% | 20 | Highest review score |
| `duty_prevention` | 45.86% | 20 | Close to capacity-level framing |
| `essential_work_blockage` | 45.80% | 5 | Pilot only; close to capacity and prevention |

The first five rows use the 600-call follow-up. The blockage row uses the
five-block pilot; its contemporaneous pilot references were 46.80% for
`work_capacity_level`, 46.75% for `duty_prevention`, and 57.65% for
`essential_work_impediment`.

## Main contrasts

| Contrast | Review-score difference | Hierarchical 95% interval | Direction |
|---|---:|---:|---|
| `work_impediment - duty_coverage` | +28.84 pp | [25.85, 31.94] pp | positive in 4/4 states |
| `work_impediment - work_capacity_level` | +12.13 pp | [6.88, 19.78] pp | positive in 4/4 states |
| `duty_prevention - duty_coverage` | +17.46 pp | [10.84, 22.90] pp | positive in 4/4 states |
| `duty_prevention - work_capacity_level` | +0.75 pp | [-2.75, 4.20] pp | mixed, 2/4 each way |
| `essential_work_blockage - duty_coverage` | +17.00 pp | [12.85, 21.80] pp | positive in 4/4 states |
| `essential_work_blockage - work_capacity_level` | -1.00 pp | [-5.70, 5.70] pp | pilot, mixed |
| `essential_work_blockage - duty_prevention` | -0.95 pp | [-4.50, 2.95] pp | pilot, mixed |
| `essential_work_blockage - essential_work_impediment` | -11.85 pp | [-14.60, -9.10] pp | negative in 4/4 states |

## Operational effect

Across the 80 boundary calls per family in the 600-call run:

- `work_impediment` triggered human review in 40/80 calls;
- `work_capacity_level` triggered review in 20/80 calls;
- `duty_prevention` triggered review in 21/80 calls;
- `duty_coverage` triggered review in 20/80 calls.

`work_impediment` therefore changed the application branch materially. In the
five-block pilot, `essential_work_blockage`, `duty_prevention`, and
`work_capacity_level` each triggered review in 5/20 boundary calls, while
`essential_work_impediment` triggered review in 13/20.

## Interpretation

The negative vocabulary alone does not explain the effect. The explicit ordered
scales `no/some/all ... prevented` and `not/partially/fully blocked` behaved much
like `full/limited/no ... capacity`. The asymmetric
`unimpeded/impeded/halted` family behaved differently and assigned substantially
more probability to partial work.

A plausible linguistic explanation is that bare `impeded` already suggests a
meaningful impairment, whereas `partially blocked` and `some duties prevented`
encode their degree explicitly. This is an interpretation of the behavioral
pattern, not evidence about Jev's internal mechanism.

The blockage result has only five balanced blocks. Its closeness to capacity and
prevention is descriptive, not formal equivalence. No equivalence margin was
specified.

Both clear-state guardrails were perfect in both runs: every clear-full call took
the automatic branch and every clear-partial call took human review.
