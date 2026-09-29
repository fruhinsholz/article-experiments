# Final Independent Review Packet: Jev Choice-Key Sensitivity

Date: 2026-09-27

## Review purpose

Decide whether this completed evidence is worth a standalone technical-practitioner
blog article. Evaluate the exact narrow claim, not the broader proposition that JSON
is never a control boundary.

Do not reward effort, call volume, or the desired editorial outcome. Distinguish
what the experiment directly demonstrates from what remains uncertain.

## What we wanted to test

Jev accepts a structured choice object in which each JSON key names a choice and
each value describes that choice in full. A developer may reasonably treat a change
to those keys as a schema refactor, especially when the descriptions, question,
state, ordering, API route, and model version do not change.

The narrow question was:

> Can plausible choice-key names, independently proposed as natural API names,
> materially change Jev's probability distribution or a thresholded application
> decision while the declared choice descriptions and all other tested inputs remain
> fixed?

The intended engineering conclusion, if supported, was not that every rename
matters. It was that LLM-facing schema identifiers are semantic prompt content and
cannot safely be presumed behaviorally inert.

## Evidence sequence

### 1. Adversarial existence test

An initial permutation experiment held the state, question, instruction, three
descriptions, description order, key vocabulary, and key order fixed while testing
all six mappings between semantic keys and descriptions, with a matched `A/B/C`
control.

- 240 successful calls, 0 errors.
- Neutral `A/B/C` conditions produced a 7.05-point range in `P(partial)` and no
  selected-description change.
- Semantic-key conditions produced a 61.35-point range.
- In the decisive contradictory mapping, semantic keys selected the description
  corresponding to `full` in 20/20 calls; matched neutral keys selected `partial`
  in 20/20 calls.

This established an existence result, but the contradictory mappings were an
intentional stress test rather than normal schema usage.

### 2. First realistic confirmatory test

Three coherent descriptive key families were compared with `A/B/C` on one
calibrated boundary state and two clear controls. A fixed experimental policy sent
a case to human review when `P(partial) + P(none) >= 0.50`.

- 240 successful calls, 0 errors, returned model `jev-1.13.0`.
- `A/B/C`: human review in 9/20 boundary calls.
- `work_completion`: 1/20, score shift -6.40 percentage points versus neutral.
- `task_coverage`: 0/20, score shift -8.80 points.
- `capacity`: 2/20, score shift -4.20 points.
- All paired bootstrap intervals excluded zero; clear controls were unchanged.

The preregistered broad criterion required at least two families to exceed the
7.05-point neutral-order range and change a branch. Only one exceeded that range,
so the criterion was not met. This was reported as a failed confirmatory criterion,
not converted into a success.

Two post-confirmatory wording ablations preserved a similar aggregate gap but
changed family-level distributions. They supported robustness of the narrow
observation but did not repair the failed criterion.

Three earlier independent AI judges considered this evidence publishable with
revisions, but identified the central weakness: the strongest realistic contrasts
were descriptive keys versus `A/B/C`, not direct contrasts between independently
validated plausible descriptive families across multiple boundary states.

### 3. Blind generation of natural descriptive families

Before the new behavioral run, three independent AI judge sessions received only
the fixed question and descriptions. They were not shown prior identifiers,
experimental results, preferred vocabulary, or one another's answers. They were
asked for names they would naturally recommend to a developer.

The following families were frozen before behavioral testing:

1. Duty coverage, exact agreement from 3/3 judges:
   - `all_essential_duties`
   - `some_essential_duties`
   - `no_essential_duties`
2. Capability statement, exact agreement from 2/3 judges:
   - `can_perform_all_essential_duties`
   - `can_perform_some_essential_duties`
   - `cannot_perform_any_essential_duties`
3. Work-capacity level, proposed as usable by the senior-practitioner judge:
   - `full_essential_work_capacity`
   - `limited_essential_work_capacity`
   - `no_essential_work_capacity`

`A/B/C` was retained only as a secondary reference. These are three independent AI
judge sessions with assigned perspectives, not human raters and not three model
families.

### 4. Preregistered blind natural-key replication

#### Calibration

A neutral-only calibration used 12 ordered states, 10 balanced blocks, and 120
successful calls. The four states closest to a review score of 0.50 were selected
according to the preregistered rule. Only two fell inside the target interval
`[0.35, 0.65]`; the other two were selected by the preregistered nearest-state
fallback. No descriptive family was tested during calibration.

#### Fixed design

- Returned model: `jev-1.13.0`.
- Four selected boundary states plus two clear guardrail states.
- Three primary descriptive families plus secondary `A/B/C`.
- 20 complete balanced blocks.
- 480 planned and completed calls, 0 errors.
- Frozen randomization seed.
- Fixed state, operational question, descriptions, description order,
  serialization, model request, API route, and threshold.
- No instruction told the model how to treat choice names.
- Primary unit: paired balanced block within state.
- Aggregate interval: hierarchical bootstrap over states and paired blocks, 10,000
  resamples.

The operational question was:

