# Blind natural-key replication: calibration and selection

Date: 2026-09-27
Returned model: `jev-1.13.0`

The neutral `A/B/C` calibration completed 120 calls with no errors. Selection
followed `REPLICATION_PREREGISTRATION.md` without inspecting any descriptive key
family.

## Selected boundary states

| Rank | State | Mean review score | Inside [0.35, 0.65] | Distance from 0.50 |
|---:|---|---:|---|---:|
| 1 | `r06_unsure_one_slight_delay` | 0.489 | yes | 0.011 |
| 2 | `r05_maybe_one_slight_delay` | 0.470 | yes | 0.030 |
| 3 | `r04_close_to_normal_pace` | 0.105 | no, fallback | 0.395 |
| 4 | `r08_one_duty_slightly_slower` | 0.908 | no, fallback | 0.408 |

Only two states fell inside the target interval, so the two nearest remaining
states were selected by the preregistered fallback rule.

## Guardrails

- `clear_full`: `r00_explicit_normal`, mean review score 0.000.
- `clear_partial`: `r11_explicit_partial`, mean review score 1.000.

## Evidence

`results/2026-09-27T22-31-09-875Z-jev-jev-latest-blind-natural-key-replication-calibration/`
