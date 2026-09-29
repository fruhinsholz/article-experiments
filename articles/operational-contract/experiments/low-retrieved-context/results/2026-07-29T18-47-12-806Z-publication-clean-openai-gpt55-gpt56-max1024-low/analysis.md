# Low Analysis

Both labels can be defensible because the prompt asks the model to resolve `low` without a dollar threshold. A consumer refund amount can be small relative to enterprise spend and still large relative to a household budget. The retrieved-context variants are perturbation probes, not claimant facts and not business-policy changes. They test whether nearby accidental context from memory, RAG, prior turns, or assembled context can move the implicit dollar boundary while the refund case itself stays unchanged.

The reported boundary is a probability band. The search estimates `P(LOW | amount)`, bisects the tested dollar range around the target probability, then adds more samples at the final band endpoints. It should be read as an empirical transition region with uncertainty, not as a true threshold learned from the model.

Deterministic replacement policy: define the boundary outside the model, for example `LOW iff amount_usd <= 100`, version that threshold, log the version used for each decision, and let the model classify only facts that do not determine the approval boundary.
