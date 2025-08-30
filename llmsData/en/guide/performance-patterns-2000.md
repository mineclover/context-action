---
document_id: en_guide_performance-patterns
category: guide
source_path: en/guide/patterns/store/performance-patterns.md
character_limit: 2000
last_update: '2025-08-30T10:41:53.234Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Performance Patterns

Store Performance Patterns Comprehensive guide to optimizing store performance in Context-Action applications. This overview covers all major performance optimization categories. Performance Categories Memoization Patterns Optimization patterns using React's memoization hooks to prevent unnecessary re-renders and expensive computations: - Stable Selectors: Using useCallback for consistent selector functions - Complex Selector Memoization: Optimizing data transformations - Computed Store Dependencies: Memoizing expensive computation functions Batching Patterns Patterns for batching multiple store updates to prevent unnecessary re-renders: - Store Update Batching: Using React's unstablebatchedUpdates - Store Batch API: Leveraging built-in batch methods - Atomic Operations: Grouping related updates together Subscription Optimization Optimize store subscriptions to reduce unnecessary re-renders: - Selective Subscriptions: Subscribe only to needed data - Conditional Subscriptions: Subs

Key points:
• **Stable Selectors**: Using `useCallback` for consistent selector functions
• **Complex Selector Memoization**: Optimizing data transformations
• **Computed Store Dependencies**: Memoizing expensive computation functions
• **Store Update Batching**: Using React's `unstable_batchedUpdates`
• **Store Batch API**: Leveraging built-in batch methods
• **Atomic Operations**: Grouping related updates together
• **Selective Subscriptions**: Subscribe only to needed data
• **Conditional Subscriptions**: Subscribe only when necessary
• **Debounced Subscriptions**: Handle fast-changing data efficiently
• **Reference...