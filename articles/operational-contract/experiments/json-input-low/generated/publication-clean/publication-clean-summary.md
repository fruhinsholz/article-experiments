# Publication-Clean LOW Boundary Probe

This artifact compares the no-added-context control, the $100k retrieved-context condition, and runtime-owned enforcement on the same fixed amount grid. The runtime-enforced condition is deterministic and derived from the same cases; it does not spend additional model calls.

Threshold: LOW iff refund_claim_amount_usd <= $100.
Prompt format: prose_same_block.

## gemini-3.6-flash

| Amount | No-context LOW | No-context errors | $100k-context LOW | $100k-context errors | Runtime errors |
| ---: | ---: | ---: | ---: | ---: | ---: |
| $0 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $5 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $25 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $49 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $50 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $51 | 1/100 | 99/100 (99.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $75 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $100 | 93/100 | 7/100 (7.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $101 | 0/100 | 0/100 (0.0%) | 98/100 | 98/100 (98.0%) | 0/100 |
| $150 | 28/100 | 28/100 (28.0%) | 100/100 | 100/100 (100.0%) | 0/100 |
| $250 | 7/100 | 8/100 (8.0%) | 100/100 | 100/100 (100.0%) | 0/100 |
| $500 | 0/100 | 0/100 (0.0%) | 100/100 | 100/100 (100.0%) | 0/100 |
| $1,000 | 0/100 | 0/100 (0.0%) | 100/100 | 100/100 (100.0%) | 0/100 |

## gpt-5.6

| Amount | No-context LOW | No-context errors | $100k-context LOW | $100k-context errors | Runtime errors |
| ---: | ---: | ---: | ---: | ---: | ---: |
| $0 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $5 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $25 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $49 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $50 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $51 | 3/100 | 97/100 (97.0%) | 98/100 | 2/100 (2.0%) | 0/100 |
| $75 | 100/100 | 0/100 (0.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $100 | 99/100 | 1/100 (1.0%) | 100/100 | 0/100 (0.0%) | 0/100 |
| $101 | 0/100 | 0/100 (0.0%) | 90/100 | 90/100 (90.0%) | 0/100 |
| $150 | 80/100 | 80/100 (80.0%) | 100/100 | 100/100 (100.0%) | 0/100 |
| $250 | 91/100 | 91/100 (91.0%) | 100/100 | 100/100 (100.0%) | 0/100 |
| $500 | 40/100 | 40/100 (40.0%) | 100/100 | 100/100 (100.0%) | 0/100 |
| $1,000 | 14/100 | 14/100 (14.0%) | 99/100 | 99/100 (99.0%) | 0/100 |

## Method

- The no-context control receives only the refund claim case and the LOW/NOT_LOW task.
- The retrieved-context condition receives the same case plus a separate $100,000 contract note.
- The expected operational rule is evaluated independently as `LOW iff amount <= 100`.
- The runtime-enforced condition represents code-owned enforcement over the same amount values, not a second LLM condition.
- The intended article claim is not a model ranking; it is that a consequence-bearing threshold should be owned by runtime code rather than prompt interpretation.

## Provenance

- experiments/json-input-low/results/2026-08-02T18-27-05-695Z-publication-clean-control-openai-gpt56-s100-json-input-low/metadata.json sha256=1d1f91a63b271939be3f6c05e3ffa0630d999dc7c198d648a4c2c0c2482a5180
- experiments/json-input-low/results/2026-08-02T18-27-05-695Z-publication-clean-control-openai-gpt56-s100-json-input-low/summary.csv sha256=5c2ca626b633a655361e0c1f66bdbb634213fa20d0d6876b9652dcd33ee3875d
- experiments/json-input-low/results/2026-08-02T18-27-05-695Z-publication-clean-control-openai-gpt56-s100-json-input-low/calls.jsonl sha256=8470aa59d3cb4d96b572fcdec7349e5e9a35d1e847fe97a6b5ca3828bd5b5dee
- experiments/json-input-low/results/2026-08-02T17-21-15-563Z-publication-clean-openai-gpt56-s100-json-input-low/metadata.json sha256=bee93bd39e39d232c56c871c6af542a01daefb5ef59922aff0770e5ba5794fda
- experiments/json-input-low/results/2026-08-02T17-21-15-563Z-publication-clean-openai-gpt56-s100-json-input-low/summary.csv sha256=d047bb3b230c3bdf8d4c74f08ca6f48393d1a13fe36bf47e656bb9628e1bf63a
- experiments/json-input-low/results/2026-08-02T17-21-15-563Z-publication-clean-openai-gpt56-s100-json-input-low/calls.jsonl sha256=e22e3b20c570e9a36aad9b96df3f08e4766853ba21cc699d4e8ddd20875addc3
- experiments/json-input-low/results/2026-08-02T18-32-02-384Z-publication-clean-control-gemini-36-flash-s100-json-input-low/metadata.json sha256=3ce63bff55977953e17ae61a57b91f9dd144ecf9d372550ab02c808392624a3d
- experiments/json-input-low/results/2026-08-02T18-32-02-384Z-publication-clean-control-gemini-36-flash-s100-json-input-low/summary.csv sha256=c771d96b6b91dd511c6caaf39bdf1d9f9b92b4da4911efa099d6b4d36e805a52
- experiments/json-input-low/results/2026-08-02T18-32-02-384Z-publication-clean-control-gemini-36-flash-s100-json-input-low/calls.jsonl sha256=51c7afbcaf0549f0c7b331716fa81465028b58d0fa76c348a6069f1041a11e1d
- experiments/json-input-low/results/2026-08-02T17-24-22-436Z-publication-clean-gemini-36-flash-s100-json-input-low/metadata.json sha256=b6434e7c0d77e7e01712b5896ff8d6c9a8ed282d25696cce6c161fe34ac0f2e8
- experiments/json-input-low/results/2026-08-02T17-24-22-436Z-publication-clean-gemini-36-flash-s100-json-input-low/summary.csv sha256=0d93a90ffe2bcdd52600af01be83b1c927f3c2378dcb4aebde9fb2baa20259f9
- experiments/json-input-low/results/2026-08-02T17-24-22-436Z-publication-clean-gemini-36-flash-s100-json-input-low/calls.jsonl sha256=b163c86a8edc0b3b5c248210ba1c4ae19f19aebd2b7c6f7f11f892afd4e1864c