> To what extent can the person currently perform their essential work?

The preregistered criterion for a pairwise descriptive-family contrast required:

1. the same non-zero direction in at least three of four boundary states;
2. an aggregate paired-block 95% bootstrap interval excluding zero; and
3. an application-branch change in at least one boundary state.

#### Primary results

Difference is the first family's review score minus the second family's score.

| Contrast | Aggregate difference | 95% CI | Direction across states | Branch changed | Criterion met |
|---|---:|---:|---:|---|---|
| Duty coverage minus capability statement | -1.34 pp | [-3.38, 0.34] | 2 positive / 2 negative | No | No |
| Duty coverage minus work-capacity level | -17.24 pp | [-24.55, -7.53] | 0 positive / 4 negative | Yes | Yes |
| Capability statement minus work-capacity level | -15.90 pp | [-23.20, -7.23] | 0 positive / 4 negative | Yes | Yes |

The two successful contrasts had the same direction in all four selected states.
Their state-level differences were:

- Duty coverage minus work-capacity level: -19.35, -19.65, -3.35, and -26.60 pp.
- Capability statement minus work-capacity level: -19.50, -15.40, -3.40, and
  -25.30 pp.

At the most threshold-adjacent state, duty coverage and capability statement each
produced human review in 0/20 calls, while work-capacity level produced human review
in 2/20 calls and `A/B/C` in 10/20 calls. The preregistered criterion only required
a branch change, not a specified branch-rate magnitude.

Both clear-state guardrails were perfectly stable across all four families.

## What we think we found

### Directly supported

In this Jev 1.13.0 task, plausible descriptive key families selected before
behavioral testing were not behaviorally interchangeable. Two of the three direct
descriptive-family contrasts met the preregistered criterion. The large effect was
specifically associated with the work-capacity framing; duty coverage and capability
statement were not distinguishable in aggregate under the registered analysis.

The effect was concentrated near semantic boundaries and did not destabilize clear
cases. This is operationally relevant because a fixed downstream threshold can turn
a distributional shift into a different application action.

### Engineering conclusion proposed for publication

> In a tested Jev 1.13.0 choice interface, natural choice-key names proposed before
> behavioral testing changed score distributions and, near a boundary, changed a
> thresholded application decision even though the question, state, full
> descriptions, ordering, route, and model version were fixed. LLM-facing schema
> names should therefore be treated as prompt content and regression-tested when
> downstream decisions depend on the output.

Use `can change`, not wording implying that every rename changes behavior.

### Relationship to the broader JSON article

This is concrete evidence for the narrower idea that typed JSON structure does not
make identifiers inert. It supports, but does not by itself prove, the broader
thesis: `JSON is legible to the model, but legibility is not control.`

## Limitations

- one Jev version;
- one work-capacity task family;
- four selected states, only two of which fell inside the intended calibration
  interval;
- one thresholded experimental policy, not a deployed production rule;
- three AI judge sessions generated the families, not human developers or multiple
  model families;
- one family had weaker independent support than the other two;
- the families are plausible alternatives for the same declared choices, but their
  lexical framing is not semantically identical;
- repeated calls are organized into paired blocks and are not treated as 480 fully
  independent observations;
- the experiment identifies behavioral sensitivity, not an internal mechanism;
- it does not establish prevalence across tasks, versions, providers, or models;
- it does not show that Jev violated a documented contract;
- it does not show that neutral keys are safer or better.

## Required scoring rubric

Score every dimension from 1 to 10, calibrated against strong public technical
practitioner articles.

### Blog interest

1. Novelty
2. Narrative force
3. Technical credibility
4. Fit with the narrow thesis that typed structure does not make identifiers inert
5. Likelihood of teaching experienced practitioners something non-obvious

### Practical interest

6. Likelihood of changing engineering practice
7. Realism of the risk
8. Usefulness of the decision rule and experimental method
9. Value of the mitigation
10. Urgency for teams using LLM-facing schemas or typed classification interfaces

### Editorial viability

11. Sufficiency of the evidence for the exact candidate claim
12. Reproducibility and auditability
13. Honest handling of negative results and limitations
14. Distinctiveness from generic advice that prompt wording matters
15. Standalone article fit

## Questions for the judge

1. Does the blind natural-key replication adequately address the earlier weakness
   that the strongest contrasts were descriptive names versus `A/B/C`?
2. Is the proposed engineering conclusion supported exactly as written?
3. What is the strongest publication-safe claim?
4. What is the most interesting non-obvious contribution?
5. What is the largest remaining weakness?
6. Does the calibration fallback materially weaken the result?
7. Does the earlier failed criterion improve the narrative through transparency,
   or now distract from the successful replication?
8. What three changes are most needed before publication?

## Required verdict

Provide:

1. a score for all 15 dimensions;
2. overall blog-interest, practical-interest, evidence-strength, and standalone-fit
   scores out of 10;
3. direct answers to all eight questions;
4. a blunt verdict: `strong standalone article`, `publishable standalone article
   with revisions`, `supporting section only`, or `not publication-worthy`.

