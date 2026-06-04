# PromptGraph Registry

The community skill registry for [PromptGraph](https://github.com/NeiP4n/promptgraph) — a semantic skill router for Claude Code.

AI agents browse and install skills from here automatically. You write a skill once, publish it, and anyone using PromptGraph can install it with a single command.

[![skills](https://img.shields.io/badge/skills-4-7C3AED)](#skills)
[![bundles](https://img.shields.io/badge/bundles-2-10B981)](#bundles)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## How It Works

```
registry.json          ← catalog: name, description, download URL, tags
skills/*.md            ← the actual skill files
```

When Claude can't find a good local skill, it browses this registry, picks the best match by semantic search, installs it, and uses it — all automatically.

You can also install manually:

```
install systematic-debugging    ← by name
install pg-a1b2c3               ← by code
install engineering-essentials  ← bundle
```

---

## Skills

| Code | Name | Description | Tags |
|---|---|---|---|
| `pg-6e0e13` | **Systematic Debugging** | Debug any bug methodically: reproduce, isolate, hypothesize, verify, fix | debugging, workflow |
| `pg-f8c3a1` | **Commit Message** | Write clear conventional git commits that explain what changed and why | git, workflow |
| `pg-9d2b7e` | **Safe Refactor** | Refactor without breaking things: tests-first, small steps, commit each move | refactoring |
| `pg-cc1a4f` | **PR Review** | Review pull requests thoroughly: correctness, security, tests, kind feedback | code-review |

---

## Bundles

| Code | Name | Includes |
|---|---|---|
| `pg-eng` | **Engineering Essentials** | systematic-debugging + safe-refactor + pr-review + commit-message |
| `pg-quality` | **Code Quality Pack** | pr-review + safe-refactor + commit-message |

---

## Submit a Skill

1. **Fork** this repo
2. **Add** your skill to `skills/<your-skill-name>.md`:
   ```markdown
   ---
   name: my-skill
   description: One clear sentence on when to use this skill (min 15 chars).
   ---

   # My Skill

   ...actionable instructions...
   ```
3. **Add** an entry to `registry.json`:
   ```json
   {
     "id": "my-skill",
     "name": "My Skill",
     "description": "...",
     "raw_url": "https://raw.githubusercontent.com/NeiP4n/promptgraph-registry/main/skills/my-skill.md",
     "author": "your-github-handle",
     "tags": ["category"],
     "stars": 0
   }
   ```
   > No `code` field needed — each skill's short code (`pg-xxxxxx`) is generated automatically from its id.
4. **Open a PR** — CI validates automatically and blocks junk/unsafe submissions.

---

## Validation Rules

CI rejects a skill if it:

- Has no `name` or `description` in frontmatter
- `name` is not `lowercase-kebab-case` (2–64 chars)
- `description` is under 15 chars
- File is under 200 chars or over 100 KB
- Has a **duplicate name** in the registry
- Contains a **dangerous pattern**:
  - `curl ... | sh` / `wget ... | sh`
  - `rm -rf` on home or root
  - `eval(atob(...))` — obfuscated execution
  - Hardcoded credentials or tokens
  - Exfiltrating env vars over the network
  - Prompt injection: `"ignore previous instructions"`
  - Prompt extraction: `"reveal your system prompt"`
  - Access to `~/.ssh/id_rsa` or `~/.aws/credentials`

Validate locally before submitting:

```bash
npx promptgraph-mcp validate skills/my-skill.md
```

---

## Related

- 🔍 [promptgraph](https://github.com/NeiP4n/promptgraph) — the MCP server that powers skill search and install
- 📦 [promptgraph-mcp on npm](https://www.npmjs.com/package/promptgraph-mcp)

---

*Built with [Claude](https://claude.com/claude-code) by Anthropic.*
