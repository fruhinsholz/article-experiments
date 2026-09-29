# Similar Enough Context Probe

Date: 2026-08-02

This private probe tests whether the implicit threshold behind `similar enough` moves when the compared pair stays fixed and only the operational context changes.

## Question

Can a model treat the same two rules as more or less reusable depending on consequence, reversibility, and domain?

Fixed pair:

```text
A: Send a warning when usage reaches 80%.
B: Send a warning when usage reaches 95%.
```

Decision labels:

- `SAME_RULE`
- `NEEDS_REVIEW`
- `DIFFERENT_RULE`

## Conditions

The run uses one model and 100 calls total:

| Context | Calls | Variable under test |
|---|---:|---|
| `draft_grouping` | 20 | No operational consequence. |
| `internal_alert` | 20 | Reversible internal operational consequence. |
| `customer_notification` | 20 | Customer-facing consequence. |
| `billing_rule` | 20 | Money movement / billing consequence. |
| `access_rule` | 20 | Access-control consequence. |

## First Reading

The initial 100-call Gemini run shows that this exact pair is too easy: the model classified all contexts as `DIFFERENT_RULE`. That is still informative, but it does not yet prove threshold drift in the decision label.

The useful signal is in risk calibration, where the same `DIFFERENT_RULE` decision receives different risk labels across contexts. For a stronger follow-up, use a less obvious pair such as `80%` vs `83%`, `warning` vs `early warning`, or semantically similar legal/access phrases with one operationally important difference.

## Run

```bash
npm run check:similar
npm run run:similar:gemini
```

Results are written under:

```text
experiments/similar-enough-context/results/
```
