# Gemini versus Jev on the Same Choice-Key Probe

Date: 2026-09-27

## Question

Does a conventional LLM exposed to the same Jev-like state, question, choice keys,
and descriptions show the same choice-key sensitivity as Jev?

## Design

The comparison reused `refined-stimuli.v4-operational-question.json`:

- identical state text;
- identical operational question;
- identical descriptions and description order;
- identical neutral and descriptive key families;
- identical 20 balanced repetitions per cell;
- identical downstream policy: review when `P(partial) + P(none) >= 0.50`.

Jev received its native choice request. Gemini `gemini-3.5-flash-lite` received the
same request object serialized in a classification prompt, with a structured-output
schema requiring a selected key and one probability estimate per key. Temperature
was zero. All 240 calls succeeded for each provider.

This is a functionally matched comparison, not a byte-identical or architecturally
controlled comparison. Gemini's probabilities are self-reported estimates and are
not calibrated or numerically equivalent to Jev scores. The response schema also
repeats the allowed keys. Comparisons of class selection and within-provider
key-family contrasts are therefore stronger than direct comparison of raw scores.

## Boundary-state results

| Provider | Key family | Mean review score | Difference vs neutral | Selected full | Selected partial | Human review |
|---|---|---:|---:|---:|---:|---:|
| Jev | `A/B/C` | 47.10% | reference | 16/20 | 4/20 | 7/20 |
| Jev | `work_completion` | 39.90% | -7.20 pp | 20/20 | 0/20 | 0/20 |
| Jev | `task_coverage` | 32.25% | -14.85 pp | 20/20 | 0/20 | 0/20 |
| Jev | `capacity` | 43.45% | -3.65 pp | 19/20 | 1/20 | 1/20 |
| Gemini | `A/B/C` | 80.75% | reference | 0/20 | 20/20 | 20/20 |
| Gemini | `work_completion` | 60.50% | -20.25 pp | 6/20 | 14/20 | 14/20 |
| Gemini | `task_coverage` | 60.25% | -20.50 pp | 6/20 | 14/20 | 14/20 |
| Gemini | `capacity` | 81.00% | +0.25 pp | 0/20 | 20/20 | 20/20 |

## Clear controls

Both providers classified every clear-full case as full and every clear-partial
case as partial across all four key families. The key effect was concentrated at
the ambiguous boundary rather than producing general task failure.

Gemini's clear-control self-reported probabilities were not perfectly saturated
under neutral keys, but its selected classes and downstream branches were correct in
all 160 clear-control calls.

## What differs

### 1. Both systems are sensitive to keys

The conventional LLM does not supply a clean identifier-neutral baseline. Two
descriptive families shifted Gemini's mean self-reported review score by about 20
points and changed its selected class from partial to full in 6/20 calls. This is a
larger within-provider movement than the corresponding Jev shifts for those two
families.

### 2. Gemini is more family-specific

Gemini reacted strongly to `work_completion` and `task_coverage` but was effectively
unchanged under `capacity`. Its boundary outputs were coarse and sometimes bimodal:
`work_completion` produced review scores of either 0.15 or 0.80. Jev shifted in the
same direction for all three descriptive families and produced a finer spread of
scores.

### 3. The baseline semantic judgment differs

Under neutral keys, Gemini chose partial in 20/20 calls, while Jev chose full in
16/20. The models therefore locate the same ambiguous state on different sides of
the semantic boundary before any key-family contrast is applied. Raw branch counts
cannot be interpreted as one system being generally more or less robust.

### 4. The operational manifestation differs

For Jev, descriptive names mostly removed human-review branches relative to a
near-threshold neutral baseline. For Gemini, two descriptive families produced six
class and branch flips, while `capacity` produced none. Jev's effect is more
directionally consistent across the three families; Gemini's is larger where it
appears but absent for one family.

## Conclusion

The matched Gemini test strengthens the narrow article in one way and limits it in
another:

- it shows that semantic activity of JSON choice keys is not unique to Jev;
- it does not establish that Jev and a conventional LLM behave equivalently;
- it does not identify Jev's internal architecture or explain why its family-level
  pattern is more consistent;
- it supports presenting Jev as a specialized, comparatively stable interface whose
  structured keys still remain prompt content, not as a system uniquely vulnerable
  to a problem absent from ordinary LLMs.

The article-safe comparison is:

> Both Jev and Gemini treated choice keys as semantic input near the tested boundary.
> Jev showed smaller but directionally consistent shifts across all three descriptive
> families; Gemini showed larger, coarser, and more vocabulary-specific changes.

## Artifacts

- Jev run:
  `results/2026-09-27T20-07-02-701Z-jev-jev-latest-refined-phase-a-operational-question/`
- Gemini run:
  `results/2026-09-27T20-52-04-636Z-gemini-gemini-3.5-flash-lite-refined-phase-a-operational-question/`

