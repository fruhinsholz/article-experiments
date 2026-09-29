# Refined Test Packet: How Much Semantic Authority Do Choice Keys Retain?

Date: 2026-09-27

## Purpose

This packet separates three questions that were previously mixed together:

1. Does Jev evaluate neighboring questions with useful relative stability?
2. Can choice-key wording still influence an otherwise fixed decision?
3. In a direct conflict, can a choice key exert more behavioral influence than its declared description?

The first question is background evidence. The second is already supported by the
existing experiment. The third is the refined experiment proposed here.

## Article thesis under evaluation

The broad article thesis remains:

> JSON is legible to the model, but legibility is not control.

The narrower candidate claim for this experiment is:

> Structured output constrains which answers Jev can return, but it does not make
> equivalent schema formulations behaviorally equivalent. Choice keys remain part
> of the semantic decision surface.

The strongest claim this refinement may support is intentionally narrower:

> In the tested tasks, choice-key wording exerted more behavioral influence than
> the declared choice descriptions in some direct conflicts.

It must not be generalized to all Jev tasks, schemas, or models.

## What the project has already established

### 1. Questions show useful relative independence in Jev

The question-interference experiment held the state and target question fixed
while adding or reordering neighboring questions.

- Jev `jev-1.13.0`: 600 successful calls across the pilot and replication,
  including 500 calls in the 100-repeat-per-condition replication.
- Target score with the question alone: `0.0418`.
- Largest mean shift after adding or moving a neighboring question: `+0.0006`.
- An additional 300-call, three-question probe produced shifts between `-0.0008`
  and `+0.0002`.

This is positive evidence of question-level stability for the tested state,
questions, model, and API version. It corrects the earlier formulation that
question independence was simply "unproven."

It is not proof of architectural isolation. The experiment measures behavioral
stability at the available score resolution.

### 2. Gemini provides a useful comparison, not a single universal verdict

Gemini `gemini-3.5-flash-lite` was nearly invariant in the initial saturated-state
probe and remained strongly stabilized by explicit criteria. In the more ambiguous
bare-question probe, however, an oriented question placed before the target moved
the combined mean target score from `0.000` to `0.077` and produced a non-zero
score in `31/70` calls.

The fair conclusion is:

> The experiments provide evidence of relative question independence under some
> formulations, while also showing that a conventional LLM can become more
> order-sensitive near a semantic boundary. Jev was materially more stable on the
> matched probe.

This background matters because it prevents the new experiment from claiming that
all fields in a Jev request indiscriminately contaminate one another. The observed
choice-key effect is more specific.

### 3. Choice keys are behaviorally active in Jev

The existing permutation experiment held the state, question, instruction,
description text, key vocabulary, and key order constant. It tested all six
assignments of three descriptions to three semantic keys, with a matched `A/B/C`
control.

- 240 successful calls, 0 errors.
- Neutral-key control: `P(partial)` range of `7.05` percentage points; no decision
  change.
- Semantic keys: `P(partial)` range of `61.35` percentage points.
- In the decisive permutation, the semantic-key condition selected the description
  `full` in `20/20` calls, while the matched neutral condition selected `partial`
  in `20/20` calls.

This supports the following existence claim:

> Meaningful choice keys can change both Jev's reported distribution and its final
> semantic decision despite complete descriptions and an instruction to ignore the
> key names.

### 4. The existing counterexample shows the possible extent of the effect

The decisive condition deliberately creates a severe contradiction:

```text
fully_operational -> none
partially_blocked -> full
fully_blocked     -> partial
```

Jev returned `partially_blocked` in `20/20` calls. Its declared description was
the `full` description, so the observed decision followed the key's semantic cue
rather than the declared description that best matched the state.

This is a strong stress-test result. It is not yet a realistic-schema result,
because Jev's documented guidance treats choice names as meaningful and recommends
short, descriptive names. The contradiction therefore pushes the interface beyond
normal usage.

## Why refine the experiment

The current result answers an existence question and establishes an upper-bound
counterexample. It leaves two practitioner questions open:

1. Do several reasonable, documentation-compliant names for the same choices still
   produce operationally meaningful differences?
2. In controlled conflicts, is key wording sometimes more influential than the
   full descriptions, or was the decisive result an isolated lexical accident?

