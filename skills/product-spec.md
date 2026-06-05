---
name: product-spec
description: Write a complete product requirements document (PRD) from a rough idea. Use when starting a new feature, project, or product to align everyone before building.
---

# Product Spec

## Output structure

```markdown
# [Feature/Product Name]

## Problem
What pain exists? Who has it? How do we know it's real?

## Goal
One sentence: what does success look like in 3 months?

## Non-goals
Explicitly list what this does NOT cover.

## Users
Primary: [who, job-to-be-done]
Secondary: [who else touches this]

## User Stories
- As a [user], I want to [action] so that [outcome]
- (3-5 stories for MVP, ranked by priority)

## Functional Requirements
Must-have (P0):
- [ ] ...
Should-have (P1):
- [ ] ...
Nice-to-have (P2):
- [ ] ...

## Technical Constraints
- Platform: ...
- Performance: ...
- Security/Privacy: ...
- Dependencies: ...

## Success Metrics
- Primary: [measurable KPI]
- Secondary: [supporting signals]
- Anti-metric: [what should NOT happen]

## Open Questions
- [ ] ...

## Out of scope
- ...
```

## Process
1. Fill in Problem and Goal first — if you can't, you're not ready to spec
2. Write Non-goals before Requirements — scope creep starts here
3. Get one engineer and one customer to read it before finalizing
4. Revisit Open Questions weekly until answered

## Signs the spec is good
- An engineer can start building without asking you questions
- A customer could recognize their pain in the Problem section
- You can say no to a request by pointing to Non-goals
