# Current Prospective Experiment

This directory contains the complete evidence used by the current article.

## Frozen design

- 2 model-facing key families
- 2 primary boundary states
- 2 range controls
- 2 clear-state guardrails
- 60 complete blocks with randomized within-block call order
- all 6 semantic choice orders used exactly 10 times
- 720 planned and valid calls

See [`PREREGISTRATION.md`](PREREGISTRATION.md) for the estimands, success criteria,
retry rules, and interpretation limits.

## Preserved result

The result directory contains:

- `run.json`: the complete planned schedule, run-level timestamps, frozen stimuli, arguments, and source hashes
- `calls.jsonl`: per-call payloads, timestamps, attempts, and raw responses
- `summary.json` and `summary.md`: cell summaries
- `analysis.json` and `analysis.md`: primary estimates and frozen decision

## Runner provenance

The preserved run records runner SHA-256 `a40763322832385ecd5d43b84296ab4753648f234ebfd95d98a9287ff0a11be2`. The file at `src/run-prospective-routing-boundary.mjs` is the exact executed source and hashes to that value. It was committed in the source experiment repository as `3f7f2e1fb16a6c976c044ad7089520d1d1f11110` at `2026-09-29T18:45:02-07:00`; `run.json` was created at `2026-09-30T01:45:19.321Z`, 17 seconds later.

The analysis can be reproduced from the preserved calls with `npm run verify` from
the parent directory.