The refinement is designed to move from an adversarial counterexample to a realistic
engineering risk without discarding the stress test that revealed the effect.

## Refined experiment

### Constant state

Use the existing boundary state:

> My computer is broken, but I can access the system from my phone.

Add two preregistered controls:

- clear full: the person can complete every essential duty normally from the phone;
- clear partial: the person can complete some essential duties, but not all of them.

The boundary state is the sensitive probe. The clear states detect pathological
schema effects and ceiling saturation.

### Constant question

> Which description best represents the person's current ability to complete
> essential work?

### Canonical descriptions

```text
D_FULL:
The person can complete every essential job duty at normal quality and pace
without assistance.

D_PARTIAL:
The person can complete some essential job duties, but at least one essential
duty cannot be completed at normal quality or pace.

D_NONE:
The person cannot complete any essential job duty.
```

The descriptions remain byte-for-byte identical whenever the experiment is testing
key wording.

### Phase A: realistic key-language sensitivity

Use four preregistered candidate key families. Every family stays on the same
work-completion dimension and is intended to be short, descriptive, internally
coherent, and compatible with Jev's naming guidance.

| Family | Full | Partial | None |
|---|---|---|---|
| work completion | `complete_work` | `partial_work` | `no_work` |
| task coverage | `all_tasks` | `some_tasks` | `no_tasks` |
| ability | `fully_able` | `partly_able` | `unable` |
| capacity | `full_capacity` | `partial_capacity` | `no_capacity` |

Before running Jev, use a separate blinded human check to reject any family that
does not preserve the same category boundaries. Add `A/B/C` as the neutral
reference. Keep descriptions, description order, state, question, instruction,
model, and decoding constant. Randomly interleave conditions in balanced blocks
rather than running one family in a contiguous block.

Primary readouts:

- probability assigned to each canonical description after remapping;
- dominant-description changes;
- maximum and mean paired probability shift versus `A/B/C`;
- branch changes under one preregistered production-like policy;
- a full threshold-sensitivity curve as secondary analysis;
- consistency across the three states and four key families.

Phase A supports a realistic fragility claim only if at least two independently
validated key families create replicated shifts larger than the neutral order
effect and change either the dominant answer or the branch selected by the
preregistered application policy.

### Phase B: symmetric key-versus-description factorial

Use a binary full-versus-partial task so the two interventions can be expressed on
the same outcome scale. For each fixed state, create two output slots and manipulate
independently which slot receives the partial key cue and which slot receives the
partial description cue.

The core `2 x 2` design is:

| Key cue | Description cue | Meaning |
|---|---|---|
| partial points to slot 1 | partial points to slot 1 | aligned on slot 1 |
| partial points to slot 1 | partial points to slot 2 | direct conflict |
| partial points to slot 2 | partial points to slot 1 | direct conflict |
| partial points to slot 2 | partial points to slot 2 | aligned on slot 2 |

The key intervention swaps `full` and `partial` key semantics between the same two
slots while descriptions remain fixed. The description intervention swaps the full
and partial descriptions between the same two slots while keys remain fixed. This
creates mirror interventions with a common outcome: the log-odds of selecting slot
1. Reverse physical serialization order in balanced blocks.

For example, one direct full-versus-partial conflict is:

```json
{
  "complete_work": "The person can complete some essential job duties, but at least one essential duty cannot be completed at normal quality or pace.",
  "partial_work": "The person can complete every essential job duty at normal quality and pace without assistance."
}
```

With the clear-partial state:

- selecting `complete_work` follows the description;
- selecting `partial_work` follows the key.

Repeat the complete factorial with every validated semantic key family, multiple
preregistered description paraphrase families, the clear-full and clear-partial
states, and reversed serialization order. Include `A/B` controls using the same
description orders. Run the same design with and without the artificial instruction
to ignore key names.

Primary readouts:

- key-following and description-following rates in the two conflict cells;
- average marginal log-odds effect of swapping key semantics;
- average marginal log-odds effect of swapping description semantics;
- key-by-description interaction;
- uncertainty across states, validated vocabularies, paraphrase families, runs,
  and serialization orders.

The preregistered dominance estimand is the difference between the absolute average
marginal key effect and the absolute average marginal description effect. Calls are
not described as statistically paired merely because they share a condition. States,
vocabulary families, and description paraphrase families provide the intended units
of replication and generalization.

