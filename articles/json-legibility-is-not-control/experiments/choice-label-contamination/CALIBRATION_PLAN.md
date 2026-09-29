# Boundary-state calibration plan

Date frozen: 2026-09-27
Manifest: `calibration-states.v1.json`

The first technical pilot showed that the originally validated boundary state was
not near the preregistered application threshold. Under neutral keys its review
score, `P(partial) + P(none)`, was `0.99`; semantic families ranged from `0.96` to
`0.99`. Running 240 confirmatory calls at that ceiling would test label sensitivity
but would be structurally unable to test the registered branch-change outcome.

Before inspecting any semantic-family response on alternative states, run the five
frozen calibration states using only neutral `A/B/C` keys, five repeats each.

Select the state whose mean review score is closest to `0.50`. Ties are broken by:

1. smaller across-repeat score range;
2. lower lexical state ID.

The 25 calibration calls are excluded from confirmatory evidence. The selected text
is copied byte-for-byte into a versioned Phase A manifest. The original clear-full
and clear-partial controls remain unchanged. No semantic-key response may be used
to select the state.

## Prespecified second round

Round 1 returned review scores from `0.99` to `1.00` for every candidate. Before
running any alternative state with semantic keys, freeze a second five-state ladder
around the exact ambiguous predicate: whether every essential duty remains possible
at normal quality and pace. Use the same five repeats and the same mechanical
selection rule. If every Round 2 state remains farther than `0.20` from `0.50`, stop
and revise the outcome rather than iteratively tuning more prose.
