# Contributing to PromptGraph Registry

Submissions are **fully automated** — no manual review needed. The bot validates and publishes instantly.

---

## Submit a Skill

### Step 1 — Create your skill file

```markdown
---
name: my-skill-name
description: One sentence describing what this skill does and when to use it.
---

# My Skill Name

## When to use
...

## How it works
...
```

### Step 2 — Validate locally

```bash
npm install -g promptgraph-mcp
pg validate my-skill.md
```

### Step 3 — Publish to a public Gist

```bash
# In Claude Code:
/pg-publish my-skill.md
# → gives you a Gist URL
```

Or manually create a public Gist at https://gist.github.com

### Step 4 — Submit the issue

[➕ Submit Skill](../../issues/new?template=submit-skill.yml)

Fill out the form with your Gist URL. The bot will:
- Fetch your skill from the URL
- Validate it (security scan, format check)
- Publish it to the marketplace in seconds
- Post a ✅ comment and close the issue

---

## Submit a Bundle

A bundle is a curated set of 2+ existing skills that work well together.

### Step 1 — Choose skills from the registry

Browse available skills: `pg marketplace` or see [registry.json](registry.json)

### Step 2 — Submit the issue

[➕ Submit Bundle](../../issues/new?template=submit-bundle.yml)

Fill in the bundle ID, name, description, and skill IDs. The bot validates and publishes automatically.

---

## Validation rules (automatic)

### Skills
| Check | Rule |
|---|---|
| `name` | Lowercase, digits, hyphens. 2–64 chars. Must match filename. |
| `description` | Min 15 characters. |
| Body | Min 200 characters of real instructions. |
| Security | No `curl \| sh`, `rm -rf`, prompt injection, hardcoded keys. |
| Size | Max 100 KB. |

### Bundles
| Check | Rule |
|---|---|
| `id` | Lowercase, digits, hyphens. 2–64 chars. |
| `description` | Min 15 characters. |
| `skills` | At least 2 IDs. All must exist in registry. |

---

## What happens on failure?

The bot posts an ❌ comment explaining exactly what's wrong. Fix the issues, then **reopen the issue** (don't create a new one) to retry.

---

## Manual PR (for updates or bulk submissions)

If you want to update an existing skill or add many at once, open a PR directly. CI validates and posts a comment — but updates still need a manual merge.
