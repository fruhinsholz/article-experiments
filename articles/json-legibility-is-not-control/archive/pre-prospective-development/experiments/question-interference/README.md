# Question interference

## Question

Does adding or reordering neighboring questions change a model's answer to an unchanged first question?

The shared state is constant:

```json
{
  "message": "My computer is broken, but I can access the system from my phone."
}
```

The target question is constant:

> Does the customer currently have no usable workaround?

The neutral semantic neighboring question is:

> Can the customer perform all necessary work from the phone?

The oriented semantic neighboring question is:

> Is the limited phone experience an acceptable workaround for the customer right now?

The complaint question is:

> Is the customer also complaining about the phone experience?

The word `limited` presupposes degraded phone capability that is absent from the state. The test measures whether that presupposition changes Q1 even though Q1 and the state remain unchanged.

## Conditions

- `q1_only`
- `q1_then_neutral`
- `neutral_then_q1`
- `q1_then_oriented`
- `oriented_then_q1`

Gemini is required to return a Jev-like `noul` value between 0 and 1 for each question. The structured output schema always places Q1 first, even when Q2 appears first in the input. This reduces, but cannot eliminate, the confound from autoregressive answer generation.

## Run

```bash
npm run check:question-interference
npm run print:question-interference
npm run run:question-interference:gemini
npm run run:question-interference:gemini:bare
npm run run:question-interference:jev
npm run run:question-interference:q3:gemini
npm run run:question-interference:q3:jev
```

Required environment variable:

- `GEMINI_API_KEY`
- `JEV_API_KEY` or `jev_api_key` for Jev. If neither is already set, the runner reads
  `jev_api_key` directly from Infisical project `homelab`, environment `prod`, path `/`,
  using the machine identity in `/etc/openclaw/infisical-admin.env`.

## Interpretation limits

- Gemini's self-reported `noul` is not a calibrated probability and is not equivalent to Jev's score.
- The `criteria` mode tests a tightly defined predicate. The `bare` mode uses only the question text and therefore leaves `usable` and `acceptable` implicit.
- A changed score demonstrates prompt-level question interaction in this setup, not a universal architectural property.
- An unchanged score in this small pilot does not establish independence.
- Both neighboring questions are semantically related to Q1. This experiment compares a neutral capability question with an oriented acceptability question; it does not include an unrelated length control.

## Revised ambiguous-state results

Model: `gemini-3.5-flash-lite`, temperature `0`.

### Bare questions, 20 repetitions per condition

| Condition | Mean Q1 `noul` | Non-zero Q1 |
|---|---:|---:|
| `q1_only` | 0.000 | 0/20 |
| `q1_then_neutral` | 0.015 | 3/20 |
| `neutral_then_q1` | 0.000 | 0/20 |
| `q1_then_oriented` | 0.010 | 2/20 |
| `oriented_then_q1` | 0.115 | 13/20 |

Results: `results/2026-09-27T05-19-45-714Z-gemini-gemini-3.5-flash-lite-access-phone-bare-r20/`

### Bare questions replication, 50 repetitions per condition

| Condition | Mean Q1 `noul` | Range |
|---|---:|---:|
| `q1_only` | 0.000 | 0.0 |
| `q1_then_neutral` | 0.006 | 0.0-0.1 |
| `neutral_then_q1` | 0.012 | 0.0-0.2 |
| `q1_then_oriented` | 0.016 | 0.0-0.2 |
| `oriented_then_q1` | 0.062 | 0.0-0.2 |

Results: `results/2026-09-27T05-20-14-569Z-gemini-gemini-3.5-flash-lite-access-phone-bare-r50/`

Across the two bare runs, Q1 was non-zero in `31/70` calls when the oriented question came first, compared with `0/70` for Q1 alone. Its combined mean moved from `0.000` to `0.077`. When the oriented question followed Q1, Q1 was non-zero in `9/70` calls and its combined mean was `0.014`.

This is direct evidence of question interaction in this prompt. It is order-sensitive: the strongest change occurs when the presupposition in `limited phone experience` appears before Q1 in the input. The output schema still requests Q1 first, so this is not explained merely by Q2's answer being generated first.

### Explicit criteria, 50 repetitions per condition

| Condition | Mean Q1 `noul` | Non-zero Q1 |
|---|---:|---:|
| `q1_only` | 0.000 | 0/50 |
| `q1_then_neutral` | 0.002 | 1/50 |
| `neutral_then_q1` | 0.044 | 11/50 |
| `q1_then_oriented` | 0.000 | 0/50 |
| `oriented_then_q1` | 0.000 | 0/50 |

Results: `results/2026-09-27T05-20-48-298Z-gemini-gemini-3.5-flash-lite-access-phone-criteria-r50/`

Explicit criteria suppress the bare prompt's oriented-question effect. A different interaction appears when the neutral capability question comes first. This means the result should be framed as sensitivity to neighboring question semantics and order, not as a general effect caused by the word `limited` alone.

## Jev replication

Model returned by the API: `jev-1.13.0`. The request used `jev-latest` and the same
bare state and question sets as the Gemini bare runs.

### Pilot, 20 repetitions per condition

