---
name: pr-review
description: Review a pull request thoroughly and constructively. Use when reviewing a PR, a diff, or someone's code changes. Covers correctness, security, tests, readability, and how to give feedback that helps instead of stings.
---

# PR Review

A good review makes the code better AND keeps the author motivated. Be rigorous on the code, kind to the person.

## Review in passes — don't mix them

### Pass 1 — Understand
- Read the PR description. What problem does it solve? What's the intended approach?
- If you can't tell what it does or why, that's the first comment: ask for context.

### Pass 2 — Correctness (most important)
- Does it actually do what it claims?
- Edge cases: empty input, null/undefined, zero, negative, huge, concurrent, unicode.
- Error handling: are failures caught, logged, surfaced — not silently swallowed?
- Off-by-one, boundary conditions, wrong operator (`&&` vs `||`, `=` vs `==`).
- Does it break existing behavior? Backward compatibility?

### Pass 3 — Security
- Untrusted input validated/sanitized before use (SQL, shell, HTML, path)?
- Secrets/keys not hardcoded or logged?
- AuthN/AuthZ checks on new endpoints?
- Injection, SSRF, path traversal, deserialization of untrusted data?

### Pass 4 — Tests
- Do new tests cover the new behavior, including failure paths?
- Would the tests actually fail if the code were wrong? (No assertion-free tests.)
- Is there a regression test for the bug this PR fixes?

### Pass 5 — Readability & design
- Will someone understand this in 6 months? Names tell the truth?
- Unnecessary complexity, premature abstraction, copy-paste?
- Does it fit the existing patterns of the codebase?

## How to comment

- **Distinguish blocking from optional.** Prefix nits clearly: `nit:` = take it or leave it; no prefix = please address.
- **Explain why, not just what.** "This can NPE if `user` is null on the logged-out path" beats "add a null check."
- **Ask, don't command, when unsure.** "Could this race if two requests arrive together?" invites discussion.
- **Praise good things.** Point out a clean solution — reviews shouldn't be only negatives.
- **Suggest, don't rewrite.** Offer the idea; let the author own the code.
- **Review the code, never the coder.** "This function does X" not "you always do X."

## Approve / Request-changes / Comment

- **Approve** — correct, safe, tested, readable. Minor nits are fine to approve-with-comments.
- **Request changes** — a real correctness, security, or missing-test problem. Say exactly what must change.
- **Comment** — questions or non-blocking thoughts; you're not gating the merge.

## Red flags that always block

- No tests for new logic.
- Secrets in the diff.
- Silent catch that hides errors.
- "Temporary" hack with no follow-up issue.
- A huge unrelated change smuggled into a focused PR.
