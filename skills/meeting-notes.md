---
name: meeting-notes
description: Turn raw meeting transcripts or bullet notes into structured, actionable minutes. Use after any meeting that needs decisions and next steps captured.
---

# Meeting Notes

## Input
- Raw transcript, voice memo text, or rough bullets
- Meeting type (standup / planning / retrospective / 1:1 / stakeholder)
- Attendees list (optional)

## Output format

```markdown
# [Meeting Title] — [Date]
**Attendees:** ...
**Duration:** ...

## Summary
[2-3 sentences — what was this meeting about and what was decided]

## Decisions
- [Decision 1] — owner: [name]
- [Decision 2] — owner: [name]

## Action Items
| Task | Owner | Due |
|------|-------|-----|
| ... | ... | ... |

## Key Discussion Points
- [topic]: [what was said / agreed]

## Parking Lot (deferred)
- ...

## Next meeting
[Date, agenda items]
```

## Rules
- Every decision gets an owner — anonymous decisions don't get done
- Every action item gets a due date — "ASAP" means never
- Parking lot is mandatory — do not lose deferred topics
- Send within 24 hours of meeting

## Special modes

**Standup:** Focus only on blockers and what changed since yesterday.

**Retrospective:** Separate What went well / What didn't / Experiments to try.

**1:1:** Capture goals discussed, feedback given, personal commitments.
