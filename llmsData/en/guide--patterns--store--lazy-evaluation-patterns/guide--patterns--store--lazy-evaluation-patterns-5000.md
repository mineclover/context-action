---
document_id: guide--patterns--store--lazy-evaluation-patterns
category: guide
source_path: en/guide/patterns/store/lazy-evaluation-patterns.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.222Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Lazy Evaluation Patterns

Lazy Evaluation Patterns Optimization patterns for deferring expensive operations and accessing store values only when needed, improving performance by avoiding unnecessary work. Lazy State Access Access current state at execution time, not render time: Conditional Store Access Only access stores when certain conditions are met: Lazy Computation Patterns Deferred Expensive Calculations Lazy Loading with Stores When to Use Lazy Evaluation Ideal Scenarios - Expensive Operations: When computations are costly and may not be needed - Conditional Logic: When operations depend on runtime conditions - Fresh State Requirements: When you need the most current state at execution time - Resource Conservation: When minimizing unnecessary work is important Performance Benefits - Reduced CPU Usage: Avoid unnecessary calculations - Better Memory Usage: Don't hold onto expensive computed values - Improved Responsiveness: Defer work until actually needed - Fresh Data: Always use current state values Best Practices ✅ Do - Access store values at execution time for event handlers - Use conditional checks before expensive operations - Implement lazy loading for optional or expensive data - Profile to identify expensive operations that can be deferred ❌ Avoid - Accessing store values during render for imperative operations - Performing expensive calculations without checking if they're needed - Caching stale state values when fresh data is required - Over-optimizing simple operations Related Patterns - Memoization Patterns - Cache expensive computations - Subscription Optimization - Optimize when to subscribe - Memory Management - Efficient resource usage - useStoreManager API - Store manager usage patterns

Key points:
• **Expensive Operations**: When computations are costly and may not be needed
• **Conditional Logic**: When operations depend on runtime conditions
• **Fresh State Requirements**: When you need the most current state at execution time
• **Resource Conservation**: When minimizing unnecessary work is important
• **Reduced CPU Usage**: Avoid unnecessary calculations
• **Better Memory Usage**: Don't hold onto expensive computed values
• **Improved Responsiveness**: Defer work until actually needed
• **Fresh Data**: Always use current state values
• Access store values at execution time for event handlers
• Use conditional checks before expensive operations
• Implement lazy loading for optional or expensive data
• Profile to identify expensive operations that can be deferred
• Accessing store values during render for imperative operations
• Performing expensive calculations without checking if they're needed
• Caching stale state values when fresh data is required
• Over-optimizing simple operations
• [Memoization Patterns](./memoization-patterns.md) - Cache expensive computations
• [Subscription Optimization](./subscription-optimization.md) - Optimize when to subscribe
• [Memory Management](./memory-management.md) - Efficient resource usage
• [useStoreManager API](./useStoreManager-api.md) - Store manager usage patterns