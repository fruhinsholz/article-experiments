# Enough Analysis

Both labels can be defensible because the prompt asks the model to resolve `enough` without an explicit proof standard. A high average can hide one weak signal. A high count of passing signals can hide mediocre aggregate evidence. Different systems may reasonably encode either policy, but the prompt does not say which one controls approval.

Deterministic replacement policy: define sufficiency outside the model, for example `ENOUGH iff average_score >= 7.0 and count(score >= 7.0) >= 7`, version that policy, log the version used for each decision, and let the model extract or critique evidence without inventing the approval boundary.
