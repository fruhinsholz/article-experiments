# Blocking-language key-family pilot

Date frozen: 2026-09-28

## Purpose

Test whether three natural blocking/prevention framings change Jev's distribution
over the same fixed choice descriptions. This is an exploratory extension of the
blind natural-key replication, not part of its preregistered confirmatory evidence.

## Invariants

- Same six states as the completed replication.
- Same operational question.
- Same three descriptions and semantic order.
- Same application threshold: review when `P(partial) + P(none) >= 0.5`.
- Same Jev endpoint and requested model alias.
- Only the three choice keys vary between families.

## Families

Contemporaneous references:

- `A / B / C`
- `all_essential_duties / some_essential_duties / no_essential_duties`
- `full_essential_work_capacity / limited_essential_work_capacity / no_essential_work_capacity`

New proposed families:

- `essential_work_unimpeded / essential_work_impeded / essential_work_halted`
- `no_essential_duty_prevented / some_essential_duties_prevented / all_essential_duties_prevented`
- `essential_work_not_blocked / essential_work_partially_blocked / essential_work_fully_blocked`

## Design

- Five complete balanced blocks.
- Six states times six families times five blocks: 180 calls.
- Seed: `28092026`.
- Results are descriptive. No formal confirmatory criterion is declared after
  seeing earlier family results.

## Predictions recorded before execution

1. The three blocking/prevention families will assign more probability to
   `partial + none` than `duty_coverage` on boundary states.
2. `duty_prevention` and `essential_work_blockage` may behave similarly because
   both encode an explicit ordered impairment scale.
3. It is uncertain whether any new family will differ materially from
   `work_capacity_level`.
4. Clear full and clear partial controls should remain stable.
