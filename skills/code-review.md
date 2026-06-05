---
name: code-review
description: Review a diff or file for correctness, security, performance, and maintainability. Returns prioritized findings with severity and suggested fix.
---

# Code Review

## Priority levels
- 🔴 **P0 — Block**: correctness bug, security hole, data loss risk. Must fix before merge.
- 🟠 **P1 — Should fix**: performance issue, error handling gap, unclear logic.
- 🟡 **P2 — Consider**: style, naming, missing test, mild duplication.
- 💬 **Nit**: purely optional micro-improvements.

## Review checklist

### Correctness
- [ ] Off-by-one errors, null/undefined dereferences
- [ ] Race conditions in async code
- [ ] Edge cases: empty input, max values, concurrent access
- [ ] Error paths handled (not just happy path)

### Security
- [ ] SQL injection / command injection / XSS
- [ ] Secrets hardcoded or logged
- [ ] Auth checks present and correct
- [ ] Input validated before use

### Performance
- [ ] N+1 queries
- [ ] Unnecessary loops inside loops
- [ ] Blocking calls in async context
- [ ] Missing indexes on queried columns

### Maintainability
- [ ] Functions do one thing
- [ ] Names explain intent (not implementation)
- [ ] No commented-out code
- [ ] Tests cover new logic

## Output format
```
## Summary
[1-2 sentences — overall assessment]

## Findings

### 🔴 [Issue title]
**File:** `path/to/file.js:42`
**Problem:** ...
**Fix:** ...

### 🟡 [Issue title]
...

## Positives
[What's done well — always include at least one]
```

## Tone rules
- Describe the problem, not the person
- Suggest, don't command on P2/Nits
- Explain WHY something is an issue, not just that it is
