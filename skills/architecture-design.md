---
name: architecture-design
description: Design system architecture from requirements — components, data flow, tradeoffs, ADRs. Use at project start or when making a major structural decision.
---

# Architecture Design

## Input needed
- What the system does (core function)
- Scale requirements (users, data volume, latency targets)
- Constraints (team size, existing stack, budget, compliance)
- Non-functional requirements (availability, consistency, security)

## Design process

### 1. Requirements → Quality attributes
Map requirements to measurable attributes:
| Requirement | Attribute | Target |
|---|---|---|
| "fast" | P99 latency | < 200ms |
| "always up" | Availability | 99.9% |
| "handles load" | Throughput | 10k req/s |

### 2. Component diagram
- Identify: clients / API layer / services / data stores / external deps
- Draw data flow (not call graph)
- Mark: sync vs async, internal vs external, stateful vs stateless

### 3. Data model
- Core entities and relationships
- Where each entity lives (which service owns it)
- Consistency requirements (strong / eventual)

### 4. Key tradeoffs
For each major decision, write an ADR:
```markdown
## Decision: [title]
**Status:** Proposed | Accepted | Deprecated
**Context:** Why is this decision needed?
**Options considered:**
1. Option A — pros / cons
2. Option B — pros / cons
**Decision:** We chose [X] because [reason]
**Consequences:** What gets harder, what gets easier
```

### 5. Failure modes
- What breaks if service X goes down?
- What's the data loss window?
- How does the system degrade gracefully?

## Output
- Component diagram (ASCII or Mermaid)
- Data flow diagram
- ADRs for top 3-5 decisions
- Open questions requiring stakeholder input

## Red flags in a design
- Single point of failure with no mitigation
- Synchronous calls to unreliable external services without timeout/circuit breaker
- All data in one database with no sharding plan at scale
- Auth mixed into business logic
