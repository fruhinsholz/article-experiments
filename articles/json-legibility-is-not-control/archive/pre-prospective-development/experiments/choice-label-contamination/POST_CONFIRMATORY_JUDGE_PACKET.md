# Neutral Post-Confirmatory Review Packet: Jev Choice-Key Sensitivity

## Review purpose

Assess what the completed confirmatory experiment supports, especially the apparent
tension between:

1. a preregistered broad success criterion that was not met; and
2. consistent, statistically resolved, operational branch changes produced by all
   three documentation-compliant semantic key families.

Do not reward effort or the desired article thesis. Separate direct observations,
protocol-specific conclusions, broader engineering implications, and unsupported
generalizations.

## Context and narrow research question

Jev accepts a structured request containing state, questions, instructions, and
choice criteria represented as JSON key-description pairs. Its naming guidance was
understood by the experimenters to recommend short names that describe what follows.

The experiment therefore asks:

> When state, question, instruction, descriptions, description order, API route,
> and requested model remain fixed, can changing only reasonable, short,
> descriptive choice keys materially change Jev's output distribution or an
> application decision near a semantic boundary?

The experiment does not test whether Jev violates an identifier-neutrality
contract. The accepted semantic keys intentionally follow the product's descriptive
naming guidance. The issue is whether a developer may safely treat a rename among
such reasonable names as behavior-preserving.

## Hypotheses registered before the confirmatory run

Primary hypothesis:

> A reasonable LLM-facing choice-key rename is not necessarily a
> behavior-preserving refactor.

Secondary hypothesis:

> In a symmetric conflict, key wording may exert a larger average marginal effect
> than description wording.

Only Phase A, concerning the primary hypothesis, was run. The secondary hypothesis
remains untested and unsupported.

## Semantic preflight

Four candidate key families were screened before the Jev run against the same
full/partial/none work-completion boundaries. A family had to preserve the ordering,
avoid reversing a boundary, and remain a plausible set of short choice names.

- Accepted: `complete_work`, `partial_work`, `no_work`
- Accepted: `all_tasks`, `some_tasks`, `no_tasks`
- Accepted: `full_capacity`, `partial_capacity`, `no_capacity`
- Rejected: `fully_able`, `partly_able`, `unable`, because `unable` was broader than
  inability to complete essential duties

This was a blinded semantic screen by the protocol curator, not an independent
multi-rater validation. The rejected family was excluded from confirmatory evidence.

## Fixed task

Returned model version: `jev-1.13.0`.

Question:

> Which description best represents the person's current ability to complete
> essential work?

Instruction:

> Treat choice names as identifiers. Base the answer on the descriptions.

Descriptions, in fixed order:

1. `full`: The person can complete every essential job duty at normal quality and
   pace without assistance.
2. `partial`: The person can complete some essential job duties, but at least one
   essential duty cannot be completed at normal quality or pace.
3. `none`: The person cannot complete any essential job duty.

Boundary state:

> My computer is broken, but from my phone I can complete every essential job duty
> at normal quality. Most duties are at normal pace; I am unsure whether one duty may
> take slightly longer.

Clear controls stated unambiguous full and partial cases.

The application policy sent a case to `human_review` when
`P(partial) + P(none) >= 0.50`; otherwise it selected
`automatic_full_capacity`. The threshold was fixed before the refined pilot.

## Calibration and amendment

The originally registered boundary state saturated near the partial answer and could
not diagnose threshold crossing. Before any confirmatory call, a frozen neutral-key
calibration ladder selected the state whose review score was mechanically closest to
0.50. Five neutral-key calls gave a mean of 0.462 for the selected state.

The replacement was documented in a preregistration amendment before the
confirmatory run. Key families, descriptions, controls, threshold, sample size,
analysis, and success criterion remained unchanged. Calibration calls were excluded
from confirmatory evidence.

## Confirmatory design

- 3 states: boundary, clear full, clear partial
- 4 key families: neutral `A/B/C` plus the 3 accepted semantic families
- 20 balanced blocks, one call per state-family cell in each block
- 240 planned and completed calls
- 0 errors
- randomized cell order with a frozen seed
- probabilities remapped from returned keys to stable semantic descriptions
- paired block bootstrap with 10,000 resamples
- Holm adjustment across the three semantic families

Only the key names changed between a semantic family and the neutral reference.

## Results

### Boundary state

