---
name: tdd-workflow
description: Write tests first, then code. Red → Green → Refactor loop. Use when building new features or fixing bugs to guarantee correctness and prevent regressions.
---

# TDD Workflow

## Loop: Red → Green → Refactor

### Red — write a failing test
- Write the smallest test that captures what you want to build
- Run it — confirm it fails for the RIGHT reason (not a setup error)
- Name: `test_<what>_<when>_<expected>`

### Green — make it pass (minimally)
- Write only enough code to pass the test
- No optimization, no premature abstraction
- Run the full suite — only this test should go green

### Refactor — clean up
- Remove duplication
- Extract clear abstractions
- Run the suite again — all tests must still pass

## Rules
- One failing test at a time
- Tests are documentation — name them to read like specs
- If test is hard to write, the design is wrong — fix design first
- Never refactor on red

## Test structure (AAA)
```
Arrange  — set up the scenario
Act      — call the code under test
Assert   — verify the outcome
```

## Coverage targets
- New features: test-first, 100% of new paths
- Bug fixes: write a test that reproduces the bug BEFORE fixing
- Legacy code: characterization tests before any refactor

## When to stop
Stop adding tests when you can't think of a case that would fail. Then refactor.
