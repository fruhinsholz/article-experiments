# Preregistration: model-facing key framing and routing boundary

Date frozen: 2026-09-29

## Claim

Two coherent model-facing schema designs that map to the same application outcomes
can produce different score distributions and thresholded routing in the tested Jev
interface.

The comparison is between alternative framings, not synonyms:

- `duty_prevention`: an explicit ordered `no / some / all ... prevented` scale;
- `work_impediment`: an asymmetric `unimpeded / impeded / halted` scale.

## Frozen design

- Provider: Jev.
- Requested model alias: `jev-latest`; preserve and report the returned version.
- Primary states: `r05` and `r06`.
- Range controls: `r04` and `r08`.
- Guardrails: `clear_full` and `clear_partial`.
- Families: `duty_prevention` and `work_impediment` only.
- Blocks: 60 complete randomized blocks.
- Per block: six states by two families, or 12 calls.
- Total: 720 calls.
- Choice order: all six semantic permutations, each used by exactly ten blocks.
- Pairing: both families use the same semantic order within each state and block.
- Call order: randomized inside every complete block.
- Randomization seed: `29092001`.
- Concurrency: 5.
- Retries: up to 3, only for HTTP 429, 503, or 529.
- No temperature parameter is sent to Jev.
- Routing rule: human review when `P(partial) + P(none) >= 0.50`.

The exact states, descriptions, key names, question, application rule, semantic
orders, and seed are frozen in `stimuli.v1.json`.

## Primary estimands

For each complete block:

1. calculate `work_impediment - duty_prevention` review-score difference for `r05`;
2. calculate the same difference for `r06`;
3. average those two state differences equally.

The primary score estimand is the mean of the 60 block effects. Its 95% interval is
the percentile interval from 10,000 bootstrap samples of the 60 complete blocks.

The primary routing estimand is constructed the same way after coding human review
as 1 and automatic routing as 0. Report its block-bootstrap 95% interval.

Also report the two state-specific score effects, threshold transition counts,
range-control results, guardrail accuracy, errors, retries, and returned versions.

## Frozen success criteria

The primary test succeeds only if all conditions hold:

1. the primary mean score shift is at least +5 percentage points;
2. its 95% complete-block bootstrap interval is entirely above zero;
3. both `r05` and `r06` shift in the predicted positive direction;
4. the human-review rate increases and its 95% complete-block bootstrap interval
   is entirely above zero;
5. each clear-state guardrail routes correctly in at least 95% of calls for each
   family;
6. every valid response reports one identical Jev version.

## Abort and retry rules

- Preserve every raw request, successful raw response, timestamp, retry error, and
  retry count in the call record.
- Retry only HTTP 429, 503, or 529, with deterministic linear backoff.
- Do not replace a valid response.
- If any non-retryable error occurs, or any cell remains incomplete after allowed
  retries, stop interpretation. A replacement run requires a new written amendment
  before more model calls.
- Do not add calls after inspecting outcomes.

## Interpretation limits

- The two families are coherent alternatives, not semantically interchangeable
  symbols.
- The states are deliberately selected probes, not a production sample.
- The threshold is an experimental application rule, not a deployed policy.
- The result does not identify an internal mechanism or establish calibrated
  probabilities.
- Earlier experiments were test-bed development and are excluded from this
  prospective estimate, interval, and success decision.
