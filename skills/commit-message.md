---
name: commit-message
description: Write clear, conventional git commit messages. Use when committing changes, writing a commit, or cleaning up commit history. Produces Conventional Commits format with a focused subject and a body that explains why.
---

# Commit Message

A good commit message explains **what changed and why** so the next person (often you) understands it in six months.

## Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type** — one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- **scope** (optional) — the area touched, e.g. `auth`, `api`, `parser`
- **subject** — imperative, lowercase, no period, ≤ 50 chars: "add", not "added"/"adds"
- **body** (optional) — wrap at 72 chars, explain *why* not *how*, separated by a blank line
- **footer** (optional) — `BREAKING CHANGE:`, issue refs like `Closes #123`

## Rules

- Subject in the imperative mood: "fix bug", as if completing "If applied, this commit will ___".
- One logical change per commit. If you wrote "and" in the subject, consider splitting.
- Explain the **why**, not the diff — the diff already shows what changed.
- Reference issues/tickets in the footer.
- Mark breaking changes explicitly with `BREAKING CHANGE:` in the footer.

## Examples

```
feat(auth): add refresh-token rotation

Access tokens were long-lived, so a leaked token stayed valid for days.
Rotate refresh tokens on every use and revoke the old one to limit the
blast radius of a leak.

Closes #214
```

```
fix(parser): handle empty frontmatter without crashing

gray-matter threw on files with `---\n---`. Guard the parse and fall
back to filename-derived metadata.
```

```
refactor(search): extract rating boost into shared helper

No behavior change. Removes duplication between the ANN and brute-force
code paths so they can't drift.
```

## Anti-patterns

- "fix bug", "update", "changes", "wip", "asdf" — say *what* and *why*.
- Committing unrelated changes together.
- Describing the how ("changed line 42") instead of the why.
- Past tense ("added") or present-tense-3rd-person ("adds") in the subject.
