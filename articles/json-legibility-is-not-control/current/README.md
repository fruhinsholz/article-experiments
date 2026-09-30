# Current Prospective Experiment

This directory contains the complete evidence used by the current article.

## Frozen design

- 2 model-facing key families
- 2 primary boundary states
- 2 range controls
- 2 clear-state guardrails
- 60 complete randomized blocks
- all 6 semantic choice orders used exactly 10 times
- 720 planned and valid calls

See [`PREREGISTRATION.md`](PREREGISTRATION.md) for the estimands, success criteria,
retry rules, and interpretation limits.

## Preserved result

The result directory contains:

- `run.json`: planned jobs, payloads, timestamps, and source hashes
- `calls.jsonl`: raw requests and responses
- `summary.json` and `summary.md`: cell summaries
- `analysis.json` and `analysis.md`: primary estimates and frozen decision

The analysis can be reproduced from the preserved calls with `npm run verify` from
the parent directory.
