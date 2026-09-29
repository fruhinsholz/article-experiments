# Three-Judge Review of the Refined Test

Date: 2026-09-27

Input: `REFINED_TEST_PACKET.md`

The judges reviewed the same evidence and design independently from three
perspectives: empirical methods, technical editing, and production engineering.

## Scores

| Judge | Blog interest | Practical interest | Verdict | Placement |
|---|---:|---:|---|---|
| Empirical methods | 8.0/10 | 7.6/10 | revise then run | broader JSON article |
| Technical editorial | 7.6/10 | 7.4/10 | revise then run | broader JSON article |
| Senior practitioner | 8.0/10 | 7.0/10 | revise then run | broader JSON article |
| **Mean** | **7.9/10** | **7.3/10** | **unanimous** | **unanimous** |

## Consensus

The package contains a strong and publishable central experiment for the broader
JSON article, but the refined test should be revised before execution.

The most valuable article claim is not the abstract statement that keys generally
matter more than descriptions. It is the operational claim that a reasonable rename
of a model-visible enum may not preserve behavior and therefore belongs in schema
versioning and regression testing.

## Strongest already-supported claim

> In Jev 1.13.0 on the tested task, meaningful choice keys materially changed the
> reported distribution and, in one deliberately contradictory mapping, reversed
> the selected canonical description relative to a matched neutral-key control.

The result is an existence and stress-test claim. It is not yet evidence that normal,
coherent naming changes commonly alter production decisions.

## Most valuable claim the refinement could establish

> Multiple independently validated, documentation-compliant names for the same enum
> can change an application branch while state, question, and descriptions remain
> fixed. A model-visible enum rename is therefore not presumptively a
> behavior-preserving refactor.

## Commonly identified design flaw

All three judges found the original dominance comparison causally asymmetric:

- the key intervention changed semantic polarity;
- the description-strength intervention changed verbosity and specificity;
- the proposed key families did not clearly preserve the same semantic dimension;
- convenient probability thresholds were not tied to an application policy.

That design could show that keys participate in the decision, but not cleanly that
they exert more influence than descriptions.

## Revisions adopted in the packet

1. Phase A now uses candidate families on one work-completion dimension and requires
   blinded validation of semantic equivalence before the Jev run.
2. Phase B is now a symmetric `2 x 2` factorial that independently swaps key and
   description semantics between the same two slots and estimates both marginal
   effects on one log-odds scale.
3. Description strength is now a robustness analysis, not the basis of the dominance
   claim.
4. Conditions are randomized in balanced blocks, physical order is reversed, and
   states, vocabularies, paraphrase families, and separate runs are treated as units
   of replication.
5. The primary operational outcome uses a preregistered production-like branch rule;
   a threshold-sensitivity curve replaces hand-picked generic thresholds.
6. The design tests both with and without the artificial instruction to ignore key
   names.

## Editorial recommendation

Use the sequence as a central case study in the broader article:

1. Jev shows useful question-level stability on the tested probe.
2. The existing extreme counterexample shows that choice keys can still supplant
   descriptions.
3. The realistic rename test asks whether the same risk survives good schema design.
4. The mitigation is to treat model-visible schema names as versioned prompt content
   and regression-test renames.

Do not yet publish:

> Choice keys matter more than descriptions.

The currently supportable wording is:

> Choice keys can override declared descriptions in some tested conflicts.

If the revised factorial succeeds across validated vocabularies and tasks, the
stronger wording can remain explicitly scoped to those tested contrasts.