Before execution, freeze the complete stimulus set, accepted key families, description
paraphrases, application branch rule, sample size, balanced-block randomization seed,
stopping rule, exclusions, model and API version, primary estimator, uncertainty
method, multiplicity handling, and success or failure criteria. Preserve the exact
serialized requests and raw responses for every call.

### Phase C: description-strength ladder

Hold each semantic key family fixed and vary only how explicit the descriptions are:

1. concise but valid;
2. canonical and operational;
3. redundant, with explicit necessary-and-sufficient criteria.

This phase asks whether adding description precision can overcome a conflicting key
cue. It must not be described as holding descriptions constant. It is a robustness
analysis, not the primary basis for comparing key and description influence.

## Decision rules for the conclusions

### Conclusion already supported

> Choice keys are behaviorally active in the tested Jev interface.

### Realistic fragility supported if

- at least two independently validated key families produce a replicated probability
  shift beyond the matched neutral order range; and
- at least one shift changes the dominant answer or crosses a preregistered
  application threshold.

Candidate wording:

> Several reasonable schema names described the same choices, yet the naming choice
> changed the operational decision boundary.

### Key dominance over descriptions supported if

- the symmetric factorial estimates a larger absolute average marginal key effect
  than description effect, with uncertainty that excludes equality under the
  preregistered analysis; and
- the direction replicates across multiple validated vocabulary and description
  paraphrase families, states, runs, and both serialization orders.

Candidate wording:

> In these tested conflicts, key wording exerted more behavioral influence than the
> declared descriptions.

Do not write that Jev generally prioritizes keys over descriptions unless the effect
replicates across tasks and versions.

### Refinement fails if

- coherent names stay within the neutral order range;
- only the deliberately contradictory stress test changes behavior; or
- the dominance result disappears under reversed order or alternative vocabularies.

That negative result would still leave the existing existence claim intact, but it
would reposition the counterexample as an adversarial edge case rather than a broad
practitioner risk.

## Practical relevance being tested

The practical question is not whether renaming is cosmetically visible to a model.
It is whether an engineer can safely treat an LLM-facing enum or choice-key rename as
a behavior-preserving refactor.

Potential consequences include:

- a routing label crossing an escalation threshold;
- an eligibility score crossing an approval threshold;
- a moderation or support classification changing branches;
- an eval passing under one reasonable naming convention and failing under another;
- two schema versions producing different decisions despite identical descriptions.

The practical recommendation, if confirmed, would be to version and regression-test
consequence-bearing schema names as prompt content, not as inert implementation
details.

## Requested independent review

Judge this packet on two separate axes.

### A. Blog interest

Score each from 1 to 10:

- novelty;
- narrative force;
- technical credibility;
- fit with the thesis `JSON is legible to the model, but legibility is not control`;
- likelihood of teaching experienced practitioners something non-obvious.

Answer whether the combination of relative question stability, the existing extreme
counterexample, and the refined realistic test can carry a strong article.

### B. Practical interest

Score each from 1 to 10:

- likelihood of changing engineering practice;
- realism of the proposed risk;
- usefulness of the proposed decision rules;
- value of the resulting mitigation;
- urgency for teams using LLM-facing schemas or typed classification interfaces.

### Required verdict

Provide:

1. an overall blog-interest score;
2. an overall practical-interest score;
3. the strongest already-supported claim;
4. the most valuable claim the refinement could establish;
5. the largest design flaw or confound;
6. the three highest-value changes before running the test;
7. a blunt recommendation: `run as designed`, `revise then run`, or `do not run`;
8. whether the result belongs in a standalone article, the broader JSON article, or
   only an appendix.

Do not reward the desired thesis. Judge only the evidence and design in this packet.

## Evidence paths

- Existing choice-key evidence: `experiments/choice-label-contamination/README.md`
- Raw semantic-key permutation run:
  `experiments/choice-label-contamination/results/2026-09-27T17-34-14-818Z-jev-jev-latest-choice-label-permutations-r20/`
- Matched neutral run:
  `experiments/choice-label-contamination/results/2026-09-27T17-35-28-509Z-jev-jev-latest-choice-label-neutral-permutations-r20/`
- Question-independence evidence: `experiments/question-interference/README.md`
