# Subtle Temporal CRM Context Probe Report

Date: 2026-08-02

Provider: OpenAI
Model: gpt-5.6
Calls: 48
Errors: 0

## Purpose

This run tests a narrower question than the first 192-call ladder:

> With the same ambiguous CRM records, can subtle operational context change whether a model treats them as the same customer or as a possible duplicate?

The goal is not to force a `new_record` decision. The useful signal is a shift from `same_record` to `possible_duplicate`, or a confidence drop, while the record fields stay fixed.

## Method

The run uses:

```text
2 record pairs x 6 contexts x 4 repeats = 48 calls
```

The model sees neutral field names (`field_1` through `field_10`) and opaque pair/condition UUIDs. Human-readable maps live only in `run.json` and `summary.json`.

The request prompt is constant:

```text
Compare Record A and Record B. Decide whether they are similar enough to represent the same person. Base the decision only on the two records.
```

The two record pairs are:

| Pair | Changed fields |
|---|---|
| step 4 | name typo, last-name typo, address formatting, one-digit phone change |
| step 6 | name typo, last-name typo, address formatting, new phone, email alias/domain change |

The six contexts are:

| Context | Ambient note |
|---|---|
| baseline | none |
| phone_recent | The phone value on Record B was confirmed during a customer interaction earlier today. |
| phone_legacy | The phone value on Record B was imported from a legacy CRM system five years ago. |
| email_recent | The email value on Record B was updated after a support exchange last week. |
| support_incident | A recent support incident involved a customer saying they were contacted through an outdated record. |
| irreversible_merge | If these records are accepted as the same person, their histories will be merged and displayed as one customer profile. |

## Results

| Pair | Context | same_record | possible_duplicate | new_record | Confidence |
|---|---|---:|---:|---:|---|
| step 4 | baseline | 4/4 | 0/4 | 0/4 | 4 high |
| step 4 | phone_recent | 4/4 | 0/4 | 0/4 | 4 high |
| step 4 | phone_legacy | 4/4 | 0/4 | 0/4 | 4 high |
| step 4 | email_recent | 4/4 | 0/4 | 0/4 | 4 high |
| step 4 | support_incident | 4/4 | 0/4 | 0/4 | 4 high |
| step 4 | irreversible_merge | 4/4 | 0/4 | 0/4 | 4 high |
| step 6 | baseline | 3/4 | 1/4 | 0/4 | 4 high |
| step 6 | phone_recent | 3/4 | 1/4 | 0/4 | 3 high, 1 medium |
| step 6 | phone_legacy | 3/4 | 1/4 | 0/4 | 4 high |
| step 6 | email_recent | 3/4 | 1/4 | 0/4 | 4 high |
| step 6 | support_incident | 1/4 | 3/4 | 0/4 | 4 high |
| step 6 | irreversible_merge | 2/4 | 2/4 | 0/4 | 4 high |

## Interpretation

The step 4 pair is too easy. GPT-5.6 treats it as the same record in every condition. That is useful as a control: the subtle contexts did not arbitrarily destabilize a strong match.

The step 6 pair is the useful zone. The records are still close enough that the baseline mostly says `same_record` (`3/4`), but the support-incident context shifts the same records to mostly `possible_duplicate` (`3/4`). The irreversible-merge context also moves the result, but less strongly (`2/4` possible duplicate).

The temporal phone and email contexts are weaker than expected. `phone_recent`, `phone_legacy`, and `email_recent` do not materially change the decision distribution on this record pair. `phone_recent` produces one medium-confidence `same_record`, but the decision label remains unchanged.

Main finding:

> Subtle context can move GPT-5.6's implicit `similar enough` boundary, but the strongest effect in this small run comes from a recent support incident, not from phone/email freshness alone.

This is a better article-facing example than the first phone-confirmation prompt because it does not directly instruct the model to prioritize or distrust a field. It changes the operational situation around the same data.

## Limits

- This is a small run: 48 calls, one model.
- It tests two record pairs only.
- The model never selected `new_record`; this is about uncertainty and review routing, not hard identity rejection.
- Some outputs report `high` confidence even when choosing `possible_duplicate`, so confidence should be treated as secondary.
- The support incident may still be read as risk framing, but it is less direct than telling the model how to treat the phone field.

## Article Use

Use this cautiously as a short CRM example:

> In a small private CRM probe, the same ambiguous records were usually classified as the same customer under a neutral prompt. When the surrounding context mentioned a recent support incident involving an outdated record, GPT-5.6 shifted mostly toward `possible_duplicate`. The records did not change; the operational frame did.

Do not present this as a broad benchmark or proof that all models behave this way. Its value is illustrative: it makes the control-boundary problem concrete.
