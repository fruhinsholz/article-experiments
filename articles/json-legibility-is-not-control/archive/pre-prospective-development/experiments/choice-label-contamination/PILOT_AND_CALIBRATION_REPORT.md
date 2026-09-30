# Refined Phase A pilot and calibration report

Date: 2026-09-27
Model returned: `jev-1.13.0`

## Technical pilot

- 30 successful calls, 0 errors.
- Two balanced repeats across three states and five families.
- Clear-full selected `full` in 10/10 calls.
- Clear-partial selected `partial` in 10/10 calls.
- Original boundary selected `partial` in 10/10 calls.
- Original boundary review score was `0.99` under neutral keys and `0.96` to `0.99`
  under semantic families.

The harness, remapping, branch policy, raw-response preservation, and randomization
worked. The original boundary was too saturated for the threshold outcome.

## Neutral calibration round 1

- 25 successful calls, 0 errors.
- All five candidate states selected `partial` in every call.
- Mean review scores ranged from `0.99` to `1.00`.

This established that phone access and incomplete coverage language sit firmly on
the partial side under the canonical descriptions.

## Neutral calibration round 2

- 25 successful calls, 0 errors.
- `d2_one_duty_may_be_slower` was closest to the fixed `0.50` threshold.
- Its mean review score was `0.462`.
- It selected `full` in 4/5 calls and `partial` in 1/5 calls.
- It selected the automatic branch in 4/5 calls and human review in 1/5 calls.

The selected state is genuinely close to both the semantic and operational
boundary. It is suitable for confirmatory Phase A if the manifest amendment is
approved.

## Evidence directories

- Technical pilot:
  `results/2026-09-27T19-07-01-459Z-jev-jev-latest-refined-phase-a-technical-pilot/`
- Neutral calibration round 1:
  `results/2026-09-27T19-08-15-585Z-jev-jev-latest-refined-phase-a-boundary-calibration/`
- Neutral calibration round 2:
  `results/2026-09-27T19-08-53-143Z-jev-jev-latest-refined-phase-a-boundary-calibration-v2/`
