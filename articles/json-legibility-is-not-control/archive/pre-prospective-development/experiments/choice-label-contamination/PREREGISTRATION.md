# Preregistration: realistic Jev choice-key sensitivity

Date frozen: 2026-09-27
Stimulus manifest: `refined-stimuli.v1.json`
Status: frozen before the technical pilot

## Hypotheses

- Primary: a reasonable LLM-facing choice-key rename is not necessarily a
  behavior-preserving refactor.
- Secondary: in a symmetric conflict, key wording may exert a larger average
  marginal effect than description wording.

Phase A tests the primary hypothesis. Phase B tests the secondary hypothesis and
requires a separate frozen manifest before it is run.

## Phase A design

Cross three states with one neutral and three accepted semantic key families.
Descriptions, description order, question, instruction, model request, and API
route remain fixed. Each repeat is a complete balanced block containing all 12
state-family cells once. Cell order is shuffled with seed `27092026`.

The `ability` family failed the semantic-equivalence screen. It appears only in the
technical pilot for harness coverage and is excluded from confirmatory analysis.

## Model and interface

- Requested model: `jev-latest`.
- The exact returned model version is recorded per call and in the summary.
- API route: TypeSafe System One `/v1/systemone`.
- The runner preserves exact serialized requests, raw parsed responses, timestamps,
  latency, usage, condition identity, block, and within-block order.

## Sample sizes

- Technical pilot: 2 repeats per state-family cell, 30 calls including the rejected
  family. It is excluded from all confirmatory estimates.
- Confirmatory Phase A: 20 repeats per cell, 240 calls across the neutral and three
  accepted semantic families.
- No optional stopping. A failed request is recorded and not silently retried.
  The full planned run is completed unless authentication or API health makes the
  run invalid.

## Primary outcomes

All probabilities are remapped from API choice keys to `full`, `partial`, and
`none` before analysis.

1. Dominant semantic description.
2. `P(partial) + P(none)`.
3. Application branch: `human_review` when that sum is at least `0.50`, otherwise
   `automatic_full_capacity`.
4. Per-state probability and branch differences between each accepted family and
   the neutral family.

The threshold was chosen before the refined pilot and is not tuned to its results.
A complete threshold curve is secondary.

## Success criterion

Realistic fragility is supported only if at least two of the three accepted key
families:

1. show a replicated shift beyond the matched neutral order range established by
   the earlier control; and
2. change either the dominant semantic answer or the preregistered application
   branch in at least one state.

The rejected family cannot contribute to success. Clear states are guardrails:
large or directionally incorrect shifts there weaken the interpretation rather
than strengthen it.

## Exclusions and failures

- Exclude only calls with transport errors, non-2xx responses, malformed response
  structure, or missing probabilities.
- Do not exclude valid calls because their answer is surprising.
- Report every exclusion and error count by cell.
- If the returned model version changes within a run, report the split and do not
  pool versions in the primary analysis.

## Estimation and uncertainty

Report cell means, dominant-answer counts, policy-branch counts, and semantic-family
minus neutral differences within each state. The confirmatory analysis uses the
balanced block as the pairing unit and a block bootstrap with 10,000 resamples for
95% intervals. Report unadjusted family estimates plus Holm-adjusted tests across
the three accepted families. Probability outputs are scores supplied by Jev and
must not be described as calibrated confidence.

## Phase B gate

Phase B is not run from this preregistration. Before Phase B, freeze:

- the complete `2 x 2` factorial stimuli;
- at least three description-paraphrase families;
- both serialization orders;
- the exact log-odds estimator and continuity handling;
- the replication units and dominance interval;
- a distinct randomization seed and sample size.

The claim that keys dominate descriptions remains unsupported until that gated
experiment succeeds.
