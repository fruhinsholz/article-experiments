# Blind Natural Choice-Naming Packet

Date: 2026-09-27

## Purpose

Independently propose natural developer-facing identifiers for a three-option
typed choice. This is a naming exercise, not an evaluation of model behavior.

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
developers. They should be natural, internally coherent, unambiguous in the context
of the question, and faithful to the distinctions in the descriptions.

## Blindness constraints

- No existing or candidate identifiers are shown.
- No experimental results are shown.
- No preferred vocabulary is suggested.
- Judges must work independently and must not inspect repository files or seek
  additional context.

## Required response

1. Propose exactly one preferred triad, mapped to `every`, `some`, and `none`.
2. Briefly explain why a developer would find the names natural and coherent.
3. Identify any residual ambiguity.
4. Do not provide alternate triads unless the preferred triad is unusable.

