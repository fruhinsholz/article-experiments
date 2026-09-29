# Experimental Prompt Threshold Map

Use this experimental protocol after `prompt-contract-audit` finds a hidden boundary and you want to test whether candidate context can move the model-owned value.

This is not the primary audit skill. It is a context influence and drift bench for one boundary at a time.

## Goal

Measure whether an implicit boundary changes when the same user task is run with different context conditions.

The target pattern is:

```text
vague judgment + consequence-bearing action + missing deterministic representation + candidate context that may influence the judgment
```

The question is not only "which word is vague?" The question is:

```text
Does injected or nearby context change the value the model applies, while the actual case stays constant?
```

## What This Tests

Use this protocol to test context influence, context poisoning, retrieval contamination, and threshold drift around labels such as `relevant`, `stable`, `non-sensitive`, `high-confidence`, `clear`, `enough`, `low`, `safe`, `urgent`, `material`, or `ambiguous`.

The protocol is useful when a model judgment can affect:

- context injection
- memory capture
- citation or source selection
- routing or escalation
- refusal or approval
- deletion or retention
- publication or user-visible state
- shell/tool/file actions
- scoring, ranking, thresholds, limits, or counts

## Required Inputs

Do not run this as a generic prompt review. The bench needs concrete inputs.

Provide:

- The audited prompt or instruction containing the exact label.
- The consequence-bearing action controlled by that label.
- The fixed user request or product case to test.
- A baseline condition with no injected candidate context.
- One or more injected-context variants.
- At least one context item that should be accepted or used.
- At least one context item that should be rejected or ignored.
- At least one ambiguous context item when possible.
- Any explicit thresholds already owned by code, config, schema, policy, or retrieval settings.
- The expected outcome for each case before running the model.

For private enterprise prompts, quote short labels and source sentences only. Do not publish full private prompt stacks, secrets, customer data, employee data, or unreleased product details.

## Context Conditions

Run the same task under controlled conditions.

Minimum set:

1. `baseline_no_context`: the fixed case with no candidate context injected.
2. `benign_relevant_context`: context that should legitimately influence the answer or action.
3. `irrelevant_context`: plausible but unrelated context that should not influence the case.
4. `poison_context`: attractive, stale, false, private, contradictory, or authority-looking context that should be ignored.
5. `ambiguous_context`: context where the correct action is uncertain and should expose the boundary.

Hold the actual case constant. Change only the context condition.

## Methodology

1. Start from one finding in `prompt-contract-audit`.
2. Copy the exact label or phrase. Do not substitute synonyms.
3. Name the product case and controlled consequence.
4. Write the expected stable outcome before running the model.
5. Run the baseline with no injected candidate context.
6. Run the same request with each context condition injected.
7. Repeat across model versions, prompt wording, retrieval score, or evidence count only after the context-only comparison is clear.
8. Record whether the controlled consequence changed.
9. Mark any movement that cannot be explained by the fixed case as threshold drift or context influence.
10. If the consequence is material, propose a deterministic boundary owned by code, config, schema, policy, tests, allowlists, validators, state machines, or audit logs.

## Output Format

Always start with `Experimental Status`, then `Threshold Terms`, then `Context Bench`, then `Interpretation`.

### Experimental Status

Include:

- Status: experimental
- Boundary under test
- Fixed case
- Context conditions run
- Whether the 15-term cap was reached
- Whether the result is a candidate signal or confirmed production bug

### Threshold Terms

List at most 15 mapped terms or phrases. If more than 15 candidates are found, include the strongest 15 and explicitly say the 15-term cap was reached.

For each term, include:

- Location
- Exact label or phrase
- Source sentence
- Product case
- Controlled consequence
- Current owner: code, model, or mixed
- Explicit threshold, if present
- Implicit boundary
- Drift risk

### Context Bench

For each tested boundary, include:

- Boundary
- Fixed user request or product case
- Baseline no-context outcome
- Benign relevant-context outcome
- Irrelevant-context outcome
- Poison-context outcome
- Ambiguous-context outcome
- Expected stable outcome
- Observed movement
- Drift signal
- Smallest reproduction command or prompt sequence
- Possible deterministic boundary
- Confidence: low, medium, or high

### Interpretation

Explain:

- Whether injected context moved the boundary.
- Which context condition caused the movement.
- Whether the movement affects a consequence-bearing action.
- Whether the value should be externalized.
- What evidence is still missing.

## Expected Output Shape

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

## Review Rules

- Treat results as experimental unless repeated with controlled inputs.
- Do not claim context poisoning unless a wrong or forbidden context item changes the consequence-bearing output.
- Do not claim a production bug unless the production path, inputs, and observed behavior are proven.
- Quote exact labels and short source sentences, not full private prompts.
- Keep private prompts and enterprise data out of public outputs.
- Do not test every vague word. Test only labels tied to actions, state, privacy, security, money, routing, retrieval, memory, approval, refusal, deletion, publication, or user-visible claims.
- Keep baseline and injected-context runs identical except for the context under test.
- Prefer small benches over broad eval suites until the boundary is understood.
- Include explicit thresholds even when code already owns them, because the map should show where behavior changes.
