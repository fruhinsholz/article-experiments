# Risk sensitivity analysis for the Jev key-framing result

Date: 2026-09-28 (America/Los_Angeles)

Source run:
`results/2026-09-29T02-06-01-709Z-jev-jev-latest-key-framing-followup/`

This report addresses the three additional analyses requested by the independent
editorial review. It uses the existing 600-call run and introduces no new model
calls.

## Claim boundary

`impeded` and `limited capacity` are not strict synonyms. The result therefore
does not establish that interchangeable labels should produce invariant model
behavior. It establishes the narrower operational risk: coherent key families a
developer might use for the same typed application domain were not operationally
interchangeable, even though the state, question, choice descriptions, threshold,
temperature, model alias, and sampling plan were held fixed.

## Results by state

The review score is `P(partial) + P(none)`. Each row below contains 20 paired
balanced blocks.

| Boundary state | Capacity score | Impediment score | Difference | Capacity review | Impediment review |
|---|---:|---:|---:|---:|---:|
| Close to normal pace | 9.70% | 33.15% | +23.45 pp | 0/20 | 0/20 |
| Unsure, one slight delay | 43.90% | 50.15% | +6.25 pp | 0/20 | 9/20 |
| One duty slightly slower | 87.70% | 95.65% | +7.95 pp | 20/20 | 20/20 |
| Maybe one slight delay | 39.15% | 50.00% | +10.85 pp | 0/20 | 11/20 |

The score difference was positive in all four states. Branch changes occurred
only in the two states nearest the fixed `0.50` threshold, which is the expected
location for a threshold-mediated operational effect.

## Leave-one-state-out sensitivity

For `work_impediment - work_capacity_level`, omitting each state in turn leaves
three positive state-level differences and a positive aggregate interval.

| Omitted state | Difference across remaining states | Hierarchical bootstrap 95% interval |
|---|---:|---:|
| Close to normal pace | +8.35 pp | [+6.15, +10.83] pp |
| Unsure, one slight delay | +14.08 pp | [+8.08, +23.17] pp |
| One duty slightly slower | +13.52 pp | [+6.35, +23.13] pp |
| Maybe one slight delay | +12.55 pp | [+6.12, +23.12] pp |

The aggregate score effect is therefore not created by any single boundary
state. These intervals are sensitivity summaries over three retained states, not
new confirmatory tests.

## Paired branch transitions

Across the 80 paired boundary decisions:

- 20 changed from automatic processing under `work_capacity_level` to human
  review under `work_impediment`;
- 0 changed in the reverse direction;
- 40 remained automatic under both families;
- 20 remained human review under both families.

The aggregate branch rate was therefore 20/80 under capacity and 40/80 under
impediment. The 20 additional reviews were paired transitions, not a difference
between unrelated samples.

## Interpretation for publication

The strongest defensible statement is:

> In this Jev task, changing only the model-facing choice-key family from a
> capacity framing to an impediment framing increased the mean review score in
> all four boundary states and moved 20 of 80 paired sampled decisions from
> automatic processing to human review. The key families were plausible schema
> alternatives, not strict synonyms.

This is evidence of a model-facing schema risk and a thresholded routing
consequence. It is not evidence of production prevalence, a production incident,
or semantic equivalence between the two key families.

## Remaining work

No additional Jev run is required to satisfy the reviewers' stated requests.
The article still needs to:

1. use the exact sampled-decision language;
2. show the state-level and paired-transition results;
3. present the threshold as experimental and preregistered;
4. acknowledge the semantic difference directly;
5. separate the observed result from the production analogy and engineering
   guidance.

An independently rated, more tightly matched naming study could strengthen a
future claim about semantic closeness, but it is not required for the current
narrow claim.
