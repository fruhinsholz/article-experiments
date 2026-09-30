# Key-framing follow-up analysis

- Calls: 600
- Errors: 0
- Retries: 0
- Returned model(s): `jev-1.13.0`
- No equivalence margin was preregistered; overlapping intervals do not establish equivalence.

## Family-level boundary results

| Family | n | Mean review score | Semantic selections | Human-review branches |
|---|---:|---:|---|---|
| neutral | 80 | 48.85% | {"full":48,"partial":32} | {"automatic_full_capacity":48,"human_review":32} |
| duty_coverage | 80 | 28.40% | {"full":60,"partial":20} | {"automatic_full_capacity":60,"human_review":20} |
| work_capacity_level | 80 | 45.11% | {"full":60,"partial":20} | {"automatic_full_capacity":60,"human_review":20} |
| work_impediment | 80 | 57.24% | {"full":42,"partial":38} | {"automatic_full_capacity":40,"human_review":40} |
| duty_prevention | 80 | 45.86% | {"full":59,"partial":21} | {"automatic_full_capacity":59,"human_review":21} |

## Results by boundary state

### boundary_r04_close_to_normal_pace

| Family | n | Mean review score | Human-review branches |
|---|---:|---:|---:|
| neutral | 20 | 10.30% | 0/20 |
| duty_coverage | 20 | 6.70% | 0/20 |
| work_capacity_level | 20 | 9.70% | 0/20 |
| work_impediment | 20 | 33.15% | 0/20 |
| duty_prevention | 20 | 13.95% | 0/20 |

### boundary_r06_unsure_one_slight_delay

| Family | n | Mean review score | Human-review branches |
|---|---:|---:|---:|
| neutral | 20 | 49.60% | 8/20 |
| duty_coverage | 20 | 24.30% | 0/20 |
| work_capacity_level | 20 | 43.90% | 0/20 |
| work_impediment | 20 | 50.15% | 9/20 |
| duty_prevention | 20 | 41.40% | 0/20 |

### boundary_r08_one_duty_slightly_slower

| Family | n | Mean review score | Human-review branches |
|---|---:|---:|---:|
| neutral | 20 | 90.00% | 20/20 |
| duty_coverage | 20 | 62.40% | 20/20 |
| work_capacity_level | 20 | 87.70% | 20/20 |
| work_impediment | 20 | 95.65% | 20/20 |
| duty_prevention | 20 | 84.95% | 20/20 |

### boundary_r05_maybe_one_slight_delay

| Family | n | Mean review score | Human-review branches |
|---|---:|---:|---:|
| neutral | 20 | 45.50% | 4/20 |
| duty_coverage | 20 | 20.20% | 0/20 |
| work_capacity_level | 20 | 39.15% | 0/20 |
| work_impediment | 20 | 50.00% | 11/20 |
| duty_prevention | 20 | 43.15% | 1/20 |


## Preregistered contrasts

Difference is the first family's review score minus the second family's review score.

| Contrast | Aggregate difference | 95% interval | Positive states | Negative states | Selection changes | Branch changes |
|---|---:|---:|---:|---:|---:|---:|
| work_impediment - duty_coverage | 28.84 pp | [25.85, 31.94] pp | 4/4 | 0/4 | 18 | 20 |
| work_impediment - work_capacity_level | 12.13 pp | [6.88, 19.78] pp | 4/4 | 0/4 | 18 | 20 |
| duty_prevention - duty_coverage | 17.46 pp | [10.84, 22.90] pp | 4/4 | 0/4 | 1 | 1 |
| duty_prevention - work_capacity_level | 0.75 pp | [-2.75, 4.20] pp | 2/4 | 2/4 | 1 | 1 |
| work_impediment - duty_prevention | 11.37 pp | [7.45, 16.64] pp | 4/4 | 0/4 | 17 | 19 |

## Paired branch transitions

Direction is from the second family to the first family in each contrast.

| Contrast | Automatic to human review | Human review to automatic | Both automatic | Both human review |
|---|---:|---:|---:|---:|
| duty_coverage -> work_impediment | 20 | 0 | 40 | 20 |
| work_capacity_level -> work_impediment | 20 | 0 | 40 | 20 |
| duty_coverage -> duty_prevention | 1 | 0 | 59 | 20 |
| work_capacity_level -> duty_prevention | 1 | 0 | 59 | 20 |
| duty_prevention -> work_impediment | 19 | 0 | 40 | 21 |

## Leave-one-state-out sensitivity

### work_impediment - duty_coverage

