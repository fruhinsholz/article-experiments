# Preregistration: blind natural-key replication

Date frozen: 2026-09-27

## Purpose

Test whether three independently generated, plausible choice-key families change
Jev's decision distribution while state, operational question, descriptions,
description order, serialization, model request, threshold, and API route remain
fixed. `A/B/C` is a secondary neutral reference.

## Calibration and state selection

The calibration manifest is `replication-calibration-states.v1.json`. It contains
12 ordered states and only the neutral `A/B/C` family. Run 10 balanced blocks.

Select the four states whose mean review score, `P(partial) + P(none)`, is closest
to `0.50`, subject to the prespecified interval `[0.35, 0.65]`. Break an exact tie
by manifest order. If fewer than four states fall inside the interval, select all
inside it and then the nearest remaining states by absolute distance from `0.50`.

Add two guardrails without further calibration:

- `clear_full`: the explicit-normal state `r00_explicit_normal`;
- `clear_partial`: the explicit-partial state `r11_explicit_partial`.

No descriptive key family is evaluated during calibration.

## Replication design

Cross six selected states with the four key families frozen in
`replication-key-families.v1.json`. Run 20 complete balanced blocks, for 480 calls.
Shuffle cell order with seed `27092032`. Use `jev-latest`, record the returned
version, preserve raw requests and responses, and retry only HTTP 429, 503, or 529
up to three times.

The operational question is:

> To what extent can the person currently perform their essential work?

No instruction tells the model how to treat choice names.

## Primary comparisons and criterion

The primary comparisons are all three pairwise contrasts among the descriptive
families. `A/B/C` is secondary.

For each descriptive-family contrast, calculate the paired block difference in
review score for every state. A contrast succeeds when:

1. it has the same non-zero direction in at least three of the four boundary
   states;
2. its aggregate paired-block 95% bootstrap interval across boundary states
   excludes zero; and
3. it changes the application branch in at least one boundary state.

Report effects by state, intervals, selected semantic classes, and branch changes.
Treat balanced blocks and states as inference units, not 480 independent samples.
The clear states are guardrails and do not contribute to the success criterion.

The run ends after this replication regardless of outcome.
