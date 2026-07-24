---
document_id: guide--patterns--store--comparison-strategies
category: guide
source_path: en/guide/patterns/store/comparison-strategies.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.207Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Comparison Strategies

Comparison Strategies Optimization patterns for choosing the right comparison strategy in store subscriptions to balance performance and accuracy. Reference Comparison (Fastest) Use reference comparison for primitive values or when exact object reference matters: Best for: - Primitive values (string, number, boolean) - When object references are carefully managed - Maximum performance requirements Shallow Comparison (Balanced) Use shallow comparison for objects with shallow changes: Best for: - Objects with first-level property changes - Configuration objects - Most common use cases where deep nesting isn't a concern Deep Comparison (Most Accurate) Use deep comparison only when necessary for complex nested objects: Best for: - Complex nested object structures - When accuracy is more important than performance - Data with unpredictable nesting levels Custom Comparison Create custom comparators for specific business logic: Best for: - Specific business logic requirements -

Key points:
• Primitive values (string, number, boolean)
• When object references are carefully managed
• Maximum performance requirements
• Objects with first-level property changes
• Configuration objects
• Most common use cases where deep nesting isn't a concern
• Complex nested object structures
• When accuracy is more important than performance
• Data with unpredictable nesting levels
• Specific business logic requirements
• When only certain fields matter for updates
• Performance optimization for known data structures
• Start with reference comparison and upgrade as needed
• Use shallow comparison for most object...