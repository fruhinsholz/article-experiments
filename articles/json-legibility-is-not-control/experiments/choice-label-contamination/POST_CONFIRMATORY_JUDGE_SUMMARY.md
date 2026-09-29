# Three-Judge Post-Confirmatory Review Summary

Date: 2026-09-27

Input: `POST_CONFIRMATORY_JUDGE_PACKET.md`

Three judges reviewed the completed experiment independently from empirical-methods,
technical-editorial, and senior-practitioner perspectives.

## Consensus verdict

All three judges reached the same verdict:

- confidence in the narrow protocol-specific conclusion: `8/10`;
- role in the broader JSON article: **supporting evidence**;
- the observed effect may be called operationally material only when explicitly
  scoped to the calibrated boundary state and preregistered experimental threshold;
- the preregistered realistic-fragility criterion was **not met** and the experiment
  must not be reported as a confirmatory success.

## What is supported

The judges accepted this narrow conclusion:

> In Jev 1.13.0, on one calibrated boundary task, replacing opaque `A/B/C` choice
> keys with three plausible descriptive key sets while holding the state, question,
> instruction, descriptions, and order fixed shifted the reported score distribution
> and changed decisions under a preregistered threshold. In this protocol, choice
> keys were behaviorally active rather than semantically inert.

The evidence for operational materiality inside the protocol is direct:

- neutral `A/B/C`: human review in `9/20` calls;
- `work_completion`: `1/20`;
- `task_coverage`: `0/20`;
- `capacity`: `2/20`.

The three descriptive families shifted the continuous review score by `-4.2` to
`-8.8` percentage points relative to neutral keys. Their paired bootstrap intervals
excluded zero. Clear controls were unchanged.

Combined with the earlier adversarial permutation, the evidence supports treating
LLM-facing choice keys as behavioral prompt content rather than inert schema
plumbing.

## Required failure disclosure

The judges endorsed this disclosure:

> The preregistered realistic-fragility criterion was not met because only one of
> the three accepted families exceeded the 7.05-point control range, even though all
> three produced directionally consistent score shifts and altered the observed
> thresholded branch rate.

## Important correction to the preliminary interpretation

The descriptive families followed Jev's naming guidance and are realistic schema
names. That strengthens the engineering relevance of the test.

However, the large 35-to-45-point branch-rate contrasts are comparisons between
descriptive families and opaque `A/B/C`, not between pairs of descriptive families.
The experiment therefore establishes most strongly that a change from opaque to
descriptive keys is not behavior-preserving. It does not yet establish an equally
large effect from renaming one documentation-compliant descriptive family to another.

The claim should use "alternative plausible schema names for the same declared
choices," not "semantically identical renames." The families frame the dimension
somewhat differently: action, task coverage, and capacity. Their equivalence was
also screened by one protocol curator rather than independent raters.

## Why the result is still useful

The result supplies a concrete engineering warning:

- JSON shape constrains possible outputs but does not neutralize the semantics of
  the identifiers inside that shape;
- an instruction to treat names as identifiers did not make their wording inert;
- schema-name changes should be treated as prompt changes and regression-tested;
- ambiguous and threshold-adjacent cases are where such tests are most diagnostic.

This is supporting evidence for "JSON is legible to the model, but legibility is not
control." It is not sufficient as central proof of the full thesis because it uses
one Jev version, one task, one adaptively calibrated boundary, one shared neutral
control, and an experimental rather than deployed decision policy.

## Wording to avoid

- "The confirmatory experiment succeeded."
- "Documentation-compliant renames generally change Jev decisions."
- "Equivalent descriptive renames caused 35-to-45-point branch changes."
- "Three independent replications confirmed the effect."
- "Keys override descriptions in normal use."
- "Keys matter more than descriptions."
- "Jev ignored its descriptions or violated its contract."
- "Jev probabilities are calibrated confidence."
- "This proves that JSON cannot provide control."
- Any cross-task, cross-version, cross-model, or production-prevalence claim.

## Highest-value next experiment

Run a preregistered multi-task, multi-boundary study whose primary contrasts are
directly between several documentation-compliant descriptive key families validated
as semantically equivalent by independent raters. Keep `A/B/C` as a secondary
control, use externally fixed policies or full threshold curves, randomize across
multiple sessions, and replicate on another Jev version or direct-model interface.

This directly tests the remaining weak link: whether ordinary compliant-to-compliant
renames are behavior-preserving.

