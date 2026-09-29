# Choice-label contamination

This pilot tests whether Jev choice names remain semantically active when complete
descriptions are present and the instructions explicitly call the names arbitrary.

The state, question, three descriptions, and description order remain constant.
Only the keys change:

- `neutral`: `A`, `B`, `C`
- `aligned`: names agree with their descriptions
- `conflicting`: names contradict or pressure their descriptions

The default `ambiguous` state says that phone access exists without specifying
whether it supports every necessary task. `explicit_partial` is available as a
positive semantic control and is expected to saturate the middle choice.

Probabilities are remapped from choice keys to the stable semantic descriptions
before comparison.

Run:

```bash
npm run check:choice-label
npm run run:choice-label:jev
npm run run:choice-label:permutations:jev
npm run run:choice-label:neutral-permutations:jev
```

This pilot can reveal a candidate effect. Five repetitions per condition are not
enough to establish its magnitude or reliability.

## Initial results

Model returned by the API: `jev-1.13.0`.

### Explicit-partial control

With `I can use my phone, but only for basic tasks`, all 15 calls selected the
partial description. Mean partial probability was `0.994` with neutral names and
`1.000` with both semantic name sets. This state is too saturated to expose a
meaningful label effect.

Results:
`results/2026-09-27T16-00-12-347Z-jev-jev-latest-choice-label-pilot-r5/`

### Ambiguous state

With `I can access the system from my phone`, all calls still selected the
partial description, but its probability changed with the keys:

| Choice keys | Mean P(full) | Mean P(partial) | Mean P(none) |
|---|---:|---:|---:|
| `A`, `B`, `C` | 0.046 | 0.954 | 0.000 |
| aligned semantic names | 0.084 | 0.916 | 0.000 |
| conflicting semantic names | 0.010 | 0.990 | 0.000 |

The full-versus-partial distribution spans 7.4 percentage points between the two
semantic naming conditions even though the descriptions and their order are
unchanged. Within each condition, repeated values vary by at most three points.

This is a candidate choice-name effect, not yet a reliable magnitude estimate.
The next control should reuse the exact same semantic key vocabulary and permute
which descriptions those keys name. That would remove vocabulary differences
between the semantic conditions.

Results:
`results/2026-09-27T16-00-41-300Z-jev-jev-latest-choice-label-ambiguous-r5/`

## Permutation control

The permutation control reuses exactly these three keys in exactly this order for
every condition:

- `fully_operational`
- `partially_blocked`
- `fully_blocked`

It runs all six possible assignments of the three stable descriptions to those
keys. This keeps key vocabulary, key tokenization, key order, state, question,
and the set of descriptions constant. Only the key-description association
changes. Across all six permutations, every description appears once with every
key and twice in every position. This semantic-key run alone does not separate
key identity from position.

The matched neutral control repeats the same six description orders with `A`,
`B`, and `C`. Comparing each semantic-key permutation to its neutral counterpart
separates meaningful key vocabulary from a generic answer-position effect.

## Permutation results

Model returned by the API: `jev-1.13.0`.

Both runs used 20 repetitions per permutation. All 240 calls succeeded.

| Description order | P(partial), semantic keys | P(partial), `A/B/C` | Paired difference | Semantic selection | Neutral selection |
|---|---:|---:|---:|---|---|
| full, partial, none | 91.85% | 94.95% | -3.10 pp | partial, 20/20 | partial, 20/20 |
| full, none, partial | 63.80% | 91.85% | -28.05 pp | partial, 20/20 | partial, 20/20 |
| partial, full, none | 79.25% | 90.70% | -11.45 pp | partial, 20/20 | partial, 20/20 |
| partial, none, full | 94.45% | 89.65% | +4.80 pp | partial, 20/20 | partial, 20/20 |
| none, full, partial | 35.85% | 87.90% | -52.05 pp | **full, 20/20** | partial, 20/20 |
| none, partial, full | 97.20% | 88.70% | +8.50 pp | partial, 20/20 | partial, 20/20 |

The neutral-key control shows a position/order effect of at most 7.05 percentage
points and never changes the selected description. Semantic keys expand the
P(partial) range to 61.35 points and change the selected description in the
`none, full, partial` permutation.

