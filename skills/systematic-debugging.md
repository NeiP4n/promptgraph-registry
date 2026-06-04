---
name: systematic-debugging
description: Debug any bug methodically instead of guessing. Use when stuck on an error, a failing test, unexpected behavior, or a "works on my machine" problem. Forces reproduce → isolate → hypothesize → verify → fix → confirm.
---

# Systematic Debugging

Stop guessing. Bugs are solved by narrowing the search space, not by trying random fixes.

## The loop

### 1. Reproduce
- Get a **reliable, minimal** reproduction. If you can't reproduce it on demand, you can't fix it.
- Write down the exact steps, inputs, and environment.
- If it's intermittent — find what makes it more frequent (load, timing, specific data).

### 2. Isolate
- Binary-search the problem space. Cut the system in half: is the bug before or after this point?
- Check the **boundary**: last known-good state vs first bad state.
- Remove variables one at a time. Disable half the code/config/inputs and see if the bug survives.
- Read the actual error and stack trace **top to bottom** — the first error is usually the real one, later ones are cascades.

### 3. Hypothesize
- State a **specific, falsifiable** guess: "X is null because Y returns undefined when Z."
- Predict what you'd observe if the hypothesis is true.

### 4. Verify
- Add a targeted log/breakpoint that confirms or kills the hypothesis. Don't fix yet — confirm first.
- If the hypothesis is wrong, that's progress: you eliminated a cause. Form the next one.

### 5. Fix
- Fix the **root cause**, not the symptom. A `try/catch` that hides the error is not a fix.
- Make the smallest change that addresses the confirmed cause.

### 6. Confirm
- Reproduce the original steps — the bug is gone.
- Check you didn't break anything adjacent (run the tests).
- Add a regression test that would have caught this bug.

## Anti-patterns to avoid

- **Shotgun debugging** — changing many things at once. You won't know what fixed it.
- **Fixing the symptom** — silencing the error instead of understanding it.
- **Assuming** — "it can't be that" is how you waste an hour. Verify, don't assume.
- **Not reading the error** — the message often says exactly what's wrong.

## When truly stuck

- Explain the problem out loud / in writing (rubber-duck). Stating it often reveals the flaw.
- Question your assumptions about what the code/library/API *actually* does — read the source.
- Check the dumbest things: typo, wrong file, stale cache, not saved, wrong environment, old build.
- Take a break. Fresh eyes find bugs.
