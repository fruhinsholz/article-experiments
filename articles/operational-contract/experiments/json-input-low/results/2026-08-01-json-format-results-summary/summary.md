# JSON Format Results Summary

Supplementary probe for the Prompt Edits article. This file consolidates the JSON-format result set used for the article-facing table. Some inputs were generated at different times; the table reports the observed result set rather than treating any pass as canonical by itself.

## Result Table

Highest tested claim amount classified as `LOW` by majority vote.

| Provider | Model | Test | Prose | Raw JSON | Typed JSON | $100 LOW rule |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| OpenAI | `gpt-5.5` | $100k contract | $20,000 | $5,000 | $20,000 | $100 |
| OpenAI | `gpt-5.6` | $100k contract | $20,000 | $20,000 | $20,000 | $100 |
| Gemini | `gemini-3.5-flash-lite` | $100k contract | $18,000 | $50,000 | $50,000 | $20,000 |
| OpenAI | `gpt-5.5` | $5 gift card | $100 | $100 | $100 | $100 |
| OpenAI | `gpt-5.6` | $5 gift card | none | $50 | $25 | $100 |
| Gemini | `gemini-3.5-flash-lite` | $5 gift card | $5 | $5 | $5 | $100 |

## Gemini $100k Detailed Rows

The Gemini `$100k` result is not a smooth threshold. Several cells are non-monotonic: a higher amount can receive more `LOW` votes than a lower amount in the same prompt format. That is part of the result, not a row to discard.

### Prose

| Amount | LOW | NOT_LOW | Invalid |
| ---: | ---: | ---: | ---: |
| $100 | 30/30 | 0/30 | 0/30 |
| $150 | 30/30 | 0/30 | 0/30 |
| $500 | 30/30 | 0/30 | 0/30 |
| $1,000 | 23/30 | 7/30 | 0/30 |
| $5,000 | 30/30 | 0/30 | 0/30 |
| $10,000 | 30/30 | 0/30 | 0/30 |
| $12,000 | 30/30 | 0/30 | 0/30 |
| $15,000 | 11/30 | 19/30 | 0/30 |
| $18,000 | 30/30 | 0/30 | 0/30 |
| $20,000 | 1/30 | 29/30 | 0/30 |
| $25,000 | 15/30 | 15/30 | 0/30 |
| $50,000 | 15/30 | 15/30 | 0/30 |
| $100,000 | 0/30 | 30/30 | 0/30 |

### Raw JSON

| Amount | LOW | NOT_LOW | Invalid |
| ---: | ---: | ---: | ---: |
| $100 | 30/30 | 0/30 | 0/30 |
| $150 | 30/30 | 0/30 | 0/30 |
| $500 | 30/30 | 0/30 | 0/30 |
| $1,000 | 30/30 | 0/30 | 0/30 |
| $5,000 | 30/30 | 0/30 | 0/30 |
| $10,000 | 30/30 | 0/30 | 0/30 |
| $12,000 | 30/30 | 0/30 | 0/30 |
| $15,000 | 30/30 | 0/30 | 0/30 |
| $18,000 | 30/30 | 0/30 | 0/30 |
| $20,000 | 30/30 | 0/30 | 0/30 |
| $25,000 | 30/30 | 0/30 | 0/30 |
| $50,000 | 30/30 | 0/30 | 0/30 |
| $100,000 | 0/30 | 30/30 | 0/30 |

### Typed JSON

| Amount | LOW | NOT_LOW | Invalid |
| ---: | ---: | ---: | ---: |
| $100 | 30/30 | 0/30 | 0/30 |
| $150 | 30/30 | 0/30 | 0/30 |
| $500 | 30/30 | 0/30 | 0/30 |
| $1,000 | 30/30 | 0/30 | 0/30 |
| $5,000 | 30/30 | 0/30 | 0/30 |
| $10,000 | 30/30 | 0/30 | 0/30 |
| $12,000 | 30/30 | 0/30 | 0/30 |
| $15,000 | 30/30 | 0/30 | 0/30 |
| $18,000 | 30/30 | 0/30 | 0/30 |
| $20,000 | 30/30 | 0/30 | 0/30 |
| $25,000 | 30/30 | 0/30 | 0/30 |
| $50,000 | 30/30 | 0/30 | 0/30 |
| $100,000 | 4/30 | 26/30 | 0/30 |

### $100 LOW rule

| Amount | LOW | NOT_LOW | Invalid |
| ---: | ---: | ---: | ---: |
| $100 | 30/30 | 0/30 | 0/30 |
| $150 | 0/30 | 30/30 | 0/30 |
| $500 | 0/30 | 30/30 | 0/30 |
| $1,000 | 0/30 | 30/30 | 0/30 |
| $5,000 | 0/30 | 30/30 | 0/30 |
| $10,000 | 0/30 | 30/30 | 0/30 |
| $12,000 | 0/30 | 30/30 | 0/30 |
| $15,000 | 25/30 | 5/30 | 0/30 |
| $18,000 | 0/30 | 30/30 | 0/30 |
| $20,000 | 30/30 | 0/30 | 0/30 |
| $25,000 | 0/30 | 30/30 | 0/30 |
| $50,000 | 0/30 | 30/30 | 0/30 |
| $100,000 | 0/30 | 30/30 | 0/30 |

## Data Notes

- The table is a compact article view, not a benchmark ranking.
- The Gemini `$100k` `$100 LOW rule` cell remains `$20,000` because `$20,000` is the highest tested amount with majority `LOW` in the consolidated result set.
- The detailed rows show why this should not be interpreted as a reliable prompt-side boundary: the same explicit `$100` policy field produced `NOT_LOW` at many amounts above `$100`, but majority `LOW` at `$15,000` and `$20,000`.
- This strengthens the practical conclusion: pinning a threshold in model input is better evidence of intent, but consequence-bearing enforcement still belongs outside the model.
