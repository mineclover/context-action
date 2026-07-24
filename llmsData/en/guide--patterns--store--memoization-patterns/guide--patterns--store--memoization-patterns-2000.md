---
document_id: guide--patterns--store--memoization-patterns
category: guide
source_path: en/guide/patterns/store/memoization-patterns.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.225Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Memoization Patterns

Memoization Patterns Optimization patterns using React's memoization hooks to prevent unnecessary re-renders and expensive computations in store subscriptions. Stable Selectors with useCallback Use useCallback to create stable selector functions that prevent unnecessary re-renders: Complex Selector Memoization For complex data transformations, memoize the selector to avoid expensive computations on every render: Memoized Computed Store Dependencies Use useMemo for expensive computation functions in useComputedStore: Best Practices ✅ Do - Use useCallback for all selector functions - Memoize complex data transformations - Keep dependency arrays minimal and accurate - Profile performance before and after memoization ❌ Avoid - Creating new functions in selectors on every render - Over-memoizing simple operations - Including unnecessary dependencies in memoization arrays - Premature optimization without measurement Related Patterns - Subscription Optimization - Optimize subscr

Key points:
• Use `useCallback` for all selector functions
• Memoize complex data transformations
• Keep dependency arrays minimal and accurate
• Profile performance before and after memoization
• Creating new functions in selectors on every render
• Over-memoizing simple operations
• Including unnecessary dependencies in memoization arrays
• Premature optimization without measurement
• [Subscription Optimization](./subscription-optimization.md) - Optimize subscription patterns
• [Comparison Strategies](./comparison-strategies.md) - Choose the right comparison method
• [useStoreValue Patterns](./useStoreValue-patterns.md)...