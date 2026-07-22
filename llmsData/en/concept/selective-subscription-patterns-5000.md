---
document_id: en_concept_selective-subscription-patterns
category: concept
source_path: en/concept/selective-subscription-patterns.md
character_limit: 5000
last_update: '2025-08-30T10:42:24.459Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Selective Subscription Patterns

Selective Subscription Patterns Pre-memoization optimization: Strategic subscription management that eliminates unnecessary reactive subscriptions before memoization becomes necessary. Overview Selective Subscription Patterns represent a pre-memoization optimization strategy that optimizes performance by eliminating unnecessary reactive subscriptions before they occur. Instead of managing expensive memoization chains, this approach strategically chooses between reactive and non-reactive data access patterns, transforming stores from reactive state managers into pure data repositories when visual updates don't require React re-renders. Philosophy: Subscription Optimization First Rather than optimizing after the fact with memoization techniques, selective subscription patterns prevent performance bottlenecks at their source: Core Concepts 1. Store as Data Repository Pattern Transform stores from reactive state managers into pure data storage: 2. RefContext Direct Manipulation Use RefContext for visual updates that bypass React entirely: 3. Conditional Subscription Strategy Apply selective patterns based on use case requirements: Implementation Patterns Pattern 1: Non-Reactive Canvas Control For high-performance graphics and animations: Pattern 2: Selective Metrics Subscription For performance dashboards and debugging: Pattern 3: Hybrid Architecture Toggle For comparative performance testing: Store Data Access Patterns Non-Reactive Store Access Hook Performance Comparison Traditional Reactive Pattern Impact: 60 React re-renders per second for mouse tracking Non-Reactive Selective Pattern Impact: 0 React re-renders + 60fps GPU-accelerated visuals Architecture Guidelines When to Use Non-Reactive Patterns 1. High-frequency visual updates (animations, real-time graphics) 2. Performance-critical interactions (games, drawing apps) 3. Large-scale data visualization (charts, dashboards) 4. Memory-constrained environments (mobile, embedded) When to Use Reactive Patterns 1. Form state management (user inputs, validation) 2. UI component state (modals, dropdowns, toggles) 3. Business logic state (user profiles, settings) 4. Low-frequency updates (notifications, status messages) When to Use Manual Patterns 1. Debugging and development (store inspection, logging) 2. Admin interfaces (system monitoring, analytics) 3. Batch operations (data export, bulk updates) 4. Performance profiling (metrics collection, benchmarking) Best Practices 1. Clear Pattern Separation 2. Performance Monitoring 3. Documentation of Pattern Choice Troubleshooting Common Issues and Solutions See Performance Issues Troubleshooting for detailed debugging guidance. Memory Management Related Patterns - RefContext Guide - Direct DOM manipulation patterns - Store Patterns - Traditional

Key points:
• [RefContext Guide](./react-refs-guide.md) - Direct DOM manipulation patterns
• [Store Patterns](./pattern-guide.md#store-patterns) - Traditional reactive patterns
• [Performance Optimization](../guide/best-practices.md#performance-optimization) - General performance guidelines
• [MVVM Architecture](./mvvm-core-architecture.md) - Architectural context
• [Enhanced Context Store Demo](../../example/src/pages/performance/mouse-events/enhanced-context-store/) - Production example
• [Canvas Performance Comparison](../examples/selective-subscription.md) - Benchmarking examples
• [Architecture Toggle Implementation](../examples/pattern-comparison.md) - Hybrid patterns
• **High-frequency visual updates** (animations, real-time graphics)
• **Performance-critical interactions** (games, drawing apps)
• **Large-scale data visualization** (charts, dashboards)
• **Memory-constrained environments** (mobile, embedded)
• **Form state management** (user inputs, validation)
• **UI component state** (modals, dropdowns, toggles)
• **Business logic state** (user profiles, settings)
• **Low-frequency updates** (notifications, status messages)
• **Debugging and development** (store inspection, logging)
• **Admin interfaces** (system monitoring, analytics)
• **Batch operations** (data export, bulk updates)
• **Performance profiling** (metrics collection, benchmarking)