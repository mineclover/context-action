---
document_id: en_guide_comparison-strategies
category: guide
source_path: en/guide/patterns/store/comparison-strategies.md
character_limit: 5000
last_update: '2025-08-30T10:41:55.071Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Comparison Strategies

Comparison Strategies Optimization patterns for choosing the right comparison strategy in store subscriptions to balance performance and accuracy. Reference Comparison (Fastest) Use reference comparison for primitive values or when exact object reference matters: Best for: - Primitive values (string, number, boolean) - When object references are carefully managed - Maximum performance requirements Shallow Comparison (Balanced) Use shallow comparison for objects with shallow changes: Best for: - Objects with first-level property changes - Configuration objects - Most common use cases where deep nesting isn't a concern Deep Comparison (Most Accurate) Use deep comparison only when necessary for complex nested objects: Best for: - Complex nested object structures - When accuracy is more important than performance - Data with unpredictable nesting levels Custom Comparison Create custom comparators for specific business logic: Best for: - Specific business logic requirements - When only certain fields matter for updates - Performance optimization for known data structures Circular Reference Safe Comparison Handle circular references safely in custom comparators: Performance Characteristics Comparison Strategy Performance | Strategy | Speed | Accuracy | Memory | Use Case | |----------|--------|----------|---------|-----------| | Reference | ⚡⚡⚡ | ✅ (primitives) | ⚡⚡⚡ | Primitives, managed references | | Shallow | ⚡⚡ | ✅✅ | ⚡⚡ | Objects with shallow changes | | Deep | ⚡ | ✅✅✅ | ⚡ | Complex nested structures | | Custom | ⚡⚡ | ✅✅ | ⚡⚡ | Specific business logic | Choosing the Right Strategy 1. Start with Reference: Default for most primitive values 2. Upgrade to Shallow: When objects have shallow property changes 3. Consider Custom: For specific business logic or known data patterns 4. Use Deep Sparingly: Only when nested changes must trigger updates Best Practices ✅ Do - Start with reference comparison and upgrade as needed - Use shallow comparison for most object scenarios - Profile comparison performance in development - Consider custom comparators for specific business logic ❌ Avoid - Using deep comparison unnecessarily - Creating expensive custom comparators - Ignoring circular reference handling in custom comparators - Over-optimizing comparison strategies Related Patterns - Memoization Patterns - Prevent unnecessary computations - Subscription Optimization - Optimize subscription patterns - useStoreValue Patterns - Basic subscription patterns - Memory Management - Efficient resource usage

Key points:
• Primitive values (string, number, boolean)
• When object references are carefully managed
• Maximum performance requirements
• Objects with first-level property changes
• Configuration objects
• Most common use cases where deep nesting isn't a concern
• Complex nested object structures
• When accuracy is more important than performance
• Data with unpredictable nesting levels
• Specific business logic requirements
• When only certain fields matter for updates
• Performance optimization for known data structures
• Start with reference comparison and upgrade as needed
• Use shallow comparison for most object scenarios
• Profile comparison performance in development
• Consider custom comparators for specific business logic
• Using deep comparison unnecessarily
• Creating expensive custom comparators
• Ignoring circular reference handling in custom comparators
• Over-optimizing comparison strategies
• [Memoization Patterns](./memoization-patterns.md) - Prevent unnecessary computations
• [Subscription Optimization](./subscription-optimization.md) - Optimize subscription patterns
• [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
• [Memory Management](./memory-management.md) - Efficient resource usage
• **Start with Reference**: Default for most primitive values
• **Upgrade to Shallow**: When objects have shallow property changes
• **Consider Custom**: For specific business logic or known data patterns
• **Use Deep Sparingly**: Only when nested changes must trigger updates