| Omitted state | Difference across remaining states | 95% interval | Positive states | Negative states |
|---|---:|---:|---:|---:|
| boundary_r04_close_to_normal_pace | 29.63 pp | [26.12, 33.10] pp | 3/3 | 0/3 |
| boundary_r06_unsure_one_slight_delay | 29.83 pp | [26.48, 33.07] pp | 3/3 | 0/3 |
| boundary_r08_one_duty_slightly_slower | 27.37 pp | [25.20, 29.73] pp | 3/3 | 0/3 |
| boundary_r05_maybe_one_slight_delay | 28.52 pp | [25.20, 33.05] pp | 3/3 | 0/3 |

### work_impediment - work_capacity_level

| Omitted state | Difference across remaining states | 95% interval | Positive states | Negative states |
|---|---:|---:|---:|---:|
| boundary_r04_close_to_normal_pace | 8.35 pp | [6.15, 10.83] pp | 3/3 | 0/3 |
| boundary_r06_unsure_one_slight_delay | 14.08 pp | [8.08, 23.17] pp | 3/3 | 0/3 |
| boundary_r08_one_duty_slightly_slower | 13.52 pp | [6.35, 23.13] pp | 3/3 | 0/3 |
| boundary_r05_maybe_one_slight_delay | 12.55 pp | [6.12, 23.12] pp | 3/3 | 0/3 |

### duty_prevention - duty_coverage

| Omitted state | Difference across remaining states | 95% interval | Positive states | Negative states |
|---|---:|---:|---:|---:|
| boundary_r04_close_to_normal_pace | 20.87 pp | [17.35, 23.62] pp | 3/3 | 0/3 |
| boundary_r06_unsure_one_slight_delay | 17.58 pp | [7.37, 23.58] pp | 3/3 | 0/3 |
| boundary_r08_one_duty_slightly_slower | 15.77 pp | [7.33, 22.63] pp | 3/3 | 0/3 |
| boundary_r05_maybe_one_slight_delay | 15.63 pp | [7.40, 22.33] pp | 3/3 | 0/3 |

### duty_prevention - work_capacity_level

| Omitted state | Difference across remaining states | 95% interval | Positive states | Negative states |
|---|---:|---:|---:|---:|
| boundary_r04_close_to_normal_pace | -0.42 pp | [-3.38, 3.80] pp | 1/3 | 2/3 |
| boundary_r06_unsure_one_slight_delay | 1.83 pp | [-2.52, 4.72] pp | 2/3 | 1/3 |
| boundary_r08_one_duty_slightly_slower | 1.92 pp | [-2.07, 4.77] pp | 2/3 | 1/3 |
| boundary_r05_maybe_one_slight_delay | -0.33 pp | [-3.33, 4.12] pp | 1/3 | 2/3 |

### work_impediment - duty_prevention

| Omitted state | Difference across remaining states | 95% interval | Positive states | Negative states |
|---|---:|---:|---:|---:|
| boundary_r04_close_to_normal_pace | 8.77 pp | [6.55, 10.73] pp | 3/3 | 0/3 |
| boundary_r06_unsure_one_slight_delay | 12.25 pp | [6.98, 18.93] pp | 3/3 | 0/3 |
| boundary_r08_one_duty_slightly_slower | 11.60 pp | [6.55, 18.98] pp | 3/3 | 0/3 |
| boundary_r05_maybe_one_slight_delay | 12.88 pp | [8.60, 18.87] pp | 3/3 | 0/3 |


## Clear-state guardrails

### clear_full

| Family | Mean review score | Semantic selections | Branches |
|---|---:|---|---|
| neutral | 0.00% | {"full":20} | {"automatic_full_capacity":20} |
| duty_coverage | 0.00% | {"full":20} | {"automatic_full_capacity":20} |
| work_capacity_level | 0.00% | {"full":20} | {"automatic_full_capacity":20} |
| work_impediment | 0.00% | {"full":20} | {"automatic_full_capacity":20} |
| duty_prevention | 0.00% | {"full":20} | {"automatic_full_capacity":20} |

### clear_partial

| Family | Mean review score | Semantic selections | Branches |
|---|---:|---|---|
| neutral | 100.00% | {"partial":20} | {"human_review":20} |
| duty_coverage | 100.00% | {"partial":20} | {"human_review":20} |
| work_capacity_level | 100.00% | {"partial":20} | {"human_review":20} |
| work_impediment | 100.00% | {"partial":20} | {"human_review":20} |
| duty_prevention | 100.00% | {"partial":20} | {"human_review":20} |
