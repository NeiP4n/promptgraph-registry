# Contributing to PromptGraph Registry

Anyone can add skills and bundles. There are two ways:

---

## Option A — Submit via Issue (easiest)

### Submit a Skill
1. Create your skill `.md` file locally
2. Validate it: `pg validate my-skill.md`
3. Publish to Gist: `/pg-publish my-skill.md` (in Claude)
4. [Open a Skill Submission issue](../../issues/new?template=submit-skill.yml) and fill out the form

### Submit a Bundle
1. Choose 2+ existing skills from the registry
2. Create a `bundle.json`:
   ```json
   {
     "id": "my-bundle",
     "name": "My Bundle",
     "description": "What this bundle does and who it helps",
     "skills": ["skill-id-1", "skill-id-2"],
     "tags": ["engineering"]
   }
   ```
3. Publish: `/pg-publish bundle.json` (in Claude) — gives you a pre-filled issue link
4. [Open a Bundle Submission issue](../../issues/new?template=submit-bundle.yml)

---

## Option B — Pull Request (for developers)

### Adding a skill via PR

1. Fork this repository
2. Add your skill file to `skills/your-skill-name.md`:

```markdown
---
name: your-skill-name
description: One sentence describing what this skill does and when to use it.
---

# Your Skill Name

## When to use
...

## How it works
...
```

3. Add it to `registry.json` under `skills`:
```json
{
  "id": "your-skill-name",
  "name": "Your Skill Name",
  "description": "Same as frontmatter description",
  "raw_url": "https://raw.githubusercontent.com/NeiP4n/promptgraph-registry/main/skills/your-skill-name.md",
  "author": "your-github-username",
  "tags": ["tag1", "tag2"],
  "stars": 0
}
```

4. Open a PR — CI validates automatically and posts a comment with results.

### Adding a bundle via PR

Add to `registry.json` under `bundles`:
```json
{
  "id": "your-bundle-id",
  "name": "Your Bundle Name",
  "description": "What this bundle covers and who should use it",
  "skills": ["skill-id-1", "skill-id-2", "skill-id-3"],
  "author": "your-github-username",
  "tags": ["engineering"],
  "stars": 0
}
```

All skills listed must already exist in the registry.

---

## Skill format requirements

| Field | Rule |
|---|---|
| `name` | Lowercase, digits, hyphens. 2–64 chars. Must match filename. |
| `description` | Min 15 characters. One clear sentence. |
| Body | Min 200 characters. Real actionable instructions. |
| Security | No `curl \| sh`, `rm -rf`, prompt injection, hardcoded keys. |
| Size | Max 100 KB. |

Run `pg validate skill.md` locally before submitting.

## Bundle requirements

| Field | Rule |
|---|---|
| `id` | Lowercase, digits, hyphens. 2–64 chars. |
| `name` | Min 3 characters. |
| `description` | Min 15 characters. |
| `skills` | At least 2 existing skill IDs. |

---

## CI/CD

Every PR runs `node validate.mjs` automatically. It checks:
- All skill files pass validation (name, description, security scan)
- No duplicate skill names
- `registry.json` is valid JSON with correct structure  
- All bundles reference existing skill IDs
- All codes are unique and well-formed (`pg-xxxxxx`)

The bot posts a ✅ or ❌ comment on your PR with details.

---

## Review process

1. CI passes → maintainer reviews content quality
2. Approved → merged to `main` → immediately available in `pg marketplace`
3. Rejected → bot explains why with specific issues to fix

Questions? Open a [blank issue](../../issues/new).
