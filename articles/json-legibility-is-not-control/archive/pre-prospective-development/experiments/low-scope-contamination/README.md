# Low Scope Contamination Probe

Date: 2026-08-21

This probe tests whether an inactive JSON branch can shift the meaning of a repeated vague term inside the selected branch.

The payload shape is:

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
      "context": "Personal flower gift budget. Normal flower gifts cost $50 to $150. A $5,000 flower gift is extremely expensive.",
      "x": "$5,000"
    }
  },
  "output_rule": "Return only BUY or HOLD."
}
```

## Hypothesis

Local branch-B reading: `$5,000` is not low for the calibrated flower-gift context, so the expected output is `HOLD`.

Cross-scope/global reading: `$5,000` may look low next to a `$100,000 contract`, so the output may shift to `BUY`.

The target is not direct instruction leakage. It is whether JSON branch labels provide reliable local semantic scope for a vague predicate before generation.

## Conditions

| Condition | Purpose |
|---|---|
| `b_only_same_word` | Baseline with branch B only |
| `inactive_a_same_word` | Branch A contains `$100,000 contract`; routing and B both use `low` |
| `inactive_a_different_word` | Branch A contains `$100,000 contract`; routing uses `small`, B uses `low` |
| `inactive_a_explicit_scope` | Same as `inactive_a_same_word`, plus explicit local-scope rule |

## Reading Rule

`HOLD` means the model interpreted `low` inside branch B using B's local calibrated flower-gift context.

`BUY` means the larger contract frame, repeated word, or global prompt context likely shifted the local branch decision.

## Run

```bash
npm run check:low-scope
npm run print:low-scope
npm run run:low-scope:gemini
npm run run:low-scope:codex
npm run run:low-scope:claude
```

Live runs require:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`

Results are written under:

```text
experiments/low-scope-contamination/results/
```

## Pilot Results

Raw first pass on 2026-08-21 used only `$5,000 flower gift` as branch-B context. It was not a clean test because Codex answered `BUY` even in the B-only baseline, and Claude needed more output budget to reach the final token.

Calibrated pilot on 2026-08-21 used explicit branch-B local context:

```text
Personal flower gift budget. Normal flower gifts cost $50 to $150. A $5,000 flower gift is extremely expensive.
```

Results:

| Model | B-only | A same-word | A different-word | A explicit-scope |
|---|---:|---:|---:|---:|
| Gemini `gemini-3.5-flash-lite` | `10/10 HOLD` | `7/10 HOLD`, `3/10 BUY` | `10/10 HOLD` | `9/10 HOLD`, `1/10 BUY` |
| Codex/OpenAI `gpt-5.3-codex` | `10/10 HOLD` | `10/10 HOLD` | `10/10 HOLD` | `10/10 HOLD` |
| Claude `claude-haiku-4-5-20251001` | `10/10 HOLD` | `10/10 HOLD` | `10/10 HOLD` | `10/10 HOLD` |

Interpretation: the calibrated prompt produced a measurable same-word cross-scope effect in Gemini only. Codex and Claude respected the local branch-B context for this prompt.
