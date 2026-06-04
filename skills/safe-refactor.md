---
name: safe-refactor
description: Refactor code without breaking it. Use when cleaning up messy code, reducing duplication, renaming, extracting functions, or restructuring. Enforces tests-first, small steps, behavior-preserving changes.
---

# Safe Refactor

Refactoring changes structure, **not behavior**. If behavior changes, it's not a refactor — it's a rewrite, and it needs a different review.

## Before you touch anything

1. **Have a safety net.** Tests must exist and pass first. If there are no tests, write characterization tests that capture current behavior — even if that behavior is weird. You're locking in "what it does now," not "what it should do."
2. **Commit a clean baseline.** Refactor from a green, committed state so you can always reset.
3. **Know your goal.** "Make it cleaner" is not a goal. "Extract the validation logic so it can be reused and tested" is.

## The discipline

- **One refactoring at a time.** Rename, then commit. Extract, then commit. Don't rename + extract + reorder in one diff — if something breaks you won't know which move did it.
- **Run tests after every step.** Green → next step. Red → undo the last step, not the last hour.
- **Keep behavior identical.** Same inputs → same outputs, same side effects, same errors. No "while I'm here" feature tweaks.
- **Separate refactor commits from feature commits.** A reviewer should never have to untangle "what's a move" from "what's new logic."

## Common safe moves

- **Extract function/variable** — name a thing to explain it.
- **Inline** — remove a pointless indirection.
- **Rename** — make the name tell the truth. Use the IDE's rename, not find-replace.
- **Replace magic number/string with a named constant.**
- **Guard clause** — flatten nested `if`s by returning early.
- **Remove dead code** — but confirm it's truly unreachable first (grep all callers).
- **Dedupe** — pull repeated logic into one place *only* when the duplicates are truly the same concept, not coincidentally similar.

## Stop signals

- You can't keep the tests green → revert, the refactor is bigger than you thought; break it down.
- You're tempted to "fix a bug while here" → stop, do it as a separate change with its own test.
- The diff is huge → you skipped the "commit after each step" rule. Reset and go smaller.
- You're deduping two things that might diverge later → premature. Leave them.

## After

- All tests still green.
- Behavior provably unchanged (same test outcomes, no new/removed assertions).
- Each commit is one coherent move with a clear message.