In that permutation, Jev returns the key `partially_blocked` on all 20 calls even
though that key's description is `The customer can perform all necessary work.`
After remapping keys to their declared descriptions, the selected answer is
therefore `full`, not `partial`. The matched `A/B/C` condition selects the
partial description on all 20 calls.

This establishes an existence claim for this Jev interface: meaningful choice
keys are semantically active and can alter both probabilities and the final
decision despite complete descriptions and an explicit instruction to ignore
the key names. It does not establish that every meaningful key changes every
decision or that the effect has a fixed magnitude in other tasks.

Semantic-key results:
`results/2026-09-27T17-34-14-818Z-jev-jev-latest-choice-label-permutations-r20/`

Matched `A/B/C` results:
`results/2026-09-27T17-35-28-509Z-jev-jev-latest-choice-label-neutral-permutations-r20/`

## Refined follow-up

The next experiment separates the established existence claim from two stronger
questions: whether several documentation-compliant key families create operationally
meaningful shifts, and whether key wording can dominate increasingly explicit
descriptions in direct conflicts.

Design and independent-review rubric:
`REFINED_TEST_PACKET.md`

Three-judge review and adopted revisions:
`REFINED_TEST_REVIEW_SUMMARY.md`

## Refined Phase A artifacts

- Frozen stimuli: `refined-stimuli.v1.json`
- Semantic preflight: `BLINDED_KEY_VALIDATION.md`
- Preregistration: `PREREGISTRATION.md`
- Calibrated manifest: `refined-stimuli.v2.json`
- Preregistration amendment: `PREREGISTRATION_AMENDMENT_1.md`
- Pilot and calibration report: `PILOT_AND_CALIBRATION_REPORT.md`
- Runner: `src/refined-choice-key-phase-a.mjs`
- Confirmatory analysis: `results/2026-09-27T19-25-16-530Z-jev-jev-latest-refined-phase-a-confirmatory/confirmatory-analysis.md`
- Post-confirmatory judge packet: `POST_CONFIRMATORY_JUDGE_PACKET.md`
- Three-judge post-confirmatory summary: `POST_CONFIRMATORY_JUDGE_SUMMARY.md`

The technical pilot includes all candidate families, including the rejected
`ability` family, solely to exercise the harness. It is explicitly excluded from
confirmatory evidence. The confirmatory command includes only the neutral reference
and the three accepted semantic families.

```bash
npm run check:choice-label:refined
npm run run:choice-label:refined:pilot:jev
npm run run:choice-label:refined:confirmatory:jev
npm run analyze:choice-label:refined:confirmatory
```

## Refined Phase A confirmatory result

The confirmatory run completed 240 calls with no errors on `jev-1.13.0`.
For the calibrated boundary state, all three accepted semantic key families reduced
the mean review score relative to neutral `A/B/C` keys:

| Family | Review-score difference | Paired bootstrap 95% CI | Human-review rate difference |
|---|---:|---:|---:|
| `work_completion` | -6.40 pp | [-8.45, -4.30] pp | -40 pp |
| `task_coverage` | -8.80 pp | [-10.40, -7.20] pp | -45 pp |
| `capacity` | -4.20 pp | [-6.10, -2.40] pp | -35 pp |

The clear-full and clear-partial controls were unchanged across all families. Only
`task_coverage` exceeded the preregistered 7.05-point matched-neutral order range.
Because the success criterion required at least two accepted families to exceed
that range and change a decision branch, the preregistered realistic-fragility
claim is **not supported**. The narrower earlier existence result for deliberately
contradictory keys remains valid.

## Post-confirmatory instruction ablation

The original question ended with `Treat choice names as identifiers. Base the
answer on the descriptions.` Because that wording could itself steer the model,
a post-confirmatory ablation repeated the same 240-call design without the suffix.
This is a robustness check, not a second preregistered confirmatory run.

- Ablation manifest: `refined-stimuli.v3-no-identifier-instruction.json`
- Ablation result: `results/2026-09-27T19-54-25-506Z-jev-jev-latest-refined-phase-a-no-identifier-instruction/`
- Direct comparison: `results/2026-09-27T19-54-25-506Z-jev-jev-latest-refined-phase-a-no-identifier-instruction/instruction-ablation-comparison.md`

