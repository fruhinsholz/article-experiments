# Blind natural-key replication analysis

- Calls: 480
- Errors: 0
- Returned model: `jev-1.13.0`
- Primary unit: paired balanced block within state
- Aggregate interval: hierarchical bootstrap over states and paired blocks (10,000 resamples)

## Primary descriptive-family contrasts

Difference is the first family's review score minus the second family's review score.

| Contrast | Aggregate difference | 95% CI | Positive states | Negative states | Branch changed | Criterion met |
|---|---:|---:|---:|---:|---|---|
| duty_coverage - capability_statement | -1.34 pp | [-3.38, 0.34] pp | 2/4 | 2/4 | no | no |
| duty_coverage - work_capacity_level | -17.24 pp | [-24.55, -7.53] pp | 0/4 | 4/4 | yes | yes |
| capability_statement - work_capacity_level | -15.90 pp | [-23.20, -7.23] pp | 0/4 | 4/4 | yes | yes |

### Effects by state

| Contrast | State | Difference | 95% CI | Human-review rate difference | Selection changed |
|---|---|---:|---:|---:|---|
| duty_coverage - capability_statement | boundary_r06_unsure_one_slight_delay | 0.15 pp | [-1.00, 1.35] pp | 0.00 pp | no |
| duty_coverage - capability_statement | boundary_r05_maybe_one_slight_delay | -4.25 pp | [-5.40, -3.00] pp | 0.00 pp | no |
| duty_coverage - capability_statement | boundary_r04_close_to_normal_pace | 0.05 pp | [-0.70, 0.75] pp | 0.00 pp | no |
| duty_coverage - capability_statement | boundary_r08_one_duty_slightly_slower | -1.30 pp | [-4.00, 1.50] pp | 0.00 pp | no |
| duty_coverage - work_capacity_level | boundary_r06_unsure_one_slight_delay | -19.35 pp | [-21.30, -17.25] pp | -10.00 pp | yes |
| duty_coverage - work_capacity_level | boundary_r05_maybe_one_slight_delay | -19.65 pp | [-20.85, -18.35] pp | 0.00 pp | no |
| duty_coverage - work_capacity_level | boundary_r04_close_to_normal_pace | -3.35 pp | [-4.35, -2.55] pp | 0.00 pp | no |
| duty_coverage - work_capacity_level | boundary_r08_one_duty_slightly_slower | -26.60 pp | [-28.90, -24.35] pp | 0.00 pp | no |
| capability_statement - work_capacity_level | boundary_r06_unsure_one_slight_delay | -19.50 pp | [-21.70, -17.25] pp | -10.00 pp | yes |
| capability_statement - work_capacity_level | boundary_r05_maybe_one_slight_delay | -15.40 pp | [-16.70, -14.10] pp | 0.00 pp | no |
| capability_statement - work_capacity_level | boundary_r04_close_to_normal_pace | -3.40 pp | [-4.65, -2.35] pp | 0.00 pp | no |
| capability_statement - work_capacity_level | boundary_r08_one_duty_slightly_slower | -25.30 pp | [-27.20, -23.40] pp | 0.00 pp | no |

## Decision

Criterion met by 2 contrast(s): duty_coverage vs work_capacity_level, capability_statement vs work_capacity_level.

Both clear-state guardrails were stable across all four families.

`A/B/C` comparisons are secondary and are preserved in the JSON analysis.
