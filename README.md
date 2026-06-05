# PromptGraph Registry

Community skill registry for [PromptGraph](https://github.com/NeiP4n/promptgraph) — semantic skill router for Claude Code.

[![skills](https://img.shields.io/badge/skills-4-7C3AED)](#skills)
[![bundles](https://img.shields.io/badge/bundles-9-10B981)](#bundles)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Structure

```
registry.json     ← catalog: id, name, description, url, category, tags
skills/*.md       ← skill files (for registry-hosted skills)
```

GitHub-repo bundles don't live here — they're installed by cloning the source repo directly.

---

## Skills (4)

| Category | Name | Install code | Tags |
|---|---|---|---|
| 🛠 Engineering | **Systematic Debugging** | `pg-6e0e13` | debugging, workflow |
| 🛠 Engineering | **Commit Message** | `pg-f8c3a1` | git, workflow |
| 🛠 Engineering | **Safe Refactor** | `pg-9d2b7e` | refactoring |
| 🛠 Engineering | **PR Review** | `pg-cc1a4f` | code-review |

```bash
# install a skill
pg install pg-6e0e13          # by code
pg install systematic-debugging  # by name
```

---

## Bundles (9)

Bundles are either curated skill lists or full GitHub repos installed as a skill source.

### 🛠 Engineering

| Name | ID | Type | Skills |
|---|---|---|---|
| Engineering Essentials | `engineering-essentials` | skill list | systematic-debugging, safe-refactor, pr-review, commit-message |
| Code Quality Pack | `code-quality` | skill list | pr-review, safe-refactor, commit-message |

### 🤖 AI Tools

| Name | ID | Source repo | ~Skills |
|---|---|---|---|
| Awesome AI System Prompts | `awesome-ai-system-prompts` | [dontriskit/awesome-ai-system-prompts](https://github.com/dontriskit/awesome-ai-system-prompts) | ~50 |
| AI System Prompts & Models Tools | `ai-system-prompts-models-tools` | [x1xhlol/system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools) | ~30 |

### 💻 Coding

| Name | ID | Source repo | ~Skills |
|---|---|---|---|
| LLM Prompts | `llm-prompts-hailingu` | [hailingu/llm-prompts](https://github.com/hailingu/llm-prompts) | 94 |
| SmetDenis Prompts | `smptdenis-prompts` | [SmetDenis/Prompts](https://github.com/SmetDenis/Prompts) | 78 |

### 🎨 Creative

| Name | ID | Source repo | ~Skills |
|---|---|---|---|
| Prompts for Everything | `prompts-for-everything` | [mlnjsh/prompts-for-everything](https://github.com/mlnjsh/prompts-for-everything) | ~40 |

### 🔒 Security

| Name | ID | Source repo | Skills |
|---|---|---|---|
| Claude BugHunter | `elementalsouls-claude-bughunter` | [elementalsouls/Claude-BugHunter](https://github.com/elementalsouls/Claude-BugHunter) | 88 (measured) |
| Anthropic Cybersecurity Skills | `mukul975-anthropic-cybersecurity-skills` | [mukul975/Anthropic-Cybersecurity-Skills](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) | — |

```bash
# install a bundle
pg bundle install engineering-essentials
pg bundle install elementalsouls-claude-bughunter
```

---

## Submit a Skill

**No PR needed.** Open an issue — the bot validates, commits, and closes it automatically.

### Option A — Issue form (recommended)

1. Open **[New Issue → Skill Submission](../../issues/new?labels=skill-submission&template=skill-submission.yml)**
2. Paste your Gist URL or raw GitHub URL
3. Bot validates and adds it within ~1 minute

### Option B — From CLI

```bash
pg publish ~/.claude/skills-store/my-skill.md
# or with /pg-publish inside Claude Code
```

### Skill format

```markdown
---
name: my-skill
description: One sentence on what this skill does (min 15 chars).
---

# My Skill

## When to use
...

## Steps
1. ...
2. ...

## Example
\`\`\`bash
...
\`\`\`
```

---

## Submit a Bundle

### Option A — GitHub repo bundle

Open **[New Issue → Bundle Submission](../../issues/new?labels=bundle-submission)** with body:

```
Gist: https://gist.github.com/yourname/abc123
```

Where the Gist contains:

```json
{
  "id": "my-bundle",
  "name": "My Bundle",
  "description": "What this bundle contains and who it's for.",
  "repo_url": "owner/repo",
  "tags": ["tag1", "tag2"]
}
```

### Option B — Skill-list bundle

Same issue format, but with `skills` array instead of `repo_url`:

```json
{
  "id": "my-bundle",
  "name": "My Bundle",
  "description": "...",
  "skills": ["systematic-debugging", "pr-review"],
  "tags": ["engineering"]
}
```

---

## Validation rules

The bot rejects a skill if:

| Rule | Detail |
|---|---|
| Too short | < 200 chars |
| Too large | > 100 KB |
| No frontmatter `name` | Must be `lowercase-kebab-case`, 2–64 chars |
| No `description` | Min 15 chars |
| No structure | Must have ≥ 2 headers + bullets/code/numbered steps |
| Low quality | Word diversity < 25% (repeated filler) |
| Duplicate URL | Same source already registered |
| Near-duplicate description | > 80% word overlap with existing skill |
| Security patterns | `curl \| sh`, `rm -rf ~`, `eval(atob(...))`, hardcoded credentials |
| Spam patterns | Ads, shortened URLs, inappropriate content |
| Prompt injection | `ignore previous instructions`, `reveal system prompt` |
| Rate limit | Max 3 submissions per user per 24h |

For bundles with `repo_url`: bot also checks the repo exists (HEAD request) before accepting.

Validate locally:

```bash
pg validate my-skill.md
```

---

## Auto-publish CI

Submissions flow:

```
Issue opened with label "skill-submission" or "bundle-submission"
  → GitHub Actions workflow triggers (main branch only)
  → process-submission.mjs fetches content from Gist/URL
  → validates (content + security + duplicates + rate limit)
  → on pass: commits to registry.json + skills/, closes issue with ✅
  → on fail: posts ❌ comment with reasons, leaves issue open
```

Push race conditions handled with retry logic (up to 5 attempts with exponential backoff).

---

## Related

- 🔍 [promptgraph](https://github.com/NeiP4n/promptgraph) — MCP server
- 📦 [promptgraph-mcp on npm](https://www.npmjs.com/package/promptgraph-mcp)
