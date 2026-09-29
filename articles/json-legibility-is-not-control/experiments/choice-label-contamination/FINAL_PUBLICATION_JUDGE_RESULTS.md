# Three-Judge Final Publication Review

Date: 2026-09-27

Input: `FINAL_PUBLICATION_JUDGE_PACKET.md`

Three independent AI judge sessions reviewed the same packet without access to
earlier reviews or one another's answers. Their assigned perspectives were
empirical methods, technical editorial, and senior software practice. They are not
human raters and do not establish agreement across different model families.

## Consensus verdict

All three judges returned:

> **Publishable standalone article with revisions.**

| Overall axis | Empirical methods | Technical editorial | Senior practitioner | Mean |
|---|---:|---:|---:|---:|
| Blog interest | 8.4 | 8.4 | 8.4 | **8.4** |
| Practical interest | 7.6 | 8.0 | 8.0 | **7.9** |
| Evidence strength | 8.0 | 8.3 | 8.0 | **8.1** |
| Standalone fit | 8.0 | 8.0 | 8.0 | **8.0** |

## Scores by dimension

| Dimension | Empirical methods | Technical editorial | Senior practitioner | Mean |
|---|---:|---:|---:|---:|
| Novelty | 8 | 8 | 8 | **8.0** |
| Narrative force | 8 | 8 | 8 | **8.0** |
| Technical credibility | 8 | 8 | 8 | **8.0** |
| Fit with the narrow thesis | 9 | 9 | 9 | **9.0** |
| Experienced-practitioner learning value | 9 | 9 | 9 | **9.0** |
| Likelihood of changing engineering practice | 8 | 8 | 8 | **8.0** |
| Realism of the risk | 7 | 8 | 8 | **7.7** |
| Usefulness of the decision rule and method | 8 | 9 | 9 | **8.7** |
| Value of the mitigation | 8 | 8 | 8 | **8.0** |
| Urgency | 7 | 7 | 7 | **7.0** |
| Sufficiency for the exact claim | 8 | 8 | 8 | **8.0** |
| Reproducibility and auditability | 8 | 9 | 8 | **8.3** |
| Handling of negative results and limitations | 10 | 10 | 10 | **10.0** |
| Distinctiveness from generic prompt-wording advice | 9 | 9 | 9 | **9.0** |
| Standalone article fit | 8 | 8 | 8 | **8.0** |

## Answers to the review questions

### 1. Does the replication address the earlier `A/B/C` weakness?

**Yes, substantially.** The primary comparisons are now preregistered direct
contrasts among plausible descriptive families frozen before behavioral testing.
`A/B/C` no longer carries the main conclusion.

The remaining caveat is semantic: the families are realistic alternative schema
framings, not interchangeable synonyms. The work-capacity family also had weaker
independent support than the other two.

### 2. Is the proposed engineering conclusion supported?

**Yes, with one precision edit recommended by two judges.** The experiment changed
the observed frequency of a thresholded application action across repeated calls;
it did not establish a deterministic decision reversal on every execution.

Recommended publication wording:

> In this Jev 1.13.0 choice interface, natural choice-key names selected before
> behavioral testing changed score distributions and, for a boundary case, changed
> the observed rate of thresholded application actions while the question, state,
> full descriptions, ordering, route, and model version remained fixed. LLM-facing
> schema names should therefore be treated as prompt content and regression-tested
> when downstream decisions depend on the output.

### 3. Strongest publication-safe claim

> In one preregistered Jev 1.13.0 task, plausible descriptive naming schemes for the
> same declared choices were not behaviorally interchangeable. The work-capacity
> framing shifted the review score by roughly 16 to 17 percentage points relative
> to two other natural families, consistently across four selected states, and
> changed the frequency with which a fixed threshold triggered human review in one
> boundary state.

This is an existence claim. It does not estimate prevalence across tasks, systems,
versions, or identifier changes.

### 4. Most interesting non-obvious contribution

The contribution is not the generic observation that wording matters. It identifies
a specific engineering category error:

> Developer-facing identifiers inside a typed interface remain model-facing
> semantic evidence, even when complete descriptions appear to carry the intended
> meaning.

The prospective selection of natural names, direct paired comparisons, fixed
descriptions, preregistered criterion, and threshold consequence make the result
operational rather than anecdotal.

### 5. Largest remaining weakness

External validity and semantic non-equivalence. The experiment covers one Jev
version and one task family, and the two successful contrasts are both driven by
one lexical framing, `work_capacity_level`. The result cannot distinguish a broad
identifier-sensitivity phenomenon from a task-specific response to work-capacity
language, nor show how often ordinary renames cause material effects.

### 6. Does the calibration fallback materially weaken the result?

**It weakens scope more than internal validity.** The fallback was preregistered,
neutral-only, and executed before descriptive-family testing, so it was not
outcome-driven. The successful contrasts also had the same direction in all four
states.

However, only two states were inside the intended boundary interval. The article
must distinguish those from the two fallback states and should include a sensitivity
analysis restricted to the in-window states plus a leave-one-state-out analysis.

### 7. Does the earlier failed criterion help the narrative?

**Yes, if concise.** The agreed narrative is:

1. an adversarial test established possibility;
2. the first realistic confirmation missed its broad criterion;
3. that failure exposed the weakness of relying on `A/B/C` contrasts;
4. the blind, preregistered replication directly repaired that weakness.

This improves credibility through transparent refinement. Detailed ablation history
belongs in an appendix or short methods sidebar.

### 8. Three changes most needed before publication

1. **State the operational result exactly.** Report the branch counts, especially
   `0/20` versus `2/20`, and describe a changed threshold-crossing rate rather than
   a deterministic branch reversal.
2. **Make semantic non-equivalence prominent.** Say that the test compares realistic
   alternative schema framings, not cosmetic or perfectly synonymous renames, and
   that the work-capacity family drives the successful contrasts.
3. **Strengthen the audit and engineering guidance.** Show state-level effects,
   distinguish the two in-window states, add in-window and leave-one-state-out
   sensitivity analyses, and turn the mitigation into a short checklist: version
   identifiers, regression-test renames near operational thresholds, compare score
   distributions as well as selected labels, and review consequential schema
   changes as prompt changes.

## Final editorial interpretation

The replication clears the main empirical obstacle left by the first confirmatory
run. It is sufficiently novel and actionable for a standalone practitioner article,
provided the article remains an existence result, not a prevalence claim.

It supports the broader thesis that typed JSON structure does not make identifiers
inert. It does not, alone, prove that JSON is generally an unreliable control
boundary.

