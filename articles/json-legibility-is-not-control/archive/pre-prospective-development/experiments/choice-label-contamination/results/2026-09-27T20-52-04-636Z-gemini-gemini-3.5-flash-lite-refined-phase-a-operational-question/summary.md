# Refined Phase A technical pilot

This run is non-confirmatory and excluded from preregistered evidence.

- Provider: `gemini`
- Model requested: `gemini-3.5-flash-lite`
- Repeats per cell: 20
- Errors: 0

| State | Family | Status | n | P(full) | P(partial) | P(none) | Review score | Selected | Branches |
|---|---|---|---:|---:|---:|---:|---:|---|---|
| boundary | neutral | reference | 20 | 0.1925 | 0.7700 | 0.0375 | 0.8075 | {"partial":20} | {"human_review":20} |
| boundary | work_completion | accepted | 20 | 0.3950 | 0.6000 | 0.0050 | 0.6050 | {"full":6,"partial":14} | {"automatic_full_capacity":6,"human_review":14} |
| boundary | task_coverage | accepted | 20 | 0.3975 | 0.5975 | 0.0050 | 0.6025 | {"full":6,"partial":14} | {"automatic_full_capacity":6,"human_review":14} |
| boundary | capacity | accepted | 20 | 0.1900 | 0.8050 | 0.0050 | 0.8100 | {"partial":20} | {"human_review":20} |
| clear_full | neutral | reference | 20 | 0.9525 | 0.0390 | 0.0085 | 0.0475 | {"full":20} | {"automatic_full_capacity":20} |
| clear_full | work_completion | accepted | 20 | 1.0000 | 0.0000 | 0.0000 | 0.0000 | {"full":20} | {"automatic_full_capacity":20} |
| clear_full | task_coverage | accepted | 20 | 1.0000 | 0.0000 | 0.0000 | 0.0000 | {"full":20} | {"automatic_full_capacity":20} |
| clear_full | capacity | accepted | 20 | 1.0000 | 0.0000 | 0.0000 | 0.0000 | {"full":20} | {"automatic_full_capacity":20} |
| clear_partial | neutral | reference | 20 | 0.0225 | 0.9550 | 0.0225 | 0.9775 | {"partial":20} | {"human_review":20} |
| clear_partial | work_completion | accepted | 20 | 0.0100 | 0.9800 | 0.0100 | 0.9900 | {"partial":20} | {"human_review":20} |
| clear_partial | task_coverage | accepted | 20 | 0.0150 | 0.9700 | 0.0150 | 0.9850 | {"partial":20} | {"human_review":20} |
| clear_partial | capacity | accepted | 20 | 0.0225 | 0.9550 | 0.0225 | 0.9775 | {"partial":20} | {"human_review":20} |
