---
name: prompt-architect
description: Design clear, testable prompts for AI agents and workflows. Use when creating new prompts, refining weak ones, or building reusable prompt templates.
---

# Prompt Architect

## Build sequence
1. **Objective** — one sentence: what should the AI produce?
2. **Audience** — who reads the output? (user / another AI / a system)
3. **Constraints** — format, length, tools allowed, things to avoid
4. **Success criteria** — how do you know it worked?
5. **Failure handling** — what if information is missing or task is ambiguous?

## Quality checklist
- [ ] Task scope is explicit and bounded
- [ ] Required output format is unambiguous
- [ ] Constraints are actionable (not aspirational like "be helpful")
- [ ] There's a fallback for missing information
- [ ] Examples are included (at least one good, one bad)

## Common anti-patterns
| Anti-pattern | Fix |
|---|---|
| "Be concise" | "Answer in ≤3 bullet points" |
| "Do your best" | List explicit steps |
| No examples | Add 1-2 input/output pairs |
| Vague output format | Show exact structure |
| No failure mode | Add "If X is unclear, ask before proceeding" |

## Template
```
You are [role]. Your task is [specific action].

Input: [what you receive]
Output: [exact format]
Constraints: [hard limits]
When unsure: [fallback behavior]

Example:
Input: ...
Output: ...
```

## Iteration loop
Write → test with 3 different inputs → note failures → fix the weakest part → repeat
