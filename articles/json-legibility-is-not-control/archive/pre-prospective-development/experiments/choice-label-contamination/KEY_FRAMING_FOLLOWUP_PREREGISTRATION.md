# Preregistration: impediment and prevention key framing follow-up

Date frozen: 2026-09-28

## Question

When the state, operational question, descriptions, and application threshold are
fixed, do two additional natural choice-key framings produce the same Jev review
score distribution as the previously observed `duty_coverage` and
`work_capacity_level` families?

The two new families are:

- `work_impediment`: `essential_work_unimpeded`, `essential_work_impeded`,
  `essential_work_halted`;
- `duty_prevention`: `no_essential_duty_prevented`,
  `some_essential_duties_prevented`, `all_essential_duties_prevented`.

The second family preserves the same full/partial/none semantics while reversing
the surface polarity: the full-work key contains `no ... prevented`, while the
no-work key contains `all ... prevented`.

## Frozen design

- Provider: Jev
- Requested model alias: `jev-latest`; record and report the returned version
- Question: `To what extent can the person currently perform their essential work?`
- No instruction about how to interpret choice names
- States: the same four boundary states and two clear-state guardrails used in the
  blind natural-key replication
- Families: neutral `A/B/C`, `duty_coverage`, `work_capacity_level`,
  `work_impediment`, and `duty_prevention`
- Repeats: 20 complete balanced blocks
- Total planned calls: 6 states x 5 families x 20 blocks = 600
- Randomization seed: `28092001`
- Concurrency: 5
- Retries: up to 3 for HTTP 429, 503, or 529 only
- Temperature: 0
- Application rule: human review when `P(partial) + P(none) >= 0.5`

The frozen stimulus manifest is
`refined-stimuli.v6-key-framing-followup.json`.

## Analysis

The primary outcome is the review score `P(partial) + P(none)` on the four
boundary states. Calls are paired by state and balanced block.

Report these five contrasts:

1. `work_impediment - duty_coverage`
2. `work_impediment - work_capacity_level`
3. `duty_prevention - duty_coverage`
4. `duty_prevention - work_capacity_level`
5. `work_impediment - duty_prevention`

For each contrast, report:

- mean paired review-score difference by boundary state;
- aggregate mean across states;
- hierarchical bootstrap 95% interval, resampling states and then paired blocks;
- direction across the four states;
- semantic-selection changes;
- human-review threshold changes.

Also report family-level mean review scores, clear-state guardrails, returned model
versions, errors, and retries. Neutral `A/B/C` is a secondary reference.

This is a preregistered descriptive follow-up, not a new confirmatory test of the
original article claim. No minimum-effect or equivalence margin is specified.
Consequently, failure to distinguish two families is not evidence that they are
formally equivalent.

## Interpretation limits

- The family names are coherent alternative framings, not strict synonyms.
- `impeded`, `halted`, and `prevented` introduce negative framing.
- The `duty_prevention` family changes both vocabulary and logical polarity.
- Results apply to this task, Jev version, question, descriptions, and state set.