| Condition | Mean Q1 `noul` | Range | Delta vs Q1 only |
|---|---:|---:|---:|
| `q1_only` | 0.0420 | 0.04-0.05 | 0.0000 |
| `q1_then_neutral` | 0.0420 | 0.04-0.05 | 0.0000 |
| `neutral_then_q1` | 0.0440 | 0.04-0.05 | +0.0020 |
| `q1_then_oriented` | 0.0415 | 0.04-0.05 | -0.0005 |
| `oriented_then_q1` | 0.0425 | 0.04-0.05 | +0.0005 |

Results: `results/2026-09-27T09-32-31-610Z-jev-jev-latest-access-phone-bare-jev-pilot-r20/`

### Replication, 100 repetitions per condition

| Condition | Mean Q1 `noul` | Range | Delta vs Q1 only |
|---|---:|---:|---:|
| `q1_only` | 0.0418 | 0.04-0.05 | 0.0000 |
| `q1_then_neutral` | 0.0419 | 0.04-0.05 | +0.0001 |
| `neutral_then_q1` | 0.0424 | 0.04-0.05 | +0.0006 |
| `q1_then_oriented` | 0.0419 | 0.04-0.05 | +0.0001 |
| `oriented_then_q1` | 0.0419 | 0.04-0.05 | +0.0001 |

Results: `results/2026-09-27T09-32-46-359Z-jev-jev-latest-access-phone-bare-jev-replication-r100/`

All 600 Jev calls succeeded. In the replication, Q1 only took the values `0.04`
and `0.05`. The largest mean shift was `+0.0006` when the neutral question came
first; the oriented question produced only `+0.0001` in either order. The pilot's
larger neutral-first shift did not persist at the same magnitude.

This is a negative result for material question interference in Jev on this probe.
It supports question-level stability for this particular state, predicate, model,
and API version. It does not prove architectural isolation, and it should not be
read as a calibrated comparison between Jev `noul` and Gemini's self-reported
score. The strongest Gemini bare condition moved Q1 by `+0.077` across its two
runs; the corresponding Jev condition moved by `+0.0001` in the 100-repeat
replication.

## Complaint-question extension

This extension keeps Q2 after Q1 and moves only Q3 across Q1:

- `q1_only`
- `q1_then_oriented_then_complaint`: Q1, Q2, Q3
- `complaint_then_q1_then_oriented`: Q3, Q1, Q2

The state, question wording, bare mode, and model settings otherwise remain unchanged.
Each condition used 100 repetitions.

### Gemini

Model: `gemini-3.5-flash-lite`, temperature `0`.

| Condition | Mean Q1 `noul` | Non-zero Q1 | Q1 values |
|---|---:|---:|---|
| `q1_only` | 0.000 | 0/100 | 100 x 0.0 |
| `q1_then_oriented_then_complaint` | 0.010 | 10/100 | 90 x 0.0, 10 x 0.1 |
| `complaint_then_q1_then_oriented` | 0.015 | 15/100 | 85 x 0.0, 15 x 0.1 |

Q3 itself averaged `0.009` when it followed Q1 and Q2, and `0.000` when it
preceded them. Gemini therefore remained order-sensitive. However, the historical
Gemini result for Q1 followed by the oriented Q2 alone was `0.014` across 70 runs.
The new `0.010` and `0.015` means do not establish an incremental Q3 effect beyond
the already observed neighboring-question interaction.

Results: `results/2026-09-27T09-40-14-512Z-gemini-gemini-3.5-flash-lite-access-phone-q3-complaint-r100/`

### Jev

Requested model: `jev-latest`; API model: `jev-1.13.0`.

| Condition | Mean Q1 `noul` | Range | Delta vs Q1 only |
|---|---:|---:|---:|
| `q1_only` | 0.0419 | 0.04-0.05 | 0.0000 |
| `q1_then_oriented_then_complaint` | 0.0411 | 0.04-0.05 | -0.0008 |
| `complaint_then_q1_then_oriented` | 0.0421 | 0.04-0.05 | +0.0002 |

Q3 averaged `0.0634` when it followed Q1 and Q2 and `0.0633` when it preceded
them. The Q1 and Q3 shifts are negligible at this resolution. This extends the
negative result for material question interference in Jev to the complaint
presupposition, but still does not prove architectural isolation.

Results: `results/2026-09-27T09-41-19-173Z-jev-jev-latest-access-phone-q3-complaint-r100/`

## Initial saturated-state results

The earlier version used this stronger state:

> My computer is broken, but I can continue working from my phone.

That wording largely answered Q1 in advance and made it a weak interference probe.

### Explicit criteria, 5 repetitions per condition

Q1 returned `0.00` in all 25 calls. Adding or reordering Q2 produced no measurable shift.

Results: `results/2026-09-27T05-10-54-855Z-gemini-gemini-3.5-flash-lite-question-interference-pilot/`

### Bare questions, 20 repetitions per condition

| Condition | Mean Q1 `noul` | Non-zero Q1 |
|---|---:|---:|
| `q1_only` | 0.00 | 0/20 |
| `q1_then_q2` | 0.01 | 2/20, both `0.10` |
| `q2_then_q1` | 0.00 | 0/20 |
| `q1_then_neutral` | 0.00 | 0/20 |
| `neutral_then_q1` | 0.00 | 0/20 |

Results: `results/2026-09-27T05-12-28-721Z-gemini-gemini-3.5-flash-lite-question-interference-bare-r20/`

Interpretation: the saturated prompt was mostly a negative result. The revised state moves the prompt closer to the semantic boundary and exposes order-sensitive question interaction. The next stronger test should use preregistered paraphrase families and compare Gemini with Jev under the same question sets.
