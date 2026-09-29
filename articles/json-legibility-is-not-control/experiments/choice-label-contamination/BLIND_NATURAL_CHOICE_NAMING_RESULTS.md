# Blind Natural Choice-Naming Results

Date: 2026-09-27

Input: `BLIND_NATURAL_CHOICE_NAMING_PACKET.md`

## Method

Three judges received the same naming packet independently from
empirical-methods, technical-editorial, and senior-practitioner perspectives.
They were shown only the operational question, the three fixed descriptions,
and the requirement to propose one natural `snake_case` triad for a typed API.

They were not shown:

- any identifiers previously tested;
- any identifiers proposed by the experiment author;
- any experimental results;
- one another's responses.

These are three independent judge sessions with different assigned perspectives,
not three human raters or evidence of agreement across three distinct model
families.

## Responses

### Empirical-methods judge

- Every: `all_essential_duties`
- Some: `some_essential_duties`
- None: `no_essential_duties`

Rationale: short, natural, internally parallel, and directly aligned with the
quantified distinction in the descriptions.

Residual ambiguity: the identifiers do not encode normal quality and pace without
assistance; that criterion remains dependent on the descriptions.

### Technical-editorial judge

- Every: `all_essential_duties`
- Some: `some_essential_duties`
- None: `no_essential_duties`

Rationale: short, parallel, natural identifiers that preserve the defining concept
of essential duties and map directly to the three extents.

Residual ambiguity: the keys omit explicit ability language, so outside the
enclosing question they could describe sets of duties rather than performance
capability.

### Senior-practitioner judge

- Every: `all_essential_duties`
- Some: `some_essential_duties`
- None: `no_essential_duties`

Rationale: concise, parallel, and directly mapped to the quantified distinction in
the fixed meanings. In the question context, the keys naturally denote which
essential duties the person can currently perform.

Residual ambiguity: the identifiers do not independently encode normal quality and
pace without assistance; that constraint remains defined by the API descriptions.

## Consensus

All three judges independently proposed the same triad:

| Meaning | Preferred identifier |
|---|---|
| Every essential duty | `all_essential_duties` |
| Some essential duties | `some_essential_duties` |
| No essential duties | `no_essential_duties` |

This triad is a strong candidate for the final replication because the vocabulary
was generated without exposure to the existing key families or to experimental
outcomes. Its remaining limitation is explicit: the identifiers rely on the fixed
descriptions for the normal-quality, normal-pace, and no-assistance criteria.

