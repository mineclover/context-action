---
document_id: en_guide_subscription-optimization
category: guide
source_path: en/guide/patterns/store/subscription-optimization.md
character_limit: 1000
last_update: '2025-08-30T10:42:00.438Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Subscription Optimization

Subscription Optimization Patterns for optimizing store subscriptions to reduce unnecessary re-renders and improve performance through selective and conditional subscriptions. Selective Subscriptions Choose what data to subscribe to carefully: Conditional Subscriptions Only subscribe when the data is actually needed: Debounced Subscriptions Debounce rapid changes to prevent excessive up

Key points:
• **Related Data**: When fields are logically related and often used together
• **Update Patterns**: When fields typically change together
• **Component Needs**: When a component needs multiple related fields
•...