# Blind Natural Choice-Family Generation Packet

Date: 2026-09-27

## Purpose

Independently generate several natural developer-facing identifier families for
a three-option typed choice. The goal is to identify names that an AI coding
assistant could plausibly recommend to a developer without exposure to an
experiment or preferred vocabulary.

This is a naming exercise, not an evaluation of model behavior.

## Context shown to every judge

The API asks:

> To what extent can the person currently perform their essential work?

The three choices have these fixed meanings, in this fixed order:

1. The person can complete every essential job duty at normal quality and pace
   without assistance.
2. The person can complete some essential job duties, but at least one essential
   duty cannot be completed at normal quality or pace.
3. The person cannot complete any essential job duty.

The identifiers will be used as short `snake_case` keys in a typed API by software
developers. Each family should be natural, internally coherent, unambiguous in the
context of the question, and faithful to the distinctions in the descriptions.

## Blindness constraints

- No existing or candidate identifiers are shown.
- No experimental results are shown.
- No preferred vocabulary or semantic lens is suggested.
- Work independently.
- Do not inspect repository files or seek additional context.
- Do not infer that unusual or adversarial names are desired.

## Required response

1. Propose exactly three usable identifier families.
2. Each family must map one identifier to `every`, one to `some`, and one to
   `none`.
3. Make the three families semantically distinct, not superficial synonym swaps.
4. Rank them from most to least likely to be recommended to a developer.
5. For each family, briefly explain why it is natural and identify any residual
   ambiguity.
6. Reject any family that would be misleading without the descriptions.
7. Do not mention or speculate about experiments, prior candidates, or expected
   model behavior.
