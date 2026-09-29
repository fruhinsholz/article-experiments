# Clean JSON Probe Summary

Private supplementary probe for Prompt Edits. This summary consolidates the OpenAI and Gemini JSON-format runs without changing the blog article.

## Runs

| Run | Provider | Model | Context test | Contexts | Formats | Amounts | Samples/cell | Calls |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| `gemini_100k_s30` | Gemini | `gemini-3.5-flash-lite` | $100k | 2 | 4 | 9 | 30 | 2160 |
| `openai_100k_s30` | OpenAI | `gpt-4.1-mini` | $100k | 2 | 4 | 9 | 30 | 2160 |
| `gemini_5_s10` | Gemini | `gemini-3.5-flash-lite` | $5 | 2 | 4 | 9 | 10 | 720 |
| `openai_5_s10` | OpenAI | `gpt-4.1-mini` | $5 | 2 | 4 | 9 | 10 | 720 |

## Highest Tested Claim With Majority LOW

| Provider | Context test | Format | Baseline none | With retrieved context |
| --- | --- | --- | ---: | ---: |
| Gemini | $100k | `prose_same_block` | $100 | $10,000 |
| Gemini | $100k | `json_flat` | $500 | $20,000 |
| Gemini | $100k | `json_typed` | $20,000 | $20,000 |
| Gemini | $100k | `json_typed_boundary_rule` | $100 | $20,000 |
| OpenAI | $100k | `prose_same_block` | $100 | $20,000 |
| OpenAI | $100k | `json_flat` | $500 | $20,000 |
| OpenAI | $100k | `json_typed` | $500 | $20,000 |
| OpenAI | $100k | `json_typed_boundary_rule` | $100 | $100 |
| Gemini | $5 | `prose_same_block` | $150 | $5 |
| Gemini | $5 | `json_flat` | $500 | $5 |
| Gemini | $5 | `json_typed` | $20,000 | $5 |
| Gemini | $5 | `json_typed_boundary_rule` | $100 | $100 |
| OpenAI | $5 | `prose_same_block` | $100 | $5 |
| OpenAI | $5 | `json_flat` | $1,000 | $5 |
| OpenAI | $5 | `json_typed` | $500 | $50 |
| OpenAI | $5 | `json_typed_boundary_rule` | $100 | $100 |

## P(LOW | amount), $100k Context

### Gemini

| Format | $5 | $50 | $100 | $150 | $500 | $1k | $5k | $10k | $20k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `prose_same_block` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 25/30 (83.3%) | 30/30 (100.0%) | 30/30 (100.0%) | 1/30 (3.3%) |
| `json_flat` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) |
| `json_typed` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) |
| `json_typed_boundary_rule` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 30/30 (100.0%) |

### OpenAI

| Format | $5 | $50 | $100 | $150 | $500 | $1k | $5k | $10k | $20k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `prose_same_block` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) |
| `json_flat` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) |
| `json_typed` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) |
| `json_typed_boundary_rule` | 30/30 (100.0%) | 30/30 (100.0%) | 30/30 (100.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 0/30 (0.0%) | 0/30 (0.0%) |

## P(LOW | amount), $5 Context

### Gemini

| Format | $5 | $50 | $100 | $150 | $500 | $1k | $5k | $10k | $20k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `prose_same_block` | 10/10 (100.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |
| `json_flat` | 10/10 (100.0%) | 1/10 (10.0%) | 3/10 (30.0%) | 5/10 (50.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |
| `json_typed` | 10/10 (100.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |
| `json_typed_boundary_rule` | 10/10 (100.0%) | 10/10 (100.0%) | 10/10 (100.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |

### OpenAI

| Format | $5 | $50 | $100 | $150 | $500 | $1k | $5k | $10k | $20k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `prose_same_block` | 10/10 (100.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |
| `json_flat` | 10/10 (100.0%) | 1/10 (10.0%) | 0/10 (0.0%) | 1/10 (10.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |
| `json_typed` | 10/10 (100.0%) | 8/10 (80.0%) | 2/10 (20.0%) | 4/10 (40.0%) | 4/10 (40.0%) | 1/10 (10.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |
| `json_typed_boundary_rule` | 10/10 (100.0%) | 10/10 (100.0%) | 10/10 (100.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) | 0/10 (0.0%) |

## Data Notes

- Total calls: 5,760.
- Gemini had 3 transient API 503 errors across 2,880 calls; these remain in raw data and summaries as invalid/error rows rather than being rewritten.
- Some JSON-format prompts returned JSON objects such as `{ "label": "LOW" }`; the existing harness records those as `strictLabel=INVALID` but extracts the loose label for the aggregate `LOW` / `NOT_LOW` counts.

## Article Candidate

Short version to consider for the article if we decide to use this probe:

> We also tested the same case by separating the prompt and the retrieved context in untyped and typed JSON formats. The model still interpreted the fields together.

| Model | Test | Prose | Raw JSON | Typed JSON | $100 LOW rule |
| --- | --- | ---: | ---: | ---: | ---: |
| `gpt-5.5` | `$100k contract` | `$20,000` | `$5,000` | `$20,000` | `$100` |
| `gpt-5.6` | `$100k contract` | `$20,000` | `$20,000` | `$20,000` | `$100` |
| `gemini-3.5-flash-lite` | `$100k contract` | `$10,000` | `$20,000` | `$20,000` | `$20,000` |
| `gpt-5.5` | `$5 gift card` | `$100` | `$100` | `$100` | `$100` |
| `gpt-5.6` | `$5 gift card` | none | `$50` | `$25` | `$100` |
| `gemini-3.5-flash-lite` | `$5 gift card` | `$5` | `$5` | `$5` | `$100` |

Caption: highest tested claim amount classified as `LOW` by majority vote on a fixed amount grid, with retrieved context present. Prose is the ordinary prose prompt. Raw JSON separates fields without typed structure. Typed JSON separates the retrieved note and case data into explicit typed objects. $100 LOW rule adds an explicit `$100` policy boundary to the payload. `none` means no tested amount was classified as `LOW` by majority vote.

The important result is not that JSON confused the model. The retrieved context continued to move the decision boundary whether the instruction was written as prose, raw JSON, or typed JSON. JSON made the input more structured and legible, but it did not isolate the policy value before inference. The boundary returned to `$100` only when the policy value itself was explicitly pinned as an enforceable field.

Note: the Gemini `$20,000` `$100 LOW rule` result is part of the observed result set. The current consolidated article-facing summary is in `../2026-08-01-json-format-results-summary/summary.md`.

## Interpretation

- The $100k context is the article-relevant test: prose, flat JSON, and typed JSON still classify high claim amounts as LOW.
- The $5 context is a smaller check in the opposite direction: the implicit boundary can move down as well as up.
- Structured input changes presentation and sometimes the shape of the failure, but it does not isolate or enforce the boundary before inference.
- The strongest article claim remains: externalize, version, and enforce consequence-bearing boundaries outside model judgment.
