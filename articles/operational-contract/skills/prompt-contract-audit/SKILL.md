# Prompt Contract Audit

Use this skill when reviewing a codebase, prompt set, agent workflow, or product policy for hidden operational contracts delegated to model judgment.

## Goal

Find candidate places where a prompt, instruction, or agent workflow asks a model to decide a consequence-bearing boundary that should probably be externalized, pinned, versioned, tested, or enforced deterministically.

## Procedure

1. Search for prompts, system messages, policy text, tool-routing instructions, schemas, evals, and agent workflows.
2. Look for vague labels that can hide thresholds, sufficiency rules, safety boundaries, routing rules, permission rules, publication rules, deletion rules, citation rules, retention rules, or spending rules.
3. Extract the exact words or phrases from the analyzed prompts that control a consequence-bearing action. Do not substitute synonyms.
4. For each candidate, identify the consequence controlled by the label.
5. Separate candidates from confirmed bugs. Do not claim a defect unless there is direct behavioral evidence.
6. Suggest the smallest test that would expose drift: vary the scalar, count, context, retrieved note, model version, or policy wording while holding the actual case constant.
7. Suggest a deterministic replacement only when the consequence is material.

## Output Format

Always start with a `Detected Terms` section, then return the full `Findings` section.

### Detected Terms

List at most 15 detected terms or phrases. If more than 15 candidates are found, include the strongest 15 and explicitly say that the 15-term cap was reached.

For each detected term, include:

- Location
- Exact detected word or phrase
- Source sentence
- Controlled action
- Hidden value
- Hidden contract type
- Impact if interpretation drifts

### Findings

Return a concise review table or bullet list with these fields:

- Location
- Vague label or judgment
- Controlled consequence
- Hidden contract type
- Impact
- Why it might hide a contract
- Evidence observed
- Suggested confirmation test
- Possible deterministic boundary
- Confidence: low, medium, or high

## Term Selection Rule

Do not list every vague word. List only words or phrases that control, permit, block, route, rank, store, delete, cite, expose, summarize, escalate, approve, refuse, prioritize, or otherwise change system behavior or user-visible output.

Prefer exact multi-word phrases over isolated words when the phrase is the real boundary, for example `high-confidence non-sensitive stable facts` instead of three separate terms when they jointly control a memory write.

## Review Rules

- Treat findings as candidates, not confirmed bugs.
- Do not penalize ordinary writing style where no system action depends on the model's interpretation.
- Prioritize boundaries that affect money, deletion, publication, privacy, security, escalation, refusal, approvals, user-visible state, memory writes, context injection, source citation, or external side effects.
- Prefer concrete tests over broad recommendations.
- Prefer code, schemas, policy files, allowlists, thresholds, and state machines for consequence-bearing boundaries.
- If the output hits the 15-term cap, say what was omitted at a high level, such as lower-risk style terms, duplicate wording, or terms without direct action control.

## Expected Output Shape

```text
Detected Terms

1. Location:
   Exact detected word or phrase:
   Source sentence:
   Controlled action:
   Hidden value:
   Hidden contract type:
   Impact if interpretation drifts:

Findings

1. Location:
   Vague label or judgment:
   Controlled consequence:
   Hidden contract type:
   Impact:
   Why it might hide a contract:
   Evidence observed:
   Suggested confirmation test:
   Possible deterministic boundary:
   Confidence:
```
