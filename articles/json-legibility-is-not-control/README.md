# JSON Legibility Is Not Control

This directory is the public evidence surface for the article's clean prospective
experiment.

## Main result

In 720 valid Jev 1.13.0 calls, changing only the model-facing key family from an
explicit prevention scale to an impediment framing produced:

- +6.88 percentage points in the primary review score;
- a complete-block bootstrap 95% interval of [+5.63, +8.13] points;
- +25.00 percentage points in the primary human-review rate;
- 240/240 correct clear-state guardrail routes;
- a supported decision under all six frozen criteria.

The two families are coherent alternative framings of one typed application
domain. They are not synonyms. The study is a controlled existence result, not a
production prevalence estimate.

## Layout

- [`current/`](current/): preregistration, frozen stimuli, raw run, analysis, and
  runnable code for the article result
- [`archive/pre-prospective-development/`](archive/pre-prospective-development/):
  earlier pilots, calibrations, follow-ups, and review packets, all excluded from
  the prospective estimate and success decision

## Verify the published analysis

From this directory:

```bash
npm run check
npm run verify
```

No API key is needed to verify the preserved run. A new live run requires
`JEV_API_KEY` and incurs provider calls.
