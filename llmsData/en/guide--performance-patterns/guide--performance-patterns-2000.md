---
document_id: guide--performance-patterns
category: guide
source_path: en/guide/patterns/store/performance-patterns.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.313Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Performance Patterns

Performance optimization patterns for store hooks including memoization, batching, debugging, and best practices. Memoization Strategies

Stable Selectors with useCallback

Complex Selector Memoization

Memoized Computed Store Dependencies

Batched Updates

Store Update Batching

Store Batch API

Lazy Evaluation Patterns

Lazy State Access

Conditional Store Access

Subscription Optimization

Selective Subscriptions

Conditional Subscriptions

Debounced Subscriptions

Comparison Strategy Optimization

Reference Comparison (Fastest)

Shallow Comparison (Balanced)

Deep Comparison (Most Accurate)

Custom Comparison

Memory Management

Cleanup Subscriptions

Weak References for Large Data

Debugging and Development

Debug Mode for Stores

Performance Monitoring

Store State Inspection

Real-World Optimization Examples

Optimized User Dashboard

High-Performance Data Table

Best Practices Summary

✅ Do

- Use useCallback for stable selectors
- Batch multiple store updates
- Choose appropriate comparison strategies
- Enable debug mode in development
- Monitor performance in complex applications
- Use lazy evaluation for expensive operations

❌ Avoid

- Creating new functions in selectors on every render
- Deep comparisons unless absolutely necessary
- Subscribing to entire large objects when only parts are needed
- Ignoring subscription cleanup
- Side effects in computed values
- Excessive debugging in production

Related Patterns

- useStoreValue Patterns - Basic subscription patterns
- useStoreSelector Patterns - Multiple store selection
- useComputedStore Patterns - Computed value patterns.
