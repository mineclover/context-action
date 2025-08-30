---
document_id: en_guide_immutability-comparison-integration
category: guide
source_path: en/guide/patterns/store/immutability-comparison-integration.md
character_limit: 5000
last_update: '2025-08-30T10:41:58.020Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Immutability and Comparison Integration

Immutability and Comparison Integration Comprehensive guide to understanding how Immer-based immutability and comparison logic work together in Context-Action stores for optimal performance and correctness. Overview Context-Action uses a dual-layer optimization system within each individual store: - Immer: For safe immutable updates (Copy-on-Write) per store - Comparison Logic: For change detection and re-render optimization per store These two systems solve different problems and work together within each store independently, not as replacements for each other. Architecture Overview Two-Layer System Design Why Both Are Needed | System | Purpose | Problem Solved | Scope | |--------|---------|----------------|-------| | Immer | Immutability | Prevents mutation bugs, ensures safe copies | Per individual store | | Comparison | Change Detection | Prevents unnecessary re-renders, optimizes performance | Per individual store | Immer Integration Details 1. Safe Immutable Updates 2. Update Method with Immer Key Benefits: - Security: Updater functions cannot mutate internal state - Consistency: All updates go through the same validation pipeline - Performance: Immer's Copy-on-Write avoids unnecessary object creation Comparison Logic Integration 1. Change Detection Pipeline 2. Comparison Strategies Performance Characteristics Immer Performance Comparison Performance | Strategy | Speed | Memory | Use Case | |----------|-------|--------|----------| | Reference | ⚡⚡⚡ | ⚡⚡⚡ | Primitives, managed objects | | Fast Compare | ⚡⚡ | ⚡⚡ | General objects (default) | | Shallow | ⚡⚡ | ⚡⚡ | Objects with shallow changes | | Deep | ⚡ | ⚡ | Complex nested objects | Real-World Integration Examples 1. Optimal Store Configuration 2. Update Patterns with Immer Benefits 3. Performance-Optimized Cart Example Common Misconceptions ❌ "Immer replaces comparison logic" Wrong assumption: Why it's wrong: - Would trigger re-render even when value hasn't changed - No performance optimization for identical values - Breaks React's optimization assumptions ✅ Correct understanding: ❌ "Comparison logic is redundant with Immer" Wrong assumption: - "Immer returns same reference if unchanged, so comparison is not needed" Why it's wrong: - Only true for update() method with no-op functions - setValue() with identical values still needs comparison - Custom comparators enable business-logic-specific optimizations Advanced Integration Patterns 1. Custom Comparators with Immer 2. Debugging Integration Best Practices ✅ Do - Trust the system: Both Immer and comparison are needed - Use appropriate comparison strategies for your data types - Profile performance before changing default settings - Leverage Immer's Copy-on-Write in update functions - Use custom comparators for business-l

Key points:
• **Immer**: For safe immutable updates (Copy-on-Write) per store
• **Comparison Logic**: For change detection and re-render optimization per store
• **Security**: Updater functions cannot mutate internal state
• **Consistency**: All updates go through the same validation pipeline
• **Performance**: Immer's Copy-on-Write avoids unnecessary object creation
• Would trigger re-render even when value hasn't changed
• No performance optimization for identical values
• Breaks React's optimization assumptions
• "Immer returns same reference if unchanged, so comparison is not needed"
• Only true for `update()` method with no-op functions
• `setValue()` with identical values still needs comparison
• Custom comparators enable business-logic-specific optimizations
• **Trust the system**: Both Immer and comparison are needed
• **Use appropriate comparison strategies** for your data types
• **Profile performance** before changing default settings
• **Leverage Immer's Copy-on-Write** in update functions
• **Use custom comparators** for business-logic optimizations
• Removing comparison logic "because Immer handles it"
• Using deep comparison unnecessarily
• Bypassing the update/setValue pipeline
• Manually implementing immutability when Immer handles it
• Ignoring performance characteristics of different strategies
• [Comparison Strategies](./comparison-strategies.md) - Detailed comparison options
• [Memory Management](./memory-management.md) - Resource-efficient patterns
• [Performance Patterns](./performance-patterns.md) - Overall optimization guide
• [Store Configuration](./store-configuration.md) - Advanced store setup
• [Memoization Patterns](./memoization-patterns.md) - Complementary optimizations
• **Profile first**: Measure actual performance impact
• **Test edge...