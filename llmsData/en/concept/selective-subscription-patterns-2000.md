---
document_id: en_concept_selective-subscription-patterns
category: concept
source_path: en/concept/selective-subscription-patterns.md
character_limit: 2000
last_update: '2025-08-30T10:42:24.458Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Selective Subscription Patterns

Selective Subscription Patterns Pre-memoization optimization: Strategic subscription management that eliminates unnecessary reactive subscriptions before memoization becomes necessary. Overview Selective Subscription Patterns represent a pre-memoization optimization strategy that optimizes performance by eliminating unnecessary reactive subscriptions before they occur. Instead of managing expensive memoization chains, this approach strategically chooses between reactive and non-reactive data access patterns, transforming stores from reactive state managers into pure data repositories when visual updates don't require React re-renders. Philosophy: Subscription Optimization First Rather than optimizing after the fact with memoization techniques, selective subscription patterns prevent performance bottlenecks at their source: Core Concepts 1. Store as Data Repository Pattern Transform stores from reactive state managers into pure data storage: 2. RefContext Direct Manipulatio

Key points:
• [RefContext Guide](./react-refs-guide.md) - Direct DOM manipulation patterns
• [Store Patterns](./pattern-guide.md#store-patterns) - Traditional reactive patterns
• [Performance Optimization](../guide/best-practices.md#performance-optimization) - General performance guidelines
• [MVVM Architecture](./mvvm-core-architecture.md) - Architectural context
• [Enhanced Context Store Demo](../../example/src/pages/performance/mouse-events/enhanced-context-store/) - Production example
• [Canvas Performance Comparison](../examples/selective-subscription.md) - Benchmarking examples
• [Architecture Toggle...