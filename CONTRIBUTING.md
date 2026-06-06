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

[Submit Skill](../../issues/new?template=submit-skill.yml)

Fill out the form with your Gist URL. The bot will:
- Fetch your skill from the URL
- Validate it (security scan, format check)
- Publish it to the marketplace in seconds
- Post a ✅ comment and close the issue

---

## Submit a Bundle via GitHub Repo

You can host your skills in a public GitHub repository and register it as a bundle.

### Step 1 — Structure your repository

Your repo should have one of these layouts:

```
# Option A: skills/ subdirectory (recommended)
your-repo/
├── skills/
│   ├── my-first-skill.md
│   ├── my-second-skill.md
│   └── ...
├── README.md
└── LICENSE

# Option B: any subdirectory with .md files
your-repo/
├── prompts/
│   ├── skill-one.md
│   └── skill-two.md
├── docs/
├── .github/
└── README.md
```

### Step 2 — Each .md file must have valid frontmatter

Every skill file **must** start with frontmatter:

```markdown
---
name: my-skill-name
description: What this skill does and when to use it (min 15 chars).
---

Content here — must be at least 200 characters of instructions.
```

| Field | Rule |
|---|---|
| `name` | Lowercase, digits, hyphens only. 2–64 chars. |
| `description` | Min 15 characters. |
| Body | Min 200 characters. Max 100 KB. |

Doc files are **automatically skipped**: `README.md`, `LICENSE.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `FAQ.md`, `INDEX.md`, etc.

Files in the repo root are **not counted** — all skills must be in a subdirectory.

### Step 3 — Validate your repo locally before submitting

```bash
npx promptgraph-mcp validate-repo <owner/repo>
# Example: npx promptgraph-mcp validate-repo your-name/your-skill-repo
```

This clones the repo and validates every `.md` file — same check that CI runs.

### Step 4 — Create a bundle with your repo URL

Submit a bundle with a `repo_url` pointing to your GitHub repository. The CI will clone and validate it automatically.

[Submit Bundle](../../issues/new?template=submit-bundle.yml)

Example bundle format:
```json
{
  "id": "my-curated-set",
  "name": "My Curated Set",
  "description": "A collection of skills for ...",
  "repo_url": "https://github.com/your-name/your-skill-repo",
  "tags": ["web-dev", "react"]
}
```

> **Important**: CI validates every `.md` file in your repo's subdirectories. If any file fails validation, the whole bundle is rejected. Fix the issues and retry.

---

## Submit a Bundle (from registry skills)

A bundle can also be a curated set of 2+ existing skills from the registry.

### Step 1 — Choose skills from the registry

Browse available skills: `pg marketplace` or see [registry.json](registry.json)

### Step 2 — Submit the issue

[Submit Bundle](../../issues/new?template=submit-bundle.yml)

Fill in the bundle ID, name, description, and skill IDs. The bot validates and publishes automatically.

---

## Validation rules (automatic)

### Skills
| Check | Rule |
|---|---|
| `name` | Lowercase, digits, hyphens. 2–64 chars. |
| `description` | Min 15 characters. |
| Body | Min 200 characters of real instructions. |
| Security | No `curl | sh`, `rm -rf`, prompt injection, hardcoded keys. |
| Size | Max 100 KB. |

### Bundles
| Check | Rule |
|---|---|
| `id` | Lowercase, digits, hyphens. 2–64 chars. |
| `description` | Min 15 characters. |
| `skills` | At least 2 IDs. All must exist in registry. |

### Repo bundles (repo_url)
| Check | Rule |
|---|---|
| Subdirectory | Skills must be in a subdirectory, not repo root. |
| `.md` files | Every `.md` file in subdirectories is validated. |
| Doc files | `README.md`, `LICENSE.md`, etc. are automatically skipped. |
| Frontmatter | Every skill file must have `name` and `description`. |

---

## What happens on failure?

The bot posts an ❌ comment explaining exactly what's wrong. Fix the issues, then **reopen the issue** (don't create a new one) to retry.

---

## Manual PR (for updates or bulk submissions)

If you want to update an existing skill or add many at once, open a PR directly. CI validates and posts a comment — but updates still need a manual merge.
