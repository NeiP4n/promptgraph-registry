---
name: growth-experiment
description: Design and analyze growth experiments — A/B tests, feature flags, conversion funnels. Use when running product experiments or interpreting test results.
---

# Growth Experiment

## Design phase (before running)

### Hypothesis format
```
We believe [change] will cause [metric] to [increase/decrease] by [X%]
because [reason based on user behavior/data].
We'll know this worked when [measurable outcome] within [timeframe].
```

### Experiment brief
- **What:** exact change being tested
- **Who:** which user segment sees the variant
- **Sample size:** minimum for statistical significance (use calculator)
- **Duration:** minimum 2 business cycles to avoid day-of-week bias
- **Primary metric:** single north star metric for this test
- **Guard rails:** metrics that must NOT drop (revenue, retention, etc.)
- **Rollback trigger:** if [guard rail metric] drops >X%, stop test

### Statistical requirements
- Minimum detectable effect: [%]
- Statistical power: 80% minimum
- Significance threshold: p < 0.05
- Sample size per variant: [calculated]

## Analysis phase (after running)

### Result interpretation
```
Control: [metric] = X (n = ...)
Variant: [metric] = Y (n = ...)
Lift: [(Y-X)/X]%
p-value: ...
Confidence interval: [lower, upper]%
```

### Decision framework
| Outcome | Action |
|---|---|
| Significant positive, guard rails green | Ship |
| Significant positive, guard rail hit | Investigate, likely don't ship |
| No significant difference | Discard idea or iterate |
| Significant negative | Kill, learn why |

### Learnings doc
Always write:
1. What we expected
2. What we found
3. Why (hypothesis for the result)
4. Next experiment to run

## Common mistakes
- Running test too short (< 2 weeks for weekly patterns)
- Changing the test mid-run
- Testing too many things at once
- Calling results early when trending positive
- Ignoring segment breakdowns (test may work for some users, hurt others)
