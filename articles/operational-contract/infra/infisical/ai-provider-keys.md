# AI Provider Keys

Last updated: 2026-08-02

This document records secret names and access conventions only. It must not contain API key values.

## Infisical Location

- Project: `ai-provider-keys`
- Project ID: `91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6`
- Slug: `ai-provider-keys`
- Environment: `prod`
- Secret path: `/shared`

## Canonical Secret Names

| Secret name | Status | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | configured | Shared OpenAI provider key for operator experiments and small review tools. |
| `GEMINI_API_KEY` | configured | Shared Gemini provider key for Gemini-backed review and threshold experiments. |
| `ANTHROPIC_API_KEY` | configured | Shared Anthropic provider key for Claude / Anthropic API use. |

Use `ANTHROPIC_API_KEY`, not `CLAUDE_API_KEY`, as the canonical Anthropic secret name.

`GOOGLE_API_KEY` may remain a compatibility alias for Gemini-only tools, but new tools should read `GEMINI_API_KEY`.

## Bee Operator Usage

On `eric-bee`, run experiments under Infisical so the application still sees ordinary provider environment variables:

```bash
token=$(sudo -n infisical-admin admin-login --plain --silent)
sudo -n infisical-admin run \
  --token "$token" \
  --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 \
  --env prod \
  --path /shared \
  -- npm run <script> -- <args>
```

Do not print the `token`, do not echo provider key values, and do not paste command output from `infisical secrets --output dotenv` into chat.

For a presence check that does not print secret values:

```bash
token=$(sudo -n infisical-admin admin-login --plain --silent)
sudo -n infisical-admin run \
  --token "$token" \
  --projectId 91f5f9d9-7b4f-46ce-b3ad-07c65bb9aaa6 \
  --env prod \
  --path /shared \
  -- node -e 'for (const k of ["OPENAI_API_KEY","GEMINI_API_KEY","ANTHROPIC_API_KEY"]) console.log(k + "=present:" + Boolean(process.env[k]))'
```

## Common Pitfall

`/home/eric/workspace/us-blog/private/infisical-access.env` is for the `Blog management` project and GA4/blog administration secrets. It is not the AI provider key project. If a Gemini or OpenAI experiment reports `Project not found` or missing `GEMINI_API_KEY`, check that the command targets `ai-provider-keys`, environment `prod`, path `/shared`.
