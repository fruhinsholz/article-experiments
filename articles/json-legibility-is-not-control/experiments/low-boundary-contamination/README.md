# Low Boundary Contamination Probe

Date: 2026-08-21

This probe tests whether inactive JSON context shifts the internal decision boundary of a vague predicate inside the selected branch.

The selected branch is always B:

```json
{
  "route_amount": "$5",
  "routing_rule": "If route_amount is low, execute branch B. Otherwise execute branch A.",
  "branches": {
    "A": {
      "instruction": "",
      "context": "$100,000 contract"
    },
    "B": {
      "instruction": "If x is low, answer BUY. Otherwise answer HOLD.",
      "context": "$5 gift card ad",
      "x": "$100"
    }
  },
  "output_rule": "Return only BUY or HOLD."
}
```

## Hypothesis

The model may select branch B correctly while using inactive branch A as a scale anchor for the word `low` inside B.

The target signal is not a single wrong answer. It is a boundary shift:

- B-only establishes the baseline `BUY`/`HOLD` curve for `$5 gift card ad`.
- inactive neutral A checks whether merely adding an unused branch changes the curve.
- inactive contract A checks whether `$100,000 contract` shifts the curve rightward.

If larger `x` values receive more `BUY` responses only when inactive A contains `$100,000 contract`, then the inactive branch has contaminated the semantic representation of `low`.

## Conditions

| Condition | Purpose |
|---|---|
| `b_only` | Baseline with branch B only |
| `inactive_a_neutral` | Adds inactive branch A with unrelated non-scale context |
| `inactive_a_contract` | Adds inactive branch A with unrelated high-money scale context |

## Ladder

Default amounts:

```text
0,1,2,5,10,20,50,100,200,500,1000
```

Each amount is run 10 times per condition by default.

## Run

```bash
npm run check:low-boundary
npm run print:low-boundary
npm run run:low-boundary:gemini
npm run run:low-boundary:codex
npm run run:low-boundary:claude
```

Live runs require:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`

Results are written under:

```text
experiments/low-boundary-contamination/results/
```

## Results

Runs on 2026-08-21 used 10 repeats per amount and condition.

### Gemini `gemini-3.5-flash-lite`

| Amount | B-only BUY | A neutral BUY | A contract BUY |
|---:|---:|---:|---:|
| $0 | 10/10 | 10/10 | 10/10 |
| $1 | 10/10 | 10/10 | 10/10 |
| $2 | 10/10 | 10/10 | 10/10 |
| $5 | 10/10 | 10/10 | 10/10 |
| $10 | 10/10 | 10/10 | 10/10 |
| $20 | 8/10 | 0/10 | 10/10 |
| $50 | 6/10 | 0/10 | 10/10 |
| $100 | 7/10 | 0/10 | 10/10 |
| $200 | 6/10 | 0/10 | 10/10 |
| $500 | 0/10 | 0/10 | 10/10 |
| $1,000 | 2/10 | 0/10 | 8/10 |

Gemini shows the cleanest target signal: neutral inactive A collapses `BUY` above `$20`, while inactive `$100,000 contract` keeps `BUY` high through `$1,000`.

### OpenAI `gpt-5.3-codex`

| Amount | B-only BUY | A neutral BUY | A contract BUY |
|---:|---:|---:|---:|
| $0 | 10/10 | 10/10 | 10/10 |
| $1 | 10/10 | 10/10 | 10/10 |
| $2 | 10/10 | 10/10 | 10/10 |
| $5 | 10/10 | 10/10 | 10/10 |
| $10 | 4/10 | 10/10 | 10/10 |
| $20 | 0/10 | 4/10 | 10/10 |
| $50 | 0/10 | 9/10 | 10/10 |
| $100 | 1/10 | 9/10 | 0/10 |
| $200 | 2/10 | 0/10 | 1/10 |
| $500 | 3/10 | 0/10 | 6/10 |
| $1,000 | 9/10 | 0/10 | 9/10 |

Codex shows instability, but not a clean monotonic boundary. The result is useful as a warning that the prompt is underspecified, less useful as a clean contamination curve.

### Anthropic `claude-haiku-4-5-20251001`

| Amount | B-only BUY | A neutral BUY | A contract BUY |
|---:|---:|---:|---:|
| $0 | 10/10 | 10/10 | 10/10 |
| $1 | 10/10 | 10/10 | 10/10 |
| $2 | 10/10 | 10/10 | 10/10 |
| $5 | 10/10 | 10/10 | 10/10 |
| $10 | 3/10 | 0/10 | 10/10 |
| $20 | 0/10 | 0/10 | 0/10 |
| $50 | 0/10 | 0/10 | 10/10 |
| $100 | 0/10 | 0/10 | 0/10 |
| $200 | 10/10 | 0/10 | 0/10 |
| $500 | 0/10 | 0/10 | 0/10 |
| $1,000 | 0/10 | 0/10 | 0/10 |

Claude shows localized contract effects at `$10` and `$50`, but also a non-monotonic B-only anomaly at `$200`.

## Interpretation

This is a useful test, but not a final publication-grade result yet. The strongest comparison is neutral inactive A vs contract inactive A, not B-only vs contract A, because the mere presence of an extra inactive branch can itself change behavior.

The cleanest result is Gemini:

```text
inactive A = blue folder:        $50, $100, $200, $500, $1000 => 0/10 BUY
inactive A = $100,000 contract:  $50, $100, $200, $500 => 10/10 BUY, $1000 => 8/10 BUY
```

That supports the intended claim: the model selected B, but the inactive branch shifted the decision boundary of `low` inside B.
