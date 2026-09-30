# Similar Enough Record Context Probe

Date: 2026-08-02

This private probe tests whether the model's implicit `similar enough` rule changes when record differences increase one step at a time, and whether the drop-off point moves when the request prompt or ambient context changes.

## Design

The model sees two synthetic records with neutral keys `field_1` through `field_10`. Pair and condition IDs are opaque UUIDs so they cannot leak experimental intent if they appear in logs or future prompt variants. Private maps keep the human-readable step and condition labels for analysis only.

Record A is fixed. Record B changes cumulatively, one attribute family at a time: exact match, first-name typo, last-name typo, address formatting, one-digit phone change, new phone number, email alias/domain change, then role/note wording drift.

The first exploratory run uses 192 calls while testing the full prompt/context grid:

```text
8 record steps x 6 conditions x 4 repeats = 192 calls
```

Conditions:

| Prompt | Ambient context |
|---|---|
| neutral similarity request | none |
| neutral similarity request | duplicate-record backlog |
| neutral similarity request | phone confirmation before merge/reuse |
| merge/reuse request | none |
| merge/reuse request | duplicate-record backlog |
| merge/reuse request | phone confirmation before merge/reuse |

This separates two effects:

- prompt effect: compare `prompt_neutral_*` against `prompt_duplicate_pressure_*` under the same ambient context
- context effect: compare `*_no_context`, `*_context_duplicate_backlog`, and `*_context_phone_capture` under the same prompt

## Signal

The important signal is a shifted drop-off point on the same ladder:

- one condition still says `same_record` while another has moved to `possible_duplicate`
- one condition still says `possible_duplicate` while another has moved to `new_record`
- stronger use of `field_5` under the phone-confirmation context

If this happens, it supports the narrow claim that `similar enough` is an interpretation sensitive to prompt and context, not a stable control boundary.

## Fixed Inputs

- `records.json`
- `conditions.json`

These files are part of the experiment fixture so future runs can reuse the same set.

## Re-run

From the repo root:

```bash
npm run check:similar-records
npm run print:similar-records
npm run run:similar-records:gemini
```

The runner writes a timestamped directory under `experiments/similar-enough-record-context/results/` with:

- `run.json`: full arguments, planned jobs, and fixed fixtures
- `calls.jsonl`: one row per model call, including prompt payload, parsed decision, key fields, usage, and latency
- `summary.json`: aggregate counts plus private analysis maps
- `summary.md`: readable aggregate table

## Subtle Temporal/Incident Probe

The second protocol keeps only two ambiguous record pairs and varies factual CRM context rather than direct decision guidance:

```text
2 record pairs x 6 contexts x 4 repeats = 48 calls
```

Re-run:

```bash
npm run check:similar-records
npm run print:similar-records:subtle
npm run run:similar-records:subtle:gpt
```

Fixed inputs:

- `records-subtle-temporal.json`
- `conditions-subtle-temporal.json`

Short prompt variant:

```bash
node src/similar-enough-record-context.mjs \
  --provider openai \
  --model gpt-5.6 \
  --records-file records-subtle-temporal.json \
  --conditions-file conditions-short-similar-person.json \
  --repeats 4 \
  --max-calls 48 \
  --label short-similar-person-context \
  --concurrency 2
```

The short prompt is:

```text
Decide whether they are similar enough to represent the same person.
```

The contexts are deliberately indirect:

| Context | Ambient note |
|---|---|
| baseline | none |
| phone_recent | The phone value on Record B was confirmed during a customer interaction earlier today. |
| phone_legacy | The phone value on Record B was imported from a legacy CRM system five years ago. |
| email_recent | The email value on Record B was updated after a support exchange last week. |
| support_incident | A recent support incident involved a customer saying they were contacted through an outdated record. |
| irreversible_merge | If these records are accepted as the same person, their histories will be merged and displayed as one customer profile. |

This protocol tests whether the same records move between `same_record` and `possible_duplicate` when the operational context changes perceived freshness, provenance, or cost, without telling the model which field to prefer.

## Current Run

Latest committed run:

`experiments/similar-enough-record-context/results/2026-08-02T15-47-29-768Z-gemini-gemini-3.5-flash-lite-similar-enough-record-context/`

Artifacts:

- `report.md`: process, interpretation, limits, and next probe
- `summary.md`: aggregate decision table
- `summary.json`: aggregate counts and analysis maps
- `calls.jsonl`: raw call records
- `run.json`: arguments, jobs, and fixtures
