---
name: user-story
description: Write well-formed user stories with acceptance criteria and story points estimate. Use when breaking down features for sprint planning or backlog grooming.
---

# User Story

## Story format
```
As a [specific user role],
I want to [concrete action/capability],
So that [measurable business/user outcome].
```

## Acceptance criteria (Given-When-Then)
```
Given [initial context / precondition]
When [user action or event]
Then [expected outcome]
And [additional outcome if needed]
```

## Story card template
```markdown
## Story: [Title]
**ID:** US-[number]
**Priority:** P0 | P1 | P2
**Points:** [Fibonacci: 1, 2, 3, 5, 8, 13]

### User Story
As a [role], I want [action] so that [outcome].

### Acceptance Criteria
- [ ] Given ... When ... Then ...
- [ ] Given ... When ... Then ...
- [ ] Edge case: ...

### Out of scope
- ...

### Dependencies
- Blocked by: [US-N or tech work]
- Blocks: [US-N]

### Notes
[Anything that doesn't fit above]
```

## Story point guide
| Points | Meaning |
|---|---|
| 1 | Trivial — a few lines, known exactly how |
| 2 | Small — clear path, 1-2 hours |
| 3 | Medium — some unknowns, half a day |
| 5 | Large — multiple components, might need spike |
| 8 | Very large — should probably split |
| 13 | Epic — definitely split |

## INVEST checklist
Good stories are:
- **I**ndependent — can be built without another story
- **N**egotiable — scope can flex
- **V**aluable — delivers something to a user
- **E**stimable — team can size it
- **S**mall — fits in one sprint
- **T**estable — acceptance criteria are verifiable

## Splitting strategies
Too big? Split by:
- User role (power user vs new user)
- Data type (images vs documents vs text)
- CRUD operation (create first, edit later)
- Happy path vs edge cases
- UI first, then API, then integration
