# Prompt Contract Audit Skill

This folder contains a reusable skill for finding possible hidden operational contracts in prompts and agent code. It is meant to help you discover candidates for review, not to prove bugs automatically.

## What It Looks For

The skill looks for places where model judgment may control a consequence-bearing boundary through vague language, such as:

- thresholds: `low`, `large`, `too expensive`, `urgent`
- sufficiency labels: `enough`, `adequate`, `ready`, `complete`
- safety or permission labels: `safe`, `allowed`, `sensitive`, `private`
- escalation or routing labels: `needs review`, `important`, `high risk`

## How To Run It

Use the skill instructions in [SKILL.md](SKILL.md) with your agent or copy the checklist into a code-review workflow. Point it at a repository and ask for prompt-contract candidates. The useful output is not a verdict; it is a short list of boundaries to externalize, pin, version, and test.

Example request:

```text
Use the prompt-contract-audit skill on this repository. Find places where a prompt or agent instruction may hide a threshold, sufficiency rule, safety boundary, routing rule, or spending boundary. Return candidates only, with evidence and suggested tests.
```

## What You Get

The expected output starts with `Detected Terms`, then continues with `Findings`.

`Detected Terms` lists the exact prompt words or phrases that control behavior. It is capped at 15 entries. If the cap is reached, the output must say so explicitly and summarize what was omitted at a high level.

Each detected term should include:

- file and line reference
- exact detected word or phrase
- source sentence
- controlled action
- hidden value
- hidden contract type
- impact if interpretation drifts

`Findings` is the fuller audit list. Each candidate should include:

- file and line reference
- the vague label or judgment being delegated
- the consequence controlled by that judgment
- the hidden contract type
- the impact if interpretation changes
- why it might be a hidden contract
- a deterministic replacement shape, if one is appropriate
- a small experiment or test that would confirm or reject the concern

## Caveats

Findings are possibilities, not confirmed defects. Vague language is not automatically wrong. A candidate matters when the model's interpretation changes what the system does, touches, publishes, refuses, escalates, deletes, or spends.