At the boundary, the mean descriptive-key gap relative to neutral `A/B/C` was
`-6.47 pp` with the suffix and `-6.48 pp` without it. Clear controls remained
perfect in both runs. The family-level pattern was not numerically identical:
without the suffix, `capacity` and `work_completion` exceeded 7.05 points, while
`task_coverage` did not. All three descriptive families produced `0/20` human-review
branches, versus `7/20` under neutral keys.

The narrow behavioral conclusion therefore survives the ablation: descriptive
choice names remained materially active when the question contained no instruction
about how to treat them. The two runs should not be described as formally
equivalent because no equivalence margin or test was preregistered.

```bash
npm run run:choice-label:refined:no-identifier-instruction:jev
npm run analyze:choice-label:instruction-ablation
```

## Post-confirmatory question-wording ablation

The instruction-ablation question still asked which description best represented
the person's ability. Because that wording could make the descriptions unusually
salient, a second post-confirmatory ablation replaced it with the operational
question `To what extent can the person currently perform their essential work?`
The identifier suffix remained absent. All other experimental variables were held
fixed.

- Operational-question manifest: `refined-stimuli.v4-operational-question.json`
- Final result: `results/2026-09-27T20-07-02-701Z-jev-jev-latest-refined-phase-a-operational-question/`
- Direct comparison: `results/2026-09-27T20-07-02-701Z-jev-jev-latest-refined-phase-a-operational-question/question-ablation-comparison.md`

The final run returned 240/240 valid responses from `jev-1.13.0`, with no clear-
control errors. At the boundary, neutral `A/B/C` keys produced a 47.10% mean
review score and 7/20 human-review branches. The descriptive families produced:

| Family | Mean review score | Gap versus neutral | Human review |
|---|---:|---:|---:|
| `work_completion` | 39.90% | -7.20 pp | 0/20 |
| `task_coverage` | 32.25% | -14.85 pp | 0/20 |
| `capacity` | 43.45% | -3.65 pp | 1/20 |

The aggregate descriptive-key gap increased in magnitude from `-6.48 pp` under
the description-oriented question to `-8.57 pp` under the operational question.
The exact family-level distributions changed, so this is not evidence of formal
equivalence. It does show that the narrow behavioral effect survives both removal
of the explicit identifier instruction and removal of the description-oriented
question wording. This remains post-confirmatory supporting evidence.

The Jev endpoint intermittently returned HTTP 529 during preliminary attempts.
The final runner supports bounded retries for HTTP 529 only; the retained final
run happened to require no retries.

```bash
npm run run:choice-label:refined:operational-question:jev
npm run analyze:choice-label:question-ablation
```

## Narrow-article review and Gemini comparison

The completed narrow Jev result was evaluated independently as a possible
standalone practitioner article using the same blog-interest and practical-interest
dimensions as the earlier article reviews.

- Judge packet: `NARROW_ARTICLE_JUDGE_PACKET.md`
- Three-judge summary: `NARROW_ARTICLE_JUDGE_SUMMARY.md`

All three judges rated it a **publishable standalone article with revisions**. Mean
scores were 8.0/10 for blog interest, 7.6/10 for practical interest, 7.6/10 for
evidence strength, and 7.8/10 for standalone fit.

The final operational-question probe was also repeated with
`gemini-3.5-flash-lite` using the same state, question, descriptions, keys, balanced
cells, and downstream threshold. Gemini received the Jev-like request serialized as
a classification prompt and returned structured self-reported probabilities.

```bash
npm run run:choice-label:refined:operational-question:gemini
```

- Comparison: `GEMINI_JEV_OPERATIONAL_QUESTION_COMPARISON.md`
- Gemini results:
  `results/2026-09-27T20-52-04-636Z-gemini-gemini-3.5-flash-lite-refined-phase-a-operational-question/`

Both systems were sensitive to key semantics near the boundary. Jev showed smaller
but directionally consistent shifts across all three descriptive families. Gemini
showed larger, coarser shifts for `work_completion` and `task_coverage`, including
six selected-class changes out of twenty, but no material shift for `capacity`.
Gemini's self-reported probabilities are not calibrated or numerically equivalent
to Jev scores.

## Blind natural choice naming

