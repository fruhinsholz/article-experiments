# Neutral Review Packet: Choice-Label Contamination in Jev

## Review purpose

Assess whether this experiment contains a technically credible and sufficiently interesting result for a practitioner blog article about JSON legibility versus procedural control.

Do not assume that the result deserves publication. Distinguish:

1. what the experiment directly observes;
2. what it establishes for the tested Jev interface;
3. what remains unproven;
4. whether the result is useful as a standalone article, supporting evidence, or not worth publishing.

## Research question

When a model is given a fixed state, a fixed question, and complete choice descriptions, can the names of the JSON choice keys still change the probability distribution or selected answer, even when the prompt explicitly says that the key names are arbitrary identifiers and should be ignored?

## Constant task

Model returned by the API: `jev-1.13.0`.

State:

> My computer is broken, but I can access the system from my phone.

Question:

> Which description best represents the customer's current ability to work?

Stable semantic descriptions:

- `full`: The customer can perform all necessary work.
- `partial`: The customer can perform some, but not all, necessary work.
- `none`: The customer cannot perform any necessary work.

Instruction under test:

> Choice names are arbitrary identifiers; use only their descriptions.

The state is intentionally ambiguous enough to avoid saturating the same answer at approximately 100 percent in every condition. A separate explicit-partial control did saturate the partial answer and was therefore not diagnostic of a label effect.

## Initial pilot

The description order remained `full, partial, none`. Only the choice keys changed.

| Keys | Mean P(full) | Mean P(partial) | Mean P(none) | Selection |
|---|---:|---:|---:|---|
| `A`, `B`, `C` | 4.6% | 95.4% | 0.0% | partial, 5/5 |
| aligned semantic names | 8.4% | 91.6% | 0.0% | partial, 5/5 |
| conflicting semantic names | 1.0% | 99.0% | 0.0% | partial, 5/5 |

The semantic naming conditions differed by 7.4 percentage points in P(partial), but the pilot changed the key vocabulary between conditions and used only five repetitions. It was treated as a signal requiring a cleaner control, not as decisive evidence.

## Permutation experiment

The semantic-key experiment reused exactly these keys, in this order, in all conditions:

1. `fully_operational`
2. `partially_blocked`
3. `fully_blocked`

All six possible assignments of the three descriptions to those keys were tested. Each assignment received 20 calls.

A matched neutral control repeated the same six description orders with the keys `A`, `B`, and `C`, also with 20 calls per condition.

Across both runs:

- 240 calls succeeded;
- 0 calls failed;
- state, question, instruction, description text, run count, harness, and requested model were held constant;
- every description appeared once with every semantic key and twice in every position;
- probabilities were remapped from returned keys to the descriptions those keys declared before analysis.

## Results

| Description order | P(partial), semantic keys | P(partial), `A/B/C` | Paired difference | Semantic selection | Neutral selection |
|---|---:|---:|---:|---|---|
| full, partial, none | 91.85% | 94.95% | -3.10 pp | partial, 20/20 | partial, 20/20 |
| full, none, partial | 63.80% | 91.85% | -28.05 pp | partial, 20/20 | partial, 20/20 |
| partial, full, none | 79.25% | 90.70% | -11.45 pp | partial, 20/20 | partial, 20/20 |
| partial, none, full | 94.45% | 89.65% | +4.80 pp | partial, 20/20 | partial, 20/20 |
| none, full, partial | 35.85% | 87.90% | -52.05 pp | **full, 20/20** | partial, 20/20 |
| none, partial, full | 97.20% | 88.70% | +8.50 pp | partial, 20/20 | partial, 20/20 |

The neutral-key control produced a P(partial) range of 7.05 percentage points and never changed the selected description.

The semantic-key conditions produced a P(partial) range of 61.35 percentage points and changed the selected description in one permutation.

### Decision-changing condition

In the fifth permutation:

```text
fully_operational -> none
partially_blocked -> full
fully_blocked     -> partial
```

Jev returned `partially_blocked` on all 20 calls. Because that key's declared description was `full`, the remapped selected answer was `full` on all 20 calls.

The matched neutral condition was:

```text
A -> none
B -> full
C -> partial
```

It selected the `partial` description on all 20 calls.

Thus, replacing neutral identifiers with meaningful identifiers changed both the probability distribution and the final semantic decision, despite complete descriptions and the explicit instruction to ignore key names.

## What we think the experiment demonstrates

The narrow existence claim is supported for this Jev interface and task:

