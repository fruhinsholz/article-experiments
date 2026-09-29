# Enough Contract Thresholds

Created: 2026-07-28T03:20:39.966Z
Commit: 8f0c57540153a226953a265a2f69dbed3bfcbe89

This file reports the two-phase contract search: first the minimum number of strong evidence rows, then the minimum per-row score for that count. Each candidate is sampled repeatedly and classified by majority.

| Model | Minimum strong rows | Score band for those rows | Threshold score | Notes |
| --- | ---: | --- | ---: | --- |
| `gemini-3.5-flash-lite` | 6 | 9.719 to 9.86 | 9.86 | 6 active rows; inactive rows at 1 |
| `gemini-3.6-flash` | 6 | 7.891 to 8.032 | 8.032 | 6 active rows; inactive rows at 1 |
