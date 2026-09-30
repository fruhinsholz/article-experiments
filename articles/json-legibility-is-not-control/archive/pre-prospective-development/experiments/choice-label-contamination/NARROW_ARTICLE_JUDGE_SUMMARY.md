# Three-Judge Review: Narrow Jev Result as a Standalone Article

Date: 2026-09-27

Input: `NARROW_ARTICLE_JUDGE_PACKET.md`

Three judges reviewed the same packet independently from empirical-methods,
technical-editorial, and senior-practitioner perspectives. They were asked to judge
the narrow Jev result as a standalone practitioner article, not as proof of the
broader JSON-control thesis.

## Consensus verdict

All three judges returned:

> **Publishable standalone article with revisions.**

Mean overall scores:

| Axis | Mean |
|---|---:|
| Blog interest | 8.0/10 |
| Practical interest | 7.6/10 |
| Evidence strength for the exact claim | 7.6/10 |
| Standalone article fit | 7.8/10 |

## Dimension scores

| Dimension | Empirical methods | Technical editorial | Senior practitioner | Mean |
|---|---:|---:|---:|---:|
| Novelty | 8.0 | 8.0 | 7.0 | 7.7 |
| Narrative force | 8.0 | 8.0 | 8.0 | 8.0 |
| Technical credibility | 7.5 | 7.0 | 7.0 | 7.2 |
| Fit with narrow thesis | 9.0 | 9.0 | 9.0 | 9.0 |
| Practitioner learning value | 8.0 | 8.0 | 8.0 | 8.0 |
| Likelihood of changing practice | 8.0 | 8.0 | 8.0 | 8.0 |
| Realism of the risk | 7.0 | 7.0 | 7.0 | 7.0 |
| Usefulness of method | 8.0 | 8.0 | 8.0 | 8.0 |
| Value of mitigation | 8.5 | 8.0 | 8.0 | 8.2 |
| Urgency | 6.5 | 7.0 | 7.0 | 6.8 |
| Evidence sufficiency for exact claim | 8.0 | 8.0 | 7.0 | 7.7 |
| Reproducibility and auditability | 7.5 | 8.0 | 8.0 | 7.8 |
| Handling of negative results | 9.5 | 9.0 | 9.0 | 9.2 |
| Distinctiveness from generic prompt sensitivity | 7.5 | 8.0 | 8.0 | 7.8 |
| Standalone article fit | 8.0 | 8.0 | 7.0 | 7.7 |

## Strongest publication-safe claim

> In the tested Jev 1.13.0 choice interface, choice-key names were behaviorally
> active prompt content rather than inert schema identifiers. Plausible alternative
> names shifted reported score distributions and changed thresholded decisions near
> a semantic boundary while the state, question, descriptions, order, route, and
> model version remained fixed. Consequence-bearing schema-name changes should
> therefore be treated as prompt changes and regression-tested.

Use `can change`, not language implying that every rename changes behavior.

## Why the result is distinct

The contribution is not the generic observation that wording matters. It identifies
a specific engineering category error: a typed interface encourages developers to
treat choice identifiers as inert implementation metadata, while the model consumes
those identifiers as semantic evidence. The observed threshold crossing turns that
distinction into an operational issue.

## Main weakness

The realistic evidence is concentrated in one Jev version, one task family, and one
adaptively calibrated boundary state. The strongest realistic contrasts compare
descriptive names with shared neutral `A/B/C` keys, rather than comparing many
independently validated, semantically equivalent descriptive families. Repeated
calls also provide less independent evidence than the raw call count suggests.

## Effect of the failed preregistered criterion

All three judges said the failure improves the article narrative while weakening
the formal confirmatory result. It demonstrates disciplined inference: the broad
criterion failed, the conclusion was narrowed, and the remaining effect was reported
without relabeling the study a confirmatory success.

The failure must appear before the post-confirmatory ablations and remain central to
the story. It is evidence of the analysis discipline, not additional evidence for
the behavioral effect.

## Required revisions before publication

The judges converged on three priorities:

1. Publish the complete audit bundle: exact payloads, prompts, raw responses, model
   and API metadata, randomization, branch calculations, and analysis code.
2. Clarify the inferential unit, report effect sizes and uncertainty, and avoid
   treating repeated calls as automatically independent observations.
3. Add external-validity evidence if practical: another task or prespecified set of
   boundary states, plus independent validation of descriptive-family equivalence.

