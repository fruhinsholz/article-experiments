# Revised Article Review Packet: JSON Legibility and Operational Control

Date: 2026-09-28

Article: `JSON Is Legible. That Does Not Make It a Control Boundary`

## Why this packet exists

The previous final review rated the narrow Jev result publishable with revisions,
but identified two weaknesses in the article-facing evidence:

1. the largest reported review-branch change was only `0/20` versus `2/20`;
2. the article needed a clearer operational failure, not only a statistically
   resolved score-distribution shift.

This packet asks whether a new preregistered descriptive follow-up materially
addresses those weaknesses while preserving the narrow claim and its limits.

## Candidate article claim

> Typed structure can constrain the output domain without making model-facing
> identifiers semantically inert. In a Jev 1.13.0 task, changing only coherent
> choice-key names shifted score distributions and doubled the human-review rate
> on boundary cases from 20/80 to 40/80, while the state, operational question,
> full descriptions, threshold, model version, and sampling plan remained fixed.

This is an existence claim for one tested task and version. It is not a prevalence
claim and does not imply that every rename changes behavior.

## Interface and application rule

Jev receives a structured `choice` object whose JSON keys identify choices and
whose values fully describe them. The application computes a review score:

`P(partial work) + P(no work)`

It sends a case to human review when that score is at least `0.50`.

The threshold is an experimental production-like policy fixed before the run. It
was not a deployed production policy.

## Earlier evidence retained in the article

### Blind natural-key replication

Three independent AI judge sessions proposed plausible descriptive key families
before behavioral testing. A preregistered 480-call replication compared three
families across four selected boundary states and two clear guardrails.

- `duty_coverage - work_capacity_level`: -17.24 pp,
  95% interval [-24.55, -7.53], same direction in 4/4 states.
- `capability_statement - work_capacity_level`: -15.90 pp,
  95% interval [-23.20, -7.23], same direction in 4/4 states.
- Clear-state guardrails: no errors.
- Largest branch-rate example: 0/20 versus 2/20 human reviews.

This established non-interchangeability among natural descriptive families but
left the operational magnitude modest.

## New evidence

### Preregistered descriptive follow-up

The follow-up froze two additional coherent families:

- `work_impediment`:
  `essential_work_unimpeded`, `essential_work_impeded`,
  `essential_work_halted`;
- `duty_prevention`:
  `no_essential_duty_prevented`, `some_essential_duties_prevented`,
  `all_essential_duties_prevented`.

It crossed these with neutral `A/B/C`, `duty_coverage`, and
`work_capacity_level` using the same:

- four boundary states and two clear guardrails;
- operational question;
- full descriptions and order;
- threshold and temperature;
- Jev route and requested model alias;
- 20 complete balanced blocks.

The immutable run manifest records the exact stimuli, randomization seed, and job
order. The run completed 600/600 calls with zero errors and zero retries. Jev
returned `jev-1.13.0`.

### Boundary results

| Key family | Mean review score | Human review |
|---|---:|---:|
| `duty_coverage` | 28.40% | 20/80 |
| `work_capacity_level` | 45.11% | 20/80 |
| `duty_prevention` | 45.86% | 21/80 |
| neutral `A/B/C` | 48.85% | not primary |
| `work_impediment` | 57.24% | 40/80 |

Intervals below are hierarchical bootstrap 95% intervals over states and paired
blocks.

| Contrast | Difference | 95% interval | Direction | Threshold changes |
|---|---:|---:|---|---:|
| `work_impediment - work_capacity_level` | +12.13 pp | [6.88, 19.78] | positive in 4/4 | 20 |
| `work_impediment - duty_prevention` | +11.37 pp | [7.45, 16.64] | positive in 4/4 | 19 |
| `work_impediment - duty_coverage` | +28.84 pp | [25.85, 31.94] | positive in 4/4 | 20 |
| `duty_prevention - work_capacity_level` | +0.75 pp | [-2.75, 4.20] | mixed | 1 |

`work_impediment` therefore sent 50% of boundary calls to review, compared with
25% for `work_capacity_level` and `duty_coverage`, and 26.25% for
`duty_prevention`.

All clear-state guardrails remained correct across all five families:

- clear full: 100/100 automatic branches;
- clear partial: 100/100 human-review branches.

### Exploratory blockage pilot

A separate five-block pilot added:

- `essential_work_not_blocked`;
- `essential_work_partially_blocked`;
- `essential_work_fully_blocked`.

Its mean review score was 45.80%, close to contemporaneous capacity and prevention
references, while impediment remained higher. Because the pilot used only five
blocks and no equivalence margin was specified, it supports a descriptive
interpretation only. It is not confirmatory evidence of equivalence.

## Operational interpretation

The new result creates a concrete failure mode:

- to a developer, the edit may appear to rename members of a typed domain;
- to the model, the new identifiers remain semantic evidence;
- to the application, the distributional shift changes routing at a fixed
  threshold;
- in this protocol, the change produced 20 additional reviews per 80 boundary
  cases.

The opposite rename direction could reduce reviews, leaving cases unreviewed that
the previous names would have escalated. The experiment demonstrates that this can
happen. It does not estimate production frequency, cost, or harm.

## What the vocabulary comparison adds

Negative wording alone does not explain the result. The explicit ordered scales
`no / some / all ... prevented` and, in the pilot,
`not / partially / fully blocked` tracked the capacity family. The asymmetric
`unimpeded / impeded / halted` scale produced the larger shift.

A plausible linguistic reading is that bare `impeded` already supplies a strong
partial-impairment cue, whereas `partially blocked` and
`some duties prevented` encode degree explicitly. This is an interpretation of
the observed behavior, not evidence about Jev's internal mechanism.

## Publication limits

- One task family and one returned Jev version.
- The new effect is driven by one lexical framing.
- The families are coherent alternatives, not strict synonyms.
- The follow-up was preregistered as descriptive, not as a new confirmation of the
  original article claim; it specified no minimum-effect or equivalence margin.
- Repeated calls are paired balanced blocks, not fully independent observations.
- The threshold was experimental, not deployed.
- AI judges proposed earlier families; they were not human raters or independent
  model families.
- No result identifies an internal mechanism or estimates prevalence.
- The blockage pilot is exploratory and cannot establish equivalence.

## Proposed engineering guidance

1. Treat model-facing identifier changes as prompt and policy changes in review.
2. Version identifiers and descriptions together.
3. Regression-test renames on representative boundary cases.
4. Compare full score distributions and downstream action rates.
5. Keep thresholds in code and monitor traffic near them.
6. Use deterministic controls for facts and invariants the application owns.

## Questions for reviewers

1. Does the 20/80 versus 40/80 result adequately address the earlier request for
   a larger threshold effect?
2. Is the operational failure mode concrete without implying observed production
   harm?
3. Is the candidate claim supported exactly as written?
4. Does the vocabulary comparison make the result more informative than the
   generic claim that prompt wording matters?
5. Which result belongs in the opening: the doubling in escalation rate, the
   12.13-point score shift, or both?
6. Should the exploratory blockage pilot remain in the article, move to an audit
   appendix, or be omitted?
7. What is now the largest obstacle to publication?

## Required verdict

Return:

1. a 1-10 score for novelty, narrative force, technical credibility, practical
   value, evidence strength, operational realism, and standalone article fit;
2. `publishable`, `publishable with revisions`, or `not yet publishable`;
3. the strongest publication-safe claim;
4. the largest remaining weakness;
5. the three highest-value revisions.

