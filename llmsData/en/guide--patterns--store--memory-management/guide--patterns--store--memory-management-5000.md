---
document_id: guide--patterns--store--memory-management
category: guide
source_path: en/guide/patterns/store/memory-management.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.210Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Memory Management

Memory Management Patterns for preventing memory leaks and managing resources efficiently in store operations, including event handling, subscriptions, and data caching. Event Object Storage Prevention Never store DOM event objects directly in stores as they can cause memory leaks: Cleanup Subscriptions Always clean up manual subscriptions to prevent memory leaks: Cross-Platform Timeout Handling Handle timeouts safely across different JavaScript environments: Weak References for Large Data Use WeakMap and WeakSet for caching large objects without preventing garbage collection: Memory Management Best Practices Event Handling - Extract Data: Only extract needed data from DOM events - Avoid References: Never store entire DOM elements or React synthetic events - Use Primitives: Prefer primitive values and plain objects - Clean Extraction: Create new objects with only necessary properties Subscription Management - Auto Cleanup: Use React hooks that handle cleanup automatically - Manual Cleanup: Always return cleanup functions from useEffect - Conditional Subscriptions: Unsubscribe when subscriptions are no longer needed - Memory Monitoring: Monitor subscription count in development Data Caching - WeakMap/WeakSet: Use for object-keyed caches to allow garbage collection - TTL Patterns: Implement time-to-live for cache entries - Size Limits: Set maximum cache sizes and implement eviction policies - Cleanup Cycles: Periodically clean up stale cache entries Common Memory Leak Sources ❌ Avoid These Patterns - Storing DOM events or synthetic events in stores - Creating closures that capture large objects unnecessarily - Forgetting to unsubscribe from manual subscriptions - Keeping references to unmounted components - Accumulating data without cleanup strategies ✅ Use These Patterns Instead - Extract only needed data from events before storing - Use React hooks with proper cleanup - Implement automatic subscription management - Use WeakMap/WeakSet for object references - Implement data retention policies Related Patterns - Subscription Optimization - Efficient subscription patterns - Error Handling & Recovery - Safe error handling - Lazy Evaluation Patterns - Defer expensive operations - Debugging & Development - Memory debugging techniques

Key points:
• **Extract Data**: Only extract needed data from DOM events
• **Avoid References**: Never store entire DOM elements or React synthetic events
• **Use Primitives**: Prefer primitive values and plain objects
• **Clean Extraction**: Create new objects with only necessary properties
• **Auto Cleanup**: Use React hooks that handle cleanup automatically
• **Manual Cleanup**: Always return cleanup functions from useEffect
• **Conditional Subscriptions**: Unsubscribe when subscriptions are no longer needed
• **Memory Monitoring**: Monitor subscription count in development
• **WeakMap/WeakSet**: Use for object-keyed caches to allow garbage collection
• **TTL Patterns**: Implement time-to-live for cache entries
• **Size Limits**: Set maximum cache sizes and implement eviction policies
• **Cleanup Cycles**: Periodically clean up stale cache entries
• Storing DOM events or synthetic events in stores
• Creating closures that capture large objects unnecessarily
• Forgetting to unsubscribe from manual subscriptions
• Keeping references to unmounted components
• Accumulating data without cleanup strategies
• Extract only needed data from events before storing
• Use React hooks with proper cleanup
• Implement automatic subscription management
• Use WeakMap/WeakSet for object references
• Implement data retention policies
• [Subscription Optimization](./subscription-optimization.md) - Efficient subscription patterns
• [Error Handling & Recovery](./error-handling-recovery.md) - Safe error handling
• [Lazy Evaluation Patterns](./lazy-evaluation-patterns.md) - Defer expensive operations
• [Debugging & Development](./debugging-development.md) - Memory debugging techniques