> Meaningful choice keys are semantically active. They can affect how the model interprets a fixed state relative to a fixed question, and can change both reported probabilities and the selected answer, even when the declared interface says to ignore the key names.

The experiment refutes, for this interface, the general assumption that choice keys are necessarily semantically inert merely because they are described as arbitrary identifiers.

The textual state itself is unchanged. The relevant claim is not that the state string is modified, but that the decision function behaves as if it depends on the state, descriptions, and key names:

```text
decision = f(state, question, descriptions, key_names)
```

rather than only:

```text
decision = f(state, question, descriptions)
```

## What it does not demonstrate

The experiment does not establish:

- that every meaningful key changes every decision;
- that the effect has the same magnitude in other tasks;
- that the result generalizes to other Jev versions, models, or providers;
- that JSON broadly fails as a control boundary from this experiment alone;
- that the internal mechanism is known;
- that attention heads, a parser, or any specific model component caused the effect;
- that the ambiguous state has one objectively correct label;
- that the 20 repeated calls are statistically independent in a conventional scientific sense;
- that this is a production incident or a realistic business workflow.

The result is a controlled behavioral counterexample, not a universal benchmark or mechanistic explanation.

## Candidate article relevance

The broader article thesis is:

> JSON is legible to the model, but legibility is not control.

This experiment may support a narrower and concrete form of that thesis:

> A schema can constrain the shape of an answer without making its identifiers semantically inert. Meaningful keys remain part of the model's context and may influence the interpretation that produces the answer.

Possible practitioner implication:

- Engineers should not assume that choice labels, enum names, field names, or other supposedly internal identifiers are behaviorally neutral in an LLM-facing schema.
- If a consequence-bearing decision must depend only on declared descriptions or deterministic state, the application should not rely on a natural-language instruction to make other prompt tokens inert.
- Neutral identifiers can reduce one source of semantic pressure, but this experiment does not show that neutral identifiers create a complete control boundary.

## Known weaknesses and useful follow-ups

1. **Toy-like task:** the broken-computer/phone scenario is readable but not yet a compelling real workflow.
2. **One model/interface:** replication on other Jev versions and other model APIs is absent.
3. **One vocabulary set:** the decisive permutation should be repeated with additional balanced semantic vocabularies.
4. **Limited inference:** confidence intervals, effect-size treatment, and a preregistered analysis are absent.
5. **Potential API semantics:** the public meaning of Jev's returned probabilities and any wrapper behavior should be documented precisely.
6. **Ecological validity:** a realistic case-routing, eligibility, or approval example would improve practitioner relevance.
7. **Causal decomposition:** the experiment shows that meaningful identifiers matter, but does not isolate token frequency, morphology, semantic polarity, or learned associations as the cause.

## Evidence available

- Experiment documentation: `experiments/choice-label-contamination/README.md`
- Semantic permutations, 20 repetitions each: `results/2026-09-27T17-34-14-818Z-jev-jev-latest-choice-label-permutations-r20/`
- Matched neutral permutations, 20 repetitions each: `results/2026-09-27T17-35-28-509Z-jev-jev-latest-choice-label-neutral-permutations-r20/`
- Each run contains raw calls, run metadata, a machine-readable summary, and a Markdown summary.
- Repository commit containing the experiment: `663783a` (`Add Jev choice-key permutation control`).

## Required review rubric

Score each dimension from 1 to 10, calibrated against strong public technical practitioner essays:

1. **Novelty:** Does this offer a rare or useful framing rather than restating generic prompt sensitivity?
2. **Technical precision:** Are the observed effect, causal claim, and architectural interpretation separated correctly?
3. **Evidence strength:** Are the controls, raw artifacts, repeatability, and limits sufficient for the claims made?
4. **Practitioner value:** Would this change how serious engineers design schemas, prompts, evals, or decision paths?
5. **Narrative force:** Is there a concrete and memorable surprise that can carry an article?
6. **Risk of overclaim:** Score 10 for well-contained claims and 1 for severe overreach risk.
7. **Article fit:** Is this strong enough for a standalone article rather than an appendix or supporting section?

Also provide:

- an overall score out of 10;
- a blunt verdict: `standalone article`, `supporting evidence only`, or `not publication-worthy yet`;
- the strongest demonstrated claim;
- the most important unsupported claim or ambiguity;
- the three highest-value next steps;
- whether the result is clear, useful, interesting, worth sharing, and likely to teach experienced practitioners something non-obvious;
- what wording must be avoided in publication.

Do not reward ambition, effort, or the desired article thesis. Judge only the packet and evidence described above.
