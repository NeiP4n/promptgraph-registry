---
name: decision-log
description: Record an architectural, product, or business decision as an ADR (Architecture Decision Record). Use whenever making a significant choice that others need context on later.
---

# Decision Log (ADR)

## Template

```markdown
# ADR-[number]: [Short decision title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-[N]
**Deciders:** [names or roles]

## Context
What situation forced us to make a choice?
What constraints exist (technical, business, time, cost)?
What happens if we don't decide?

## Options Considered

### Option 1: [Name]
**Description:** ...
**Pros:**
- ...
**Cons:**
- ...
**Cost/effort:** ...

### Option 2: [Name]
**Description:** ...
**Pros:**
- ...
**Cons:**
- ...
**Cost/effort:** ...

## Decision
We chose **[Option N]** because [2-3 sentence rationale linking back to context and constraints].

## Consequences

**Positive:**
- ...

**Negative / trade-offs:**
- ...

**Risks:**
- [Risk] — mitigation: [how we'll handle it]

## Review trigger
Re-evaluate this decision if: [specific condition, e.g., "user load exceeds 100k/day" or "team grows beyond 10 engineers"]
```

## Filing rules
- Number ADRs sequentially (ADR-001, ADR-002...)
- Store in `/docs/decisions/` or `/adr/`
- Never delete — mark as Deprecated instead
- Link from relevant code with `# See ADR-042`

## When to write one
- Choosing a database, framework, or major library
- Architectural pattern decisions (monolith vs microservices, sync vs async)
- Security model choices
- Any decision where "why did we do this?" will be asked in 6 months
