---
document_id: guide--patterns--store--comparison-strategies
category: guide
source_path: en/guide/patterns/store/comparison-strategies.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.207Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Comparison Strategies

Comparison Strategies Optimization patterns for choosing the right comparison strategy in store subscriptions to balance performance and accuracy. Reference Comparison (Fastest) Use reference comparison for primitive values or when exact object reference matters: Best for: - Primitive values (string, number, boolean) - When object references are carefully managed - Maximum performan

Key points:
• Primitive values (string, number, boolean)
• When object references are carefully managed
• Maximum performance requirements
• Objects with first-level property changes
• Configuration objects
• Most common use...