Three independent judge sessions were given only the operational question, the
three fixed descriptions, and the requirement to propose one natural developer-facing
`snake_case` triad. They were not shown existing families, author proposals, results,
or one another's answers.

All three independently proposed:

- `all_essential_duties`
- `some_essential_duties`
- `no_essential_duties`

- Blind packet: `BLIND_NATURAL_CHOICE_NAMING_PACKET.md`
- Responses and consensus: `BLIND_NATURAL_CHOICE_NAMING_RESULTS.md`

## Blind natural-key replication

The final replication tested three descriptive families generated independently
in the blind naming exercise, with neutral `A/B/C` retained as a secondary
reference. The operational question contained no instruction about choice names.

- Preregistration: `REPLICATION_PREREGISTRATION.md`
- Calibration manifest: `replication-calibration-states.v1.json`
- Calibration and mechanical selection: `REPLICATION_CALIBRATION_SELECTION.md`
- Frozen replication manifest: `refined-stimuli.v5-blind-natural-key-replication.json`
- Calibration result:
  `results/2026-09-27T22-31-09-875Z-jev-jev-latest-blind-natural-key-replication-calibration/`
- Replication result and analysis:
  `results/2026-09-27T22-32-07-011Z-jev-jev-latest-blind-natural-key-replication/`

Calibration completed 120/120 calls without errors. Two states fell inside the
target review-score interval `[0.35, 0.65]`; the two nearest remaining states were
added by the preregistered fallback rule. The replication then completed 480/480
calls without errors or retries, all returned by `jev-1.13.0`.

Two of the three primary descriptive-family contrasts met all conditions:

| Contrast | Aggregate review-score difference | Hierarchical bootstrap 95% CI | Direction | Branch changed |
|---|---:|---:|---|---|
| `duty_coverage - capability_statement` | -1.34 pp | [-3.38, 0.34] pp | mixed | no |
| `duty_coverage - work_capacity_level` | -17.24 pp | [-24.55, -7.53] pp | 4/4 negative | yes |
| `capability_statement - work_capacity_level` | -15.90 pp | [-23.20, -7.23] pp | 4/4 negative | yes |

Both clear-state guardrails were perfectly stable across all four families. The
result supports the narrow claim that even plausible, independently proposed key
names can materially change a fixed Jev decision distribution. It does not show
that every natural rename matters: `duty_coverage` and `capability_statement` were
not distinguishable under the preregistered criterion.

```bash
INFISICAL_TLS_VERIFY=0 npm run run:choice-label:replication:calibrate:jev
INFISICAL_TLS_VERIFY=0 npm run run:choice-label:replication:jev
npm run analyze:choice-label:replication -- <result-directory>
```

## Key-framing follow-up and revised article review

The reviewer-requested state-level, leave-one-state-out, and paired branch
transition checks are documented in
[`RISK_SENSITIVITY_ANALYSIS.md`](RISK_SENSITIVITY_ANALYSIS.md). They use the
existing 600-call run and require no additional model calls.

A preregistered descriptive follow-up added `work_impediment` and
`duty_prevention` while preserving the operational question, descriptions, states,
threshold, model request, and balanced-block design.

- Preregistration: `KEY_FRAMING_FOLLOWUP_PREREGISTRATION.md`
- Frozen manifest: `refined-stimuli.v6-key-framing-followup.json`
- 600-call analysis: `KEY_FRAMING_TWO_FAMILY_RESULTS.md`
- Combined blocking-language report: `BLOCKING_LANGUAGE_RESULTS.md`
- Revised article-review packet: `REVISED_ARTICLE_REVIEW_PACKET.md`

The follow-up completed 600/600 calls without errors or retries on returned model
`jev-1.13.0`. Across 80 boundary calls per family, `work_impediment` triggered
human review in 40 calls, compared with 20 for `work_capacity_level`, 21 for
`duty_prevention`, and 20 for `duty_coverage`. The review-score difference between
`work_impediment` and `work_capacity_level` was +12.13 percentage points with a
hierarchical bootstrap 95% interval of [6.88, 19.78], positive in all four states.

The result supplies the larger operational effect requested by the previous
article review: a coherent key-family change doubled the boundary-case review rate
from 25% to 50% under a fixed experimental policy. It remains an existence result
for one task and Jev version, not an estimate of production prevalence.
