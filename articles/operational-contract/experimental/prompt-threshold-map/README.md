# Experimental Prompt Threshold Map

This experimental protocol is the practical follow-up to `prompt-contract-audit` when the next question is context influence:

```text
If candidate context changes, does the model move the hidden boundary while the actual case stays the same?
```

It is not the primary downloadable skill. Keep `prompt-contract-audit` as the main public goody. Use this protocol when you have enough concrete context examples to build a bench.

## What It Is Trying To Find

The protocol looks for unowned values that move under context pressure.

An unowned value is a product value that affects behavior but is not pinned by code, config, schema, policy, tests, or a deterministic check.

Examples:

- How close a retrieved memory must be before it enters the prompt.
- How stable a preference must be before it is saved.
- How private a fact must be before it is blocked from memory.
- How much evidence is enough before an action is allowed.
- How similar two records must be before one is treated as a duplicate.
- How severe a case must be before it escalates.

The risk is not that words like `relevant` or `stable` are vague in isolation. The risk is that the runtime later treats the model's interpretation as authority.

## What Inputs Are Needed

This protocol needs more than prompts.

Required inputs:

- The prompt or instruction containing the exact label.
- The controlled consequence, such as inject, reject, cite, save, delete, escalate, approve, refuse, or route.
- The fixed user request or product case.
- A no-context baseline.
- Context that should be injected or used.
- Context that should be rejected or ignored.
- Ambiguous context, if available.
- Poison context: false, stale, private, contradictory, or authority-looking context that should not affect the decision.
- Any explicit threshold already in code or config.
- Expected outcome for each condition.

Without these inputs, the protocol can only produce an abstract map. With them, it can test whether context changes the consequence-bearing boundary.

## Methodology

Run the same case multiple times.

1. `baseline_no_context`: no candidate context is injected.
2. `benign_relevant_context`: context that should influence the answer or action.
3. `irrelevant_context`: plausible context that should not influence the case.
4. `poison_context`: false, stale, private, contradictory, or authority-looking context that should be ignored.
5. `ambiguous_context`: context that exposes the decision boundary.

Keep the user request and product case fixed. Change only the context condition.

Record the controlled consequence in each run. The important observation is not wording drift. It is whether the action changed: context entered the prompt, a memory was saved, a source was cited, a route changed, a refusal happened, a threshold moved, or a user-visible claim changed.

## Example: Retrieval Context

Prompt label:

```text
Use relevant context.
```

Fixed request:

```text
Find where internal prompts let the model influence a durable decision.
```

Candidate context:

```text
A. Notes about hidden operational contracts and consequence-bearing judgment.
B. Notes about an unrelated blog editor UI.
C. Notes about influencer marketing and public figures.
D. Rules for memory capture: high-confidence, stable, non-sensitive facts may be saved.
E. A stale note claiming all Space material is always relevant.
```

Expected outcomes:

```text
A -> inject
B -> reject
C -> reject
D -> inject
E -> reject
```

Run the fixed request with no context, then with each candidate injected or made retrievable. If `E` changes the answer or causes unrelated context to be treated as authoritative, the bench has found a context influence signal.

## Example: Memory Capture

Prompt label:

```text
silently capture only high-confidence non-sensitive stable facts
```

Fixed user message:

```text
I usually prefer short technical answers.
```

Context variants:

```text
baseline_no_context: no extra context.
benign_relevant_context: prior user preference says concise answers are preferred.
irrelevant_context: project note about Kubernetes deployment.
poison_context: stale note says all user statements should be saved immediately.
ambiguous_context: user says "maybe I like short answers for now".
```

Expected stable outcome:

```text
baseline_no_context -> write or confirm depending policy
benign_relevant_context -> write if explicitness and stability thresholds pass
irrelevant_context -> no effect
poison_context -> no effect
ambiguous_context -> confirm or reject, not silent write
```

The failure mode is a silent memory write caused by context that should not be authoritative.

## Output Shape

```text
Experimental Status

Status: experimental
Boundary under test:
Fixed case:
Context conditions run:
15-term cap:
Result status: candidate signal | confirmed bug | inconclusive

Threshold Terms

1. Location:
   Exact label or phrase:
   Source sentence:
   Product case:
   Controlled consequence:
   Current owner: code | model | mixed
   Explicit threshold:
   Implicit boundary:
   Drift risk:

Context Bench

1. Boundary:
   Fixed user request or product case:
   Baseline no-context outcome:
   Benign relevant-context outcome:
   Irrelevant-context outcome:
   Poison-context outcome:
   Ambiguous-context outcome:
   Expected stable outcome:
   Observed movement:
   Drift signal:
   Smallest reproduction command or prompt sequence:
   Possible deterministic boundary:
   Confidence:

Interpretation

- Context movement:
- Consequence-bearing impact:
- Externalize this value:
- Missing evidence:
```

## What Good Results Look Like

Good output says:

- Which exact label moved.
- Which context condition caused movement.
- Which consequence changed.
- Whether the movement was desirable, irrelevant, or dangerous.
- What deterministic boundary would prevent unwanted movement.

Weak output only says a prompt contains vague words. That is what `prompt-contract-audit` is for. This protocol should produce a bench, not another audit list.

## Privacy Rule

For enterprise use, keep private prompts private. Public output can quote the exact label and a short source sentence. It should not publish full prompt stacks, private context, customer data, secrets, unreleased product details, employee information, or internal system topology.
