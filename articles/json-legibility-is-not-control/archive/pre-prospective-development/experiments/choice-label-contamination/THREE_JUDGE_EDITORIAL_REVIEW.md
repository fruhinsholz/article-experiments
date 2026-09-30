# Three-Judge Editorial Review

Date: 2026-09-28

Article: `JSON Is Legible. That Does Not Make It a Control Boundary`

Review basis:

- the current article draft;
- the revised review packet;
- the preregistered 600-call Jev 1.13.0 follow-up;
- the `20/80` versus `40/80` human-review result.

The three reviewers evaluated the material independently from empirical-methods,
technical-editorial, and senior-practitioner perspectives. They did not edit the
article or see one another's reviews before submitting their recommendations.

## Unanimous verdict

All three reviewers judged the article **publishable with revisions**.

All three said the new result makes the article materially more interesting. The
earlier evidence established a repeatable distributional effect, but the new
result gives it a concrete application consequence: with the state, question,
descriptions, threshold, model version, and sampling plan fixed, a plausible
change to the model-facing identifiers changed the sampled human-review rate from
25% to 50%.

Their shared distinction was:

> The new result does not double the scientific generality of the evidence. It
> sharply increases the narrative and operational force of the example.

## Consensus editorial direction

The article should no longer open as an abstract essay about JSON. It should open
with the schema rename and its downstream routing effect.

Recommended title:

> **The Schema Rename That Doubled Human Review**

Recommended subtitle:

> Structured output constrained the available choices. It did not make their
> names semantically inert.

Recommended central claim:

> A model-facing schema rename is a prompt change, and it can become a policy
> change when application routing depends on the model's distribution.

The broader statement, `JSON is legible, but legibility is not control`, should
remain the architectural conclusion rather than the opening promise.

## Recommended opening

> A developer renamed three members of a typed choice. The question did not
> change. The descriptions did not change. The model version, application
> threshold, and sampled states did not change.
>
> The application behavior did.
>
> With one plausible naming scheme, 20 of 80 sampled boundary decisions triggered
> human review. With another, 40 did. To the type system, the edit looked like a
> schema refactor. To the model, it was also new language. To the application, it
> became a routing-policy change.

## Recommended article structure

1. **The rename**
   - Show a minimal diff between the capacity and impediment keys.
   - State everything held constant.
2. **The operational rule**
   - Define `P(partial) + P(none)` and the fixed `0.50` review threshold.
   - Identify the threshold as experimental and preregistered.
3. **The result**
   - Lead with `20/80` versus `40/80`, or 25% versus 50%.
   - Follow with the `+12.13` percentage-point score shift, its interval
     `[6.88, 19.78]`, and the same direction in four of four states.
   - State that these are 80 sampled decisions from four states repeated across
     twenty balanced blocks, not 80 distinct cases.
4. **Why this is more than "wording matters"**
   - Compare capacity, prevention, and impediment.
   - Explain that negative vocabulary alone does not account for the result.
   - Treat the linguistic explanation as interpretation, not mechanism.
5. **What structured output guarantees, and what it does not**
   - Types constrain the output domain.
   - They do not guarantee semantic invariance of model-facing names.
6. **Engineering consequences**
   - Treat model-facing renames as prompt changes.
   - Regression-test them on boundary cases.
   - Measure downstream actions, not only mean scores or winning labels.
   - Keep hard guarantees and thresholds in deterministic code.
7. **Limits**
   - One task and one returned model version.
   - Four repeated boundary states.
   - An experimental threshold.
   - The large effect is driven by one lexical framing.
   - The families are plausible alternatives, not strict synonyms.
8. **Conclusion**
   - Return to the rename and the separation between probabilistic judgment and
     application-owned guarantees.

## Material to move out of the main narrative

All three reviewers recommended moving most secondary evidence to an audit
appendix or companion article:

- the detailed `LOW` placement experiment and its large table;
- the 500-call negative `noul` result;
- full prompt-wording ablations;
- detailed judge-selection procedure;
- the exploratory `blocked` pilot;
- complete bootstrap, manifest, randomization, and secondary-contrast details.

The main article may briefly mention negative results and robustness checks, then
link to the audit material. The current draft contains two competing stories; the
Jev routing result should become the primary one.

## Figures recommended for the main article

1. A minimal key-name diff.
2. One primary chart showing 25% versus 50% human review, with the other coherent
   families for context.
3. One paired-by-state chart showing the impediment-minus-capacity effect is
   positive in all four boundary states.
4. A compact `Held constant` box listing the state, question, descriptions,
   order, threshold, temperature, model version, and sampling plan.

## Strongest objection

The strongest reviewer objection was unanimous:

> `impeded` and `limited capacity` are not semantically equivalent. A skeptical
> reader can reasonably say that the model reacted to meaning, and that the fixed
> experimental threshold amplified that difference.

The publication-safe response is not to deny the semantic difference. The
experiment establishes the narrower and useful result that coherent names a
developer might choose for the same typed application domain are not guaranteed
to be operationally interchangeable. Identical full descriptions did not make
the keys inert, and the resulting distributional change crossed a threshold fixed
before the run.

The article must not claim strict synonym invariance, production prevalence, or
an observed production incident.

## Additional analysis requested

No reviewer required another large experiment before publication. The empirical
and editorial reviewers requested the following analyses from the existing data:

1. results by state;
2. leave-one-state-out sensitivity;
3. paired branch changes by block, if available;
4. exact language distinguishing sampled decisions, unique states, and production
   cases.

## Scores

| Dimension | Empirical | Editorial | Practitioner | Mean |
|---|---:|---:|---:|---:|
| Novelty | 7 | 7 | 7 | 7.0 |
| Narrative force | 9 | 9 | 9 | 9.0 |
| Technical credibility | 8 | 8 | 8 | 8.0 |
| Practical value | 9 | 9 | 9 | 9.0 |
| Evidence strength | 8 | 8 | 8 | 8.0 |
| Operational realism | 8 | 7 | 7 | 7.3 |
| Standalone article fit | 8 | 9 | 8 | 8.3 |

## Priority revisions

1. Rebuild the opening and article structure around the 25% to 50% routing
   result.
2. Move secondary experiments and methodological detail to an audit appendix.
3. Add state-level and leave-one-state-out views from the existing data.
4. Separate observed evidence, production analogy, and engineering guidance.
5. Use exact language about repeated sampled decisions and plausible alternative
   framings.

