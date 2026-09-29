# Enough Contract Thresholds

Created: 2026-07-28T03:26:10.470Z
Commit: 8f0c57540153a226953a265a2f69dbed3bfcbe89

This file reports the two-phase contract search: first the minimum number of strong evidence rows, then the minimum per-row score for that count. Each candidate is sampled repeatedly and classified by majority.

| Model | Minimum strong rows | Score band for those rows | Threshold score | Notes |
| --- | ---: | --- | ---: | --- |
| `gpt-4.1` | 4 | 8.875 to 9.016 | 9.016 | 4 active rows; inactive rows at 1 |
| `gpt-4.1-mini` | 6 | 7.891 to 8.032 | 8.032 | 6 active rows; inactive rows at 1 |
