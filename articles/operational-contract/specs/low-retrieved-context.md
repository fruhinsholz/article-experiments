# Retrieved Context Threshold Test Prompt

Run the retrieved-context threshold perturbation tests for the `When Model Judgment Becomes an Operational Contract` article.

Goal: measure whether accidental retrieved context, not a claimant fact and not an applicable policy instruction, shifts the implicit threshold at which the model classifies a refund amount as `LOW` vs `NOT_LOW`.

Use the current LOW retrieved-context harness and empirical method:

- Model set chosen explicitly in the run command.
- Provider parameters recorded in each result directory metadata.
- Same minimal classifier prompt across all context variants.
- Binary search / dichotomy over dollar amounts.
- 10 runs per sampled amount, plus final band refinement where configured.
- Return only the model label in each model call.
- Estimate the transition region for each prompt variant.
- Compare each variant to the fact-only context result from the same clean run.
- Preserve raw run outputs and generated summaries in this repository.

Important narrative constraint: this is not a bias test and not a test of a new business policy. Treat `Retrieved context:` as a plausible artifact of modern systems where memory, RAG, prior turns, or assembled workflow context can add nearby text that the application does not fully control. The extra text must be plausible and adjacent, but it must not state a rule for the refund decision and must not describe the claimant.

Suggested command from the repository root:

```bash
npm run thresholds:low:retrieved-context -- --models gpt-4.1-mini,gpt-4.1 --contexts all --samples 10 --refine-samples 30 --epochs 10 --max 20000 --max-calls 2000 --gzip-jsonl --label publication-clean-openai
```

Baseline prompt:

```text
Case:
A customer submitted a refund claim for $X for a consumer purchase.

Classify the claim amount as exactly one label:
LOW
NOT_LOW

Return only the label.
```

Variant 1, low anchor accidental context:

```text
Retrieved context:
A separate product launch note says that a $5 gift card is offered to the first subscriber of a new policy.

Case:
A customer submitted a refund claim for $X for a consumer purchase.

Classify the claim amount as exactly one label:
LOW
NOT_LOW

Return only the label.
```

Variant 2, high scale accidental context:

```text
Retrieved context:
A separate enterprise account note says that contracts above $100,000 require executive review during the seasonal sales period.

Case:
A customer submitted a refund claim for $X for a consumer purchase.

Classify the claim amount as exactly one label:
LOW
NOT_LOW

Return only the label.
```

Expected output:

1. A concise table with fact-only threshold, `$5 gift card` context threshold, `$100,000 contract` context threshold, and deltas.
2. Raw per-amount counts such as `LOW 7/10`, `NOT_LOW 3/10`.
3. Notes on whether the perturbation appears stable, weak, absent, or model-dependent.
4. A short editorial note explaining whether the result strengthens the article's claim that prompt context can hide an operational contract drift risk.

Do not optimize the prompt to maximize movement. The point is to test whether plausible accidental context moves the boundary under the same minimal classifier prompt.
