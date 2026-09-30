# Preregistration amendment 1: calibrated boundary state

Date: 2026-09-27
Status: frozen before confirmatory execution

No confirmatory call has been made.

## Reason

The original technical pilot showed that the initial boundary state was saturated:
under neutral keys its review score was `0.99`, and semantic families ranged from
`0.96` to `0.99`. It could not meaningfully test the preregistered branch threshold
of `0.50`.

The first neutral-only calibration also saturated, with all five state means between
`0.99` and `1.00`. A second frozen neutral-only ladder tested uncertainty around the
exact phrase `normal quality and pace`.

## Mechanical selection

The registered rule selected the state with mean `P(partial) + P(none)` closest to
`0.50`. Results from five repeats per state were:

| State | Mean review score | Distance from 0.50 |
|---|---:|---:|
| `d0_explicit_normal` | 0.000 | 0.500 |
| `d1_normal_but_untested_day` | 0.094 | 0.406 |
| `d2_one_duty_may_be_slower` | 0.462 | 0.038 |
| `d3_roughly_normal_pace` | 0.000 | 0.500 |
| `d4_close_to_normal_pace` | 0.080 | 0.420 |

The selected boundary text is therefore copied byte-for-byte from
`d2_one_duty_may_be_slower` into `refined-stimuli.v2.json`.

## Unchanged elements

- Primary and secondary hypotheses.
- Three accepted key families and neutral reference.
- Canonical descriptions and their order.
- Clear-full and clear-partial control states.
- Application threshold `0.50`.
- Twenty repeats per confirmatory cell.
- Balanced-block analysis, error rules, estimator, uncertainty method, multiplicity
  handling, and success/failure criteria.

## Confirmatory gate

The confirmatory command must use `refined-stimuli.v2.json`. Pilot and calibration
calls remain excluded. The change requires owner approval because it replaces the
originally validated boundary wording, even though the replacement was selected by
a frozen neutral-only rule.
