# Blind Natural Choice-Family Generation Results

Date: 2026-09-27

Input: `BLIND_NATURAL_CHOICE_FAMILIES_PACKET.md`

## Method

Three independent judge sessions received the same packet from
empirical-methods, technical-editorial, and senior-software-practitioner
perspectives. Each was asked for exactly three ranked, semantically distinct
families.

They were not shown:

- identifiers already used or proposed;
- experimental results;
- preferred vocabulary or semantic lenses;
- one another's responses.

The sessions were instructed not to inspect repository files or seek additional
context. These are independent AI judge sessions with assigned perspectives,
not human raters and not evidence of agreement across different model families.

## Independent responses

### Empirical-methods judge

1. Duty coverage
   - Every: `all_essential_duties`
   - Some: `some_essential_duties`
   - None: `no_essential_duties`
2. Work capability
   - Every: `fully_capable`
   - Some: `partially_capable`
   - None: `not_capable`
3. Performance extent
   - Every: `performs_all`
   - Some: `performs_some`
   - None: `performs_none`

The judge rejected health, disability, availability, willingness, and ambiguous
`full_work` / `partial_work` / `no_work` terminology.

### Technical-editorial judge

1. Duty coverage
   - Every: `all_essential_duties`
   - Some: `some_essential_duties`
   - None: `no_essential_duties`
2. Performance capability
   - Every: `can_perform_all_essential_duties`
   - Some: `can_perform_some_essential_duties`
   - None: `cannot_perform_any_essential_duties`
3. Duty requirements met
   - Every: `meets_all_duty_requirements`
   - Some: `meets_some_duty_requirements`
   - None: `meets_no_duty_requirements`

The judge rejected general-health, generic-capacity, task-completion, and
assistance-level labels as broader than the fixed meanings.

### Senior-software-practitioner judge

1. Capability statements
   - Every: `can_perform_all_essential_duties`
   - Some: `can_perform_some_essential_duties`
   - None: `cannot_perform_any_essential_duties`
2. Duty coverage
   - Every: `all_essential_duties`
   - Some: `some_essential_duties`
   - None: `no_essential_duties`
3. Work-capacity levels
   - Every: `full_essential_work_capacity`
   - Some: `limited_essential_work_capacity`
   - None: `no_essential_work_capacity`

The judge rejected bare extent labels, medicalized labels, past-completion
language, and judgmental terms.

## Convergence

Two exact families received independent support:

| Family | Exact agreement | Every | Some | None |
|---|---:|---|---|---|
| Duty coverage | 3/3 | `all_essential_duties` | `some_essential_duties` | `no_essential_duties` |
| Capability statement | 2/3 | `can_perform_all_essential_duties` | `can_perform_some_essential_duties` | `cannot_perform_any_essential_duties` |

The remaining third-ranked proposals did not converge exactly. They supply
plausible alternative semantic lenses, but should not be described as consensus.

## Pre-behavioral selection for the replication

Use these three descriptive families, selected before any behavioral result is
observed:

1. `duty_coverage`
   - `all_essential_duties`
   - `some_essential_duties`
   - `no_essential_duties`
2. `capability_statement`
   - `can_perform_all_essential_duties`
   - `can_perform_some_essential_duties`
   - `cannot_perform_any_essential_duties`
3. `work_capacity_level`
   - `full_essential_work_capacity`
   - `limited_essential_work_capacity`
   - `no_essential_work_capacity`

Keep `A` / `B` / `C` as a secondary neutral reference.

Selection rationale:

- the first family has unanimous exact support;
- the second has exact support from two judges and is the senior practitioner's
  top-ranked family;
- the third preserves a distinct level-oriented API style and was explicitly
  recommended as usable by the senior practitioner;
- all three preserve the same fixed descriptions while differing meaningfully in
  their lexical framing;
- selection occurred before testing their behavioral effects.

The other generated families remain documented as provenance, not post-result
replacements. No family should be added or removed after inspecting behavioral
results unless the change is labeled exploratory and tested in a separate run.

