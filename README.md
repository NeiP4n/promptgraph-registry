# PromptGraph Registry

Community skill registry for [PromptGraph](https://github.com/NeiP4n/promptgraph).

AI agents browse and install skills from here automatically via the `promptgraph-mcp` marketplace tools.

## How it works

```
registry.json  ->  catalog of available skills (name, description, download URL)
skills/*.md    ->  the actual skill files
```

When an agent can't find a good local skill, it browses this registry, installs the best match, and uses it.

## Submitting a skill

1. Fork this repo
2. Add your skill to `skills/<your-skill-name>.md` with valid frontmatter:
   ```markdown
   ---
   name: my-skill
   description: One clear sentence on when to use this skill (min 15 chars).
   ---

   # My Skill
   ...actionable instructions...
   ```
3. Add an entry to `registry.json`:
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
   > **No `code` field needed.** Each skill's short code (`pg-xxxxxx`) is auto-generated
   > deterministically from its `id`, so it's stable and unique without manual assignment.
   > Users install with `install <code>`, `install <id>`, or `install <name>` — all work.
4. Open a PR. CI validates automatically.

## Validation requirements (enforced by CI)

A skill is **rejected** if it:

- Has no `name` or `description` in frontmatter
- `name` is not lowercase-kebab-case (2-64 chars)
- `description` is under 15 chars
- File is under 200 chars or over 100KB
- Has a **duplicate name**
- Contains a **dangerous pattern**:
  - `curl ... | sh` / `wget ... | sh`
  - `rm -rf` on home/root
  - obfuscated execution `eval(atob(...))`
  - hardcoded credentials
  - env-var exfiltration over network
  - **prompt injection** ("ignore previous instructions")
  - **prompt extraction** ("reveal your system prompt")
  - access to `~/.ssh/id_rsa`, `~/.aws/credentials`

Validate locally before submitting:

```bash
npx promptgraph-mcp validate skills/my-skill.md
```

## License

MIT

---

*Built with [Claude](https://claude.com/claude-code) by Anthropic.*
