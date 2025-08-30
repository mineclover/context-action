---
document_id: en_guide_subscription-optimization
category: guide
source_path: en/guide/patterns/store/subscription-optimization.md
character_limit: 5000
last_update: '2025-08-30T10:42:00.439Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Subscription Optimization

Subscription Optimization Patterns for optimizing store subscriptions to reduce unnecessary re-renders and improve performance through selective and conditional subscriptions. Selective Subscriptions Choose what data to subscribe to carefully: Conditional Subscriptions Only subscribe when the data is actually needed: Debounced Subscriptions Debounce rapid changes to prevent excessive updates: Subscription Strategy Guidelines When to Group Subscriptions - Related Data: When fields are logically related and often used together - Update Patterns: When fields typically change together - Component Needs: When a component needs multiple related fields When to Split Subscriptions - Independent Updates: When fields change independently - Selective Rendering: When only specific changes should trigger re-renders - Performance Critical: When minimizing re-renders is crucial Debouncing Strategy - Fast-Changing Data: Use debouncing for frequently updated stores - User Input: Apply debouncing to search inputs and form fields - Real-Time Data: Consider debouncing for live data feeds - Reasonable Delays: Choose debounce values based on user experience (200-500ms typical) Best Practices ✅ Do - Group related subscriptions when they're used together - Use conditional subscriptions to avoid unnecessary work - Apply debouncing to fast-changing data sources - Profile subscription performance in development ❌ Avoid - Subscribing to entire large objects when only parts are needed - Creating multiple subscriptions for closely related data - Over-debouncing critical updates - Ignoring subscription cleanup Related Patterns - Memoization Patterns - Prevent unnecessary re-computations - Comparison Strategies - Choose the right comparison method - useStoreValue Patterns - Basic subscription patterns - Memory Management - Efficient resource usage

Key points:
• **Related Data**: When fields are logically related and often used together
• **Update Patterns**: When fields typically change together
• **Component Needs**: When a component needs multiple related fields
• **Independent Updates**: When fields change independently
• **Selective Rendering**: When only specific changes should trigger re-renders
• **Performance Critical**: When minimizing re-renders is crucial
• **Fast-Changing Data**: Use debouncing for frequently updated stores
• **User Input**: Apply debouncing to search inputs and form fields
• **Real-Time Data**: Consider debouncing for live data feeds
• **Reasonable Delays**: Choose debounce values based on user experience (200-500ms typical)
• Group related subscriptions when they're used together
• Use conditional subscriptions to avoid unnecessary work
• Apply debouncing to fast-changing data sources
• Profile subscription performance in development
• Subscribing to entire large objects when only parts are needed
• Creating multiple subscriptions for closely related data
• Over-debouncing critical updates
• Ignoring subscription cleanup
• [Memoization Patterns](./memoization-patterns.md) - Prevent unnecessary re-computations
• [Comparison Strategies](./comparison-strategies.md) - Choose the right comparison method
• [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
• [Memory Management](./memory-management.md) - Efficient resource usage