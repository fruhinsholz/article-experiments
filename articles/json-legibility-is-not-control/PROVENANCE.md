# Provenance

The prospective protocol was committed in the source research repository before
the first live model call:

- preregistration commit: `3f7f2e1`
- result commit: `16c46ba`
- live run timestamp: `2026-09-30T01:45:19.321Z`
- returned model: `jev-1.13.0`
- valid calls: 720
- errors: 0
- retries: 0

`current/results/.../run.json` was written with all planned jobs and source hashes
before the runner sent its first request. It preserves the exact executed-runner
SHA-256 and the frozen-stimulus SHA-256.

The public runner removes only the source environment's private credential-loader
integration and instead requires standard environment variables. That sanitation
changes its file hash. The job construction, payload construction, randomization,
retry policy, raw-response preservation, and result-writing logic are unchanged.

The archive is the tracked pre-prospective snapshot previously published from the
research repository. It is retained for history, not mixed into the current
estimate.
