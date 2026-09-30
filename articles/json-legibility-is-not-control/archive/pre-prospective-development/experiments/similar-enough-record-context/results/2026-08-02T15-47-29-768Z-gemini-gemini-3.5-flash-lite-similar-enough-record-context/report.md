# Similar Enough Record Context Run Report

Date: 2026-08-02

Provider: `gemini`

Model: `gemini-3.5-flash-lite`

Run directory:

`experiments/similar-enough-record-context/results/2026-08-02T15-47-29-768Z-gemini-gemini-3.5-flash-lite-similar-enough-record-context`

## Reproduction

From the repository root:

```bash
npm run check:similar-records
npm run print:similar-records
npm run run:similar-records:gemini
```

Equivalent explicit command:

```bash
node src/similar-enough-record-context.mjs \
  --provider gemini \
  --model gemini-3.5-flash-lite \
  --repeats 4 \
  --max-calls 200
```

## Fixed Fixtures

Inputs are fixed in:

- `experiments/similar-enough-record-context/records.json`
- `experiments/similar-enough-record-context/conditions.json`

The model sees neutral field names only: `field_1` through `field_10`.

Pair and condition IDs are opaque UUIDs. Human-readable maps are included only for analysis in `run.json` and `summary.json`.

## Design

The run uses a cumulative record ladder:

```text
8 record steps x 6 prompt/context conditions x 4 repeats = 192 calls
```

Record A is fixed. Record B changes one attribute family at a time:

| Step | Change |
|---:|---|
| 0 | exact same record |
| 1 | first-name typo |
| 2 | first-name typo plus last-name typo |
| 3 | prior changes plus address formatting |
| 4 | prior changes plus one-digit phone change |
| 5 | prior changes plus new phone number |
| 6 | prior changes plus email alias/domain change |
| 7 | prior changes plus role/note wording drift |

The six conditions are:

| Prompt | Ambient context |
|---|---|
| neutral | none |
| neutral | duplicate backlog |
| neutral | phone confirmation |
| duplicate-pressure | none |
| duplicate-pressure | duplicate backlog |
| duplicate-pressure | phone confirmation |

The phone confirmation context is:

```text
Operational note: When merging or reusing a customer record, make sure the current phone number is confirmed so the team can reach the person. Ask: "Is it still the best number to reach out?"
```

## Results

Calls: `192`

Errors: `0`

No response selected `new_record`.

The main movement is between `same_record` and `possible_duplicate`.

### Neutral Prompt

Without ambient context, the neutral prompt remains permissive until step 6:

```text
steps 0-5: same_record 4/4
step 6: same_record 3/4, possible_duplicate 1/4
step 7: same_record 2/4, possible_duplicate 2/4
```

With duplicate backlog context, the model becomes even more permissive at the last step:

```text
step 7: same_record 4/4
```

With phone confirmation context, the drop-off moves earlier:

```text
step 6: possible_duplicate 4/4
step 7: same_record 2/4, possible_duplicate 2/4
```

### Duplicate-Pressure Prompt

The duplicate-pressure prompt changes the rule, but not monotonically.

Without ambient context:

```text
step 2: same_record 3/4, possible_duplicate 1/4
step 4: possible_duplicate 4/4
step 5: same_record 4/4
step 6: possible_duplicate 4/4
step 7: possible_duplicate 4/4
```

With duplicate backlog context:

```text
step 2: same_record 2/4, possible_duplicate 2/4
steps 3-5: same_record 4/4
step 6: possible_duplicate 4/4
step 7: same_record 1/4, possible_duplicate 3/4
```

With phone confirmation context:

```text
step 2: possible_duplicate 4/4
step 3: same_record 4/4
steps 4-7: possible_duplicate 4/4
```

## Interpretation

The run supports a narrow exploratory claim:

`similar enough` is not applied as a fixed control rule. The same record ladder receives different decisions depending on request wording and ambient operational context.

The clearest context effect is the phone confirmation note. It shifts several cases from `same_record` to `possible_duplicate`, especially once phone and email diverge.

The duplicate backlog context mostly pushes toward reuse, but the effect is not perfectly monotonic. That instability is itself useful: the prompt/context can move the threshold, but not as a deterministic rule.

## Limits

This run is exploratory, not proof.

Main limits:

- only 4 repeats per cell
- one model
- synthetic records
- no `new_record` decisions, so the ladder is still too conservative
- step 5 reverting to `same_record` under some duplicate-pressure conditions suggests the model treats a changed phone number as compatible with the same person when other fields remain stable

## Next Probe

Use the same harness, but extend the ladder past step 7:

- company drift
- city drift
- address number drift
- last name replacement rather than typo
- shared phone with different name/address household collision

Target confirmation run:

```text
12 steps x 6 conditions x 5 repeats = 360 calls
```

That should reveal whether context also shifts the boundary into `new_record`, not only `same_record` versus `possible_duplicate`.
