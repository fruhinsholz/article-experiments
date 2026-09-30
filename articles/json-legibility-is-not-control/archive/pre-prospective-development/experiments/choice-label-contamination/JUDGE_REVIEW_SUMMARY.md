# Three-Judge Review Summary

Date: 2026-09-27

Input packet: `JUDGE_PACKET.md`

The three judges received the same factual packet and scoring rubric. They did not receive prior scores, a target verdict, or one another's reviews.

## Scores

| Dimension | Empirical methods | Technical editorial | Senior practitioner | Mean |
|---|---:|---:|---:|---:|
| Novelty | 7 | 7 | 6 | 6.7 |
| Technical precision | 8 | 8 | 8 | 8.0 |
| Evidence strength | 7 | 7 | 7 | 7.0 |
| Practitioner value | 7 | 8 | 7 | 7.3 |
| Narrative force | 8 | 9 | 8 | 8.3 |
| Risk-of-overclaim containment | 8 | 8 | 9 | 8.3 |
| Article fit | 6 | 7 | 6 | 6.3 |
| **Overall** | **7.3** | **7.7** | **7.2** | **7.4** |

## Verdicts

- Empirical-methods judge: **supporting evidence only**, or a compact experimental note.
- Technical-editorial judge: **standalone article**, if it remains a narrow experimental report.
- Senior-practitioner judge: **supporting evidence only**, or a compact experimental note.

Consensus interpretation:

> The result is publication-worthy and technically credible for its narrow claim. It is already strong enough to share as a focused experimental note or as a central experiment in the broader JSON-control article. It is not yet broad enough to sustain a substantial standalone practitioner essay without replication or a realistic consequence-bearing example.

## Strongest supported claim

All three judges accepted essentially the same existence claim:

> In this Jev task and version, supposedly arbitrary choice identifiers remained behaviorally active. Replacing neutral identifiers with meaningful identifiers changed the reported probability distribution and, in one matched permutation, changed the selected semantic answer on all 20 repetitions, despite unchanged state, question, descriptions, and an explicit instruction to ignore identifier names.

This is stronger than a generic prompt-sensitivity anecdote because the experiment uses all six description permutations and a matched neutral-key control.

## What the judges did not accept as demonstrated

- A universal claim about JSON, schemas, enum names, or LLMs.
- A mechanistic claim about internal reasoning, attention heads, parsing, or cognition.
- A claim that the state text itself was contaminated or altered.
- A claim that Jev violated an API contract unless its documentation guarantees identifier neutrality.
- An interpretation of Jev probabilities as calibrated confidence.
- Conventional statistical independence for the 20 repeated calls.
- A claim that neutral identifiers fully solve the control-boundary problem.

The safest interpretation is behavioral:

> The output decision depended on the choice identifiers in addition to the state, question, and descriptions.

Saying that the keys changed the model's “interpretation of the state relative to the question” is acceptable only if `interpretation` is explicitly defined as observed decision behavior, not an assertion about internal cognition.

## Why the result matters

The judges agreed that experienced practitioners probably know that words in prompts can matter. The non-obvious contribution is narrower and more operational:

- complete descriptions did not make the identifiers inert;
- an explicit instruction to ignore the identifiers did not make them inert;
- the effect was not limited to small probability movement;
- the matched condition changed the final semantic answer consistently;
- schema validation can constrain output shape without neutralizing the semantics of schema identifiers.

This supports a practical warning for LLM-facing schemas:

> Test identifier neutrality rather than assuming it. Field names, enum values, and choice keys are still prompt tokens and may participate in consequence-bearing decisions.

## Highest-value next steps

The judges converged on three priorities:

1. **Replicate in a realistic workflow.** Use case routing, eligibility, moderation, or approval with a consequence-bearing decision and a predeclared expected answer.
2. **Replicate across vocabularies and implementations.** Use additional balanced semantic label sets, another Jev version, and at least one transparent direct-model API.
3. **Strengthen execution and API documentation.** Randomly interleave matched conditions, document serialization, decoding, wrapper behavior, and probability semantics, and report uncertainty without assuming conventional independence.

## Publication recommendation

Current best use:

1. Make this the central concrete experiment in the broader article `JSON Is Legible, Not Control`; or
2. Publish it first as a short experimental note, explicitly scoped to Jev and this task.

Do not yet build a broad standalone essay whose main conclusion is that JSON generally fails as a control boundary. One realistic replication and one cross-implementation replication would materially improve standalone article fit.

## Recommended public wording

> In this controlled Jev task, choice identifiers declared arbitrary remained behaviorally active. Replacing neutral identifiers with meaningful identifiers changed the reported distribution and, in one matched permutation, changed the selected semantic answer on all 20 repetitions. The result does not show that every identifier affects every task. It shows that schema identifiers cannot be assumed to become semantically inert merely because the interface calls them arbitrary or the prompt says to ignore them.

## Wording to avoid

- “JSON contaminated the state.”
- “We proved JSON is not a control boundary.”
- “Jev ignored the descriptions.”
- “The model reasoned from the key names.”
- “Meaningful keys always affect decisions.”
- “The probabilities are calibrated confidence.”
- “Neutral keys solve the problem.”
- Any explanation involving a specific internal mechanism not measured by the experiment.
