# Low Boundary Contamination Summary

Provider: anthropic
Model: claude-haiku-4-5-20251001
Calls: 330
Errors: 0

Branch B instruction is fixed: `If x is low, answer BUY. Otherwise answer HOLD.` Branch B context is only `$5 gift card ad`. The ladder varies `x` from `$0` to `$1,000`.

The contamination test compares the B-only decision boundary against the same selected branch B with inactive branch A present. A neutral inactive branch uses `blue folder`; the polluting inactive branch uses `$100,000 contract`.

| Amount | B-only BUY | A neutral BUY | A contract BUY | Contract delta vs B-only |
|---:|---:|---:|---:|---:|
| $0 | 10/10 | 10/10 | 10/10 | 0/10 |
| $1 | 10/10 | 10/10 | 10/10 | 0/10 |
| $2 | 10/10 | 10/10 | 10/10 | 0/10 |
| $5 | 10/10 | 10/10 | 10/10 | 0/10 |
| $10 | 3/10 | 0/10 | 10/10 | 7/10 |
| $20 | 0/10 | 0/10 | 0/10 | 0/10 |
| $50 | 0/10 | 0/10 | 10/10 | 10/10 |
| $100 | 0/10 | 0/10 | 0/10 | 0/10 |
| $200 | 10/10 | 0/10 | 0/10 | -10/10 |
| $500 | 0/10 | 0/10 | 0/10 | 0/10 |
| $1,000 | 0/10 | 0/10 | 0/10 | 0/10 |

## Reading Rule

A rightward shift means larger `x` values still receive `BUY` when inactive branch A contains `$100,000 contract`. That is the target signal: the selected branch stays B, but the internal boundary of `low` may be shifted by inactive context.
