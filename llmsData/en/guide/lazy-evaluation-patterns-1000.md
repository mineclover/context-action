---
document_id: en_guide_lazy-evaluation-patterns
category: guide
source_path: en/guide/patterns/store/lazy-evaluation-patterns.md
character_limit: 1000
last_update: '2025-08-30T10:41:59.958Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Lazy Evaluation Patterns

Lazy Evaluation Patterns Optimization patterns for deferring expensive operations and accessing store values only when needed, improving performance by avoiding unnecessary work. Lazy State Access Access current state at execution time, not render time: Conditional Store Access Only access stores when certain conditions are met: Lazy Computation Patterns Deferred Expensive Calculations L

Key points:
• **Expensive Operations**: When computations are costly and may not be needed
• **Conditional Logic**: When operations depend on runtime conditions
• **Fresh State Requirements**: When you need the most current state...