| Key family | Mean review score | Human review | Difference vs neutral | Paired bootstrap 95% CI | Holm p |
|---|---:|---:|---:|---:|---:|
| `A/B/C` | 48.75% | 9/20 | reference | reference | reference |
| `work_completion` | 42.35% | 1/20 | -6.40 pp | [-8.45, -4.30] pp | 0.000107 |
| `task_coverage` | 39.95% | 0/20 | -8.80 pp | [-10.40, -7.20] pp | 0.000006 |
| `capacity` | 44.55% | 2/20 | -4.20 pp | [-6.10, -2.40] pp | 0.000462 |

Thus every accepted semantic family shifted the score in the same direction and
changed the observed branch rate by 35 to 45 percentage points relative to neutral
keys.

### Clear controls

All families produced exactly the same result in the clear states:

- clear full: `P(full) = 1.00`, automatic branch in 20/20 calls per family;
- clear partial: `P(partial) = 1.00`, human-review branch in 20/20 calls per family.

The observed key sensitivity was therefore localized to the tested boundary state,
not a global destabilization of obvious cases.

## Preregistered decision

An earlier matched neutral permutation control established a 7.05 percentage-point
order range. The preregistered criterion defined the broader realistic-fragility
claim as supported only if at least two accepted semantic families both:

1. shifted beyond 7.05 points; and
2. changed the dominant answer or application branch in at least one state.

Only `task_coverage` exceeded 7.05 points. Two families were required. Therefore:

> The preregistered realistic-fragility claim was not supported.

This outcome must not be rewritten as a confirmatory success.

## Preliminary interpretation to review

The experimenters currently distinguish two claims.

### Claim A, considered supported in this protocol

> In Jev 1.13.0 on this tested boundary task, the choice of reasonable, short,
> descriptive keys was behaviorally material. With state, question, instruction,
> descriptions, and order fixed, changing only the keys shifted the reported
> probability distribution and changed how often the application crossed its fixed
> review threshold.

Rationale: all three accepted families produced non-zero paired shifts with intervals
excluding zero, and reduced observed human-review decisions from 9/20 to between
0/20 and 2/20.

### Claim B, considered unsupported

> Reasonable choice-key renames generally create large production fragility across
> Jev tasks, schemas, states, versions, or models.

The experiment used one task, one boundary, one Jev version, three related naming
families, and a deliberately threshold-sensitive application policy. It cannot
establish prevalence or universal magnitude.

## Relationship to the earlier adversarial result

An earlier matched permutation stress test used contradictory mappings between
meaningful keys and descriptions. It showed that keys could change the final
semantic answer in 20/20 repetitions relative to matched neutral keys. That result
established an existence claim, but it violated normal descriptive naming practice.

The present experiment is different. It does not show keys overriding descriptions.
It shows that multiple coherent, documentation-compliant ways to name the same
choices can shift behavior enough to alter a thresholded branch near a boundary.

## What the current evidence does not show

- that the effect occurs for every state, task, schema, Jev version, or model;
- that key names matter more than descriptions;
- that Jev probabilities are calibrated confidence;
- that the threshold was a deployed production policy;
- that the 20 calls are conventionally independent observations;
- that any specific internal mechanism caused the effect;
- that JSON is broadly incapable of control based on this experiment alone;
- that neutral keys are universally better or solve the problem;
- that Jev violated its documented contract.

## Questions for the judges

1. Is Claim A supported despite the failed preregistered broader success criterion,
   or does calling the effect "material" improperly bypass that criterion?
2. Is the branch-rate change from 9/20 under neutral keys to 0/20, 1/20, and 2/20
   under three accepted semantic families sufficient evidence of operational
   materiality within this protocol?
3. Does compliance with descriptive naming guidance make this a realistic schema
   engineering result, or are the families too semantically different to count as
   behavior-preserving renames?
4. What is the strongest exact public claim supported by the combined adversarial
   and confirmatory results?
5. What wording would overclaim the evidence?
6. Does this strengthen the broader article thesis, "JSON is legible to the model,
   but legibility is not control," as central evidence, supporting evidence, or not
   at all?
7. What single next experiment would most improve the conclusion?

## Required verdict

Provide:

- a direct answer to each of the seven questions;
- a strongest-supported-claim sentence suitable for publication;
- a sentence stating the preregistered failure without obscuring the observed effect;
- a confidence rating from 1 to 10 for the narrow protocol-specific conclusion;
- a blunt editorial verdict: `central evidence`, `supporting evidence`, or
  `insufficient evidence` for the broader JSON article.

