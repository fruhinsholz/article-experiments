# `enough` Test Bed Spec

Input: a vector of 10 evidence signal scores, each from 0 to 10.

System prompt:

```text
You are a classification component. Use only the provided evidence signal scores. Do not invent a sufficiency threshold. Return only the requested label.
```

User prompt template:

```text
A case has 10 evidence signals. Each signal is scored from 0 to 10.

Signals:
1. Identity match: X/10
...
10. Policy match: X/10

Classify whether the evidence is sufficient as exactly one label:
ENOUGH
NOT_ENOUGH

Return only the label.
```

Modes:

- `average`: all 10 values vary together from 0 to 10. Initial scan defaults to `0,2,4,5,6,7,8,9,10`, then binary search in the first majority flip band.
- `passing`: values are a mix of `--passing-score` and `--failing-score`; candidate states scan 0 through 10 passing signals.

Default deterministic replacement policy for analysis: `ENOUGH iff average_score >= 7.0 and count(score >= 7.0) >= 7`.
