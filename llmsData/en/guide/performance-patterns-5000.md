---
document_id: en_guide_performance-patterns
category: guide
source_path: en/guide/patterns/store/performance-patterns.md
character_limit: 5000
last_update: '2025-08-30T10:41:53.234Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Performance Patterns

Store Performance Patterns Comprehensive guide to optimizing store performance in Context-Action applications. This overview covers all major performance optimization categories. Performance Categories Memoization Patterns Optimization patterns using React's memoization hooks to prevent unnecessary re-renders and expensive computations: - Stable Selectors: Using useCallback for consistent selector functions - Complex Selector Memoization: Optimizing data transformations - Computed Store Dependencies: Memoizing expensive computation functions Batching Patterns Patterns for batching multiple store updates to prevent unnecessary re-renders: - Store Update Batching: Using React's unstablebatchedUpdates - Store Batch API: Leveraging built-in batch methods - Atomic Operations: Grouping related updates together Subscription Optimization Optimize store subscriptions to reduce unnecessary re-renders: - Selective Subscriptions: Subscribe only to needed data - Conditional Subscriptions: Subscribe only when necessary - Debounced Subscriptions: Handle fast-changing data efficiently Comparison Strategies Choose the right comparison strategy to balance performance and accuracy: - Reference Comparison: Fastest for primitives and managed references - Shallow Comparison: Balanced approach for objects - Deep Comparison: Most accurate for nested structures - Custom Comparison: Business logic specific comparisons - Circular Reference Safety: Handle complex object structures Lazy Evaluation Patterns Defer expensive operations and access values only when needed: - Lazy State Access: Get current state at execution time - Conditional Store Access: Access stores only when conditions are met - Deferred Calculations: Postpone expensive computations - Lazy Loading: Load data on demand Memory Management Prevent memory leaks and manage resources efficiently: - Event Object Prevention: Avoid storing DOM events - Subscription Cleanup: Proper cleanup of manual subscriptions - Cross-Platform Timeouts: Handle timeouts safely across environments - Weak References: Use WeakMap/WeakSet for large data Debugging & Development Development tools and debugging patterns: - Debug Mode: Enable debugging for store value changes - Performance Monitoring: Track store update metrics - State Inspection: Debug multiple stores simultaneously - Development Utilities: Custom debugging tools Error Handling & Recovery Robust error handling and recovery patterns: - Centralized Error Handling: Use framework's error system - EventBus Memory Safety: Safe event handling patterns - Graceful Degradation: Provide fallback strategies - Retry Mechanisms: Handle transient failures Quick Reference Performance Priority Matrix | Priority | Pattern Category | Impact | Complexity | |----------|------------------|-----

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
• **Reference Comparison**: Fastest for primitives and managed references
• **Shallow Comparison**: Balanced approach for objects
• **Deep Comparison**: Most accurate for nested structures
• **Custom Comparison**: Business logic specific comparisons
• **Circular Reference Safety**: Handle complex object structures
• **Lazy State Access**: Get current state at execution time
• **Conditional Store Access**: Access stores only when conditions are met
• **Deferred Calculations**: Postpone expensive computations
• **Lazy Loading**: Load data on demand
• **Event Object Prevention**: Avoid storing DOM events
• **Subscription Cleanup**: Proper cleanup of manual subscriptions
• **Cross-Platform Timeouts**: Handle timeouts safely across environments
• **Weak References**: Use WeakMap/WeakSet for large data
• **Debug Mode**: Enable debugging for store value changes
• **Performance Monitoring**: Track store update metrics
• **State Inspection**: Debug multiple stores simultaneously
• **Development Utilities**: Custom debugging tools
• **Centralized Error Handling**: Use framework's error system
• **EventBus Memory Safety**: Safe event handling patterns
• **Graceful Degradation**: Provide fallback strategies
•...