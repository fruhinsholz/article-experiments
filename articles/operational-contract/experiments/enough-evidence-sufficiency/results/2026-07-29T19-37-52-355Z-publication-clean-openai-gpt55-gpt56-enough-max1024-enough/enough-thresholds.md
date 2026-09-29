# Enough Contract Thresholds

Created: 2026-07-29T19:37:52.355Z
Commit: 7ca53d045534dfe5b05e7e3de2b2209c2ed50b41

This file reports the two-phase contract search: first the minimum number of strong evidence rows, then the minimum per-row score for that count. Each candidate is sampled repeatedly and classified by majority.

| Model | Minimum strong rows | Score band for those rows | Threshold score | Notes |
| --- | ---: | --- | ---: | --- |
| `gpt-5.5` | 6 | 7.61 to 7.75 | 7.75 | 6 active rows; inactive rows at 1 |
| `gpt-5.6` | 6 | 7.61 to 7.75 | 7.75 | 6 active rows; inactive rows at 1 |
