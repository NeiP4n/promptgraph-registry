---
name: deep-research
description: Conduct comprehensive research on any topic — clarifying questions, structured web search, synthesis with sources. Use when you need in-depth analysis, not a quick answer.
---

# Deep Research

## When to trigger
- User asks for comprehensive research, analysis, or investigation
- Topic needs current information (trends, comparisons, state-of-the-art)
- User provides a brief query that needs expansion before answering

## Protocol

### 1. Clarify (if query is vague)
Ask 2-3 targeted questions before starting:
- What depth? (overview / expert-level)
- What angle? (technical / business / historical)
- What format? (report / bullet summary / comparison table)

### 2. Research plan
List 4-6 specific sub-questions to answer. Share the plan — user can adjust.

### 3. Search + gather
- Use WebSearch for each sub-question separately
- Cross-reference at least 2 independent sources per claim
- Note publication dates — flag info older than 12 months on fast-moving topics

### 4. Synthesize
Structure output:
```
## TL;DR (3-5 sentences)
## Key Findings
## Detailed Analysis
## Open Questions / Limitations
## Sources
```

### 5. Confidence markers
- ✅ confirmed by 2+ sources
- ⚠️ single source or contested
- ❓ couldn't verify

## Anti-patterns
- Do NOT summarize search result titles without reading content
- Do NOT present a single source as consensus
- Do NOT skip the synthesis step — raw links are not research
