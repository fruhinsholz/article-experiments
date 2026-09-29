# Independent Review Packet: Is the Narrow Jev Result Worth an Article?

Date: 2026-09-27

## Review purpose

Judge whether the completed, narrow Jev choice-key result is sufficiently
interesting and useful to carry a standalone practitioner article. Do not judge
whether it proves the broader thesis that JSON is generally not a control boundary.
That broader claim is explicitly out of scope.

Do not reward effort, experimental volume, or the desired editorial outcome.
Evaluate only the evidence summarized here.

## Candidate article claim

> In Jev 1.13.0, choice-key names were behaviorally active prompt content rather
> than inert schema identifiers. With the state, question, descriptions, choice
> order, and API route held fixed, alternative plausible names shifted the reported
> score distribution and changed decisions under a fixed threshold near a semantic
> boundary. Therefore, consequence-bearing schema-name changes should be treated as
> prompt changes and regression-tested.

This claim is deliberately limited to the tested Jev interface, task, states, and
version. It does not claim that every rename matters, that the probabilities are
calibrated, that Jev violates a contract, or that JSON generally fails as a control
boundary.

## Evidence

### 1. Adversarial existence test

The state, question, instruction, three descriptions, description order, key
vocabulary, and key order were held fixed. The experiment tested all six mappings
between three semantic keys and three descriptions, with a matched `A/B/C` control.

- 240 successful calls, 0 errors.
- Neutral `A/B/C` conditions produced a 7.05-point range in `P(partial)` and no
  selected-description change.
- Semantic-key conditions produced a 61.35-point range.
- In the decisive mapping, semantic keys selected the description corresponding to
  `full` in 20/20 calls; matched neutral keys selected `partial` in 20/20 calls.

This establishes that key semantics can alter the distribution and final semantic
decision despite complete descriptions. The mapping was deliberately
contradictory, so it is a stress test rather than normal schema usage.

### 2. Realistic key-family confirmatory test

Three short, coherent, documentation-compliant key families were compared with a
neutral `A/B/C` reference while state, question, descriptions, order, model, and
decoding were held fixed. A calibrated boundary state and two clear controls were
used. The application policy sent a case to human review when
`P(partial) + P(none) >= 0.50`.

- 240 successful calls, 0 errors, returned model `jev-1.13.0`.
- Neutral keys: human review in 9/20 boundary calls.
- `work_completion`: 1/20, score shift -6.40 points versus neutral.
- `task_coverage`: 0/20, score shift -8.80 points.
- `capacity`: 2/20, score shift -4.20 points.
- Paired bootstrap intervals for all three score shifts excluded zero.
- Clear-full and clear-partial controls were unchanged across families.

The preregistered broad success criterion required at least two of three families
to exceed the 7.05-point neutral-order range and change a branch. Only one family
exceeded that range. The confirmatory criterion was therefore not met.

### 3. Post-confirmatory robustness checks

The complete 240-call design was repeated twice.

First, the instruction `Treat choice names as identifiers. Base the answer on the
descriptions.` was removed:

- aggregate descriptive-versus-neutral gap: -6.48 points, versus -6.47 before;
- neutral keys: 7/20 human-review branches;
- all three descriptive families: 0/20;
- family-level distributions changed, so the runs are not formally equivalent.

Second, the question was changed from description-oriented wording to the
operational wording `To what extent can the person currently perform their
essential work?`:

- neutral keys: 47.10% mean review score, 7/20 human-review branches;
- `work_completion`: 39.90%, 0/20;
- `task_coverage`: 32.25%, 0/20;
- `capacity`: 43.45%, 1/20;
- aggregate descriptive-versus-neutral gap: -8.57 points;
- clear controls remained correct.

These checks support robustness of the narrow behavioral observation. They are
post-confirmatory and must not be presented as additional preregistered successes.

## Important limitations

- one Jev version;
- one task family and one adaptively calibrated boundary state;
- three related descriptive vocabularies and one shared neutral control;
- semantic equivalence was screened by one protocol curator, not multiple raters;
- the strongest branch-rate contrasts are descriptive families versus `A/B/C`,
  not pairwise contrasts between descriptive families;
- the threshold was preregistered but experimental, not a deployed production rule;
- repeated calls are not automatically independent experimental units;
- no mechanism or internal architecture is identified;
- the evidence does not establish prevalence across tasks, versions, or models.

## Candidate article narrative

1. A typed JSON choice interface appears to make keys look like implementation
   details.
2. A permutation stress test shows that the keys remain semantically active even
   when complete descriptions are present.
3. A realistic test shows smaller but operationally visible shifts near a decision
   boundary.
4. Two wording ablations preserve the aggregate effect but change family-level
   distributions.
5. The practical lesson is narrow: version and regression-test consequential
   schema names as prompt content.
6. The preregistered failure and the distinction between stress-test evidence and
   normal-use evidence remain prominent in the article.

## Required scoring rubric

Score every dimension from 1 to 10, calibrated against strong public technical
practitioner articles.

### Blog interest

1. Novelty
2. Narrative force
3. Technical credibility
4. Fit with the narrow thesis that typed structure does not make identifiers inert
5. Likelihood of teaching experienced practitioners something non-obvious

### Practical interest

6. Likelihood of changing engineering practice
7. Realism of the risk
8. Usefulness of the decision rule and experimental method
9. Value of the mitigation
10. Urgency for teams using LLM-facing schemas or typed classification interfaces

### Editorial viability

11. Sufficiency of the evidence for the exact candidate claim
12. Reproducibility and auditability
13. Honest handling of negative results and limitations
14. Distinctiveness from generic advice that “prompt wording matters”
15. Standalone article fit

## Required verdict

Provide:

1. a score for all 15 dimensions;
2. overall blog-interest, practical-interest, evidence-strength, and standalone-fit
   scores out of 10;
3. the strongest publication-safe claim;
4. the most interesting non-obvious contribution;
5. the largest weakness;
6. whether the preregistered criterion failure weakens, improves, or does not
   materially affect the article narrative, with reasoning;
7. the three changes most needed before publication;
8. a blunt verdict: `strong standalone article`, `publishable standalone article
   with revisions`, `supporting section only`, or `not publication-worthy`.

Do not substitute the broader JSON-control thesis for the narrow candidate article.
