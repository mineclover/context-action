---
document_id: en_concept_pattern-guide
category: concept
source_path: en/concept/pattern-guide.md
character_limit: 5000
last_update: '2025-08-30T10:42:20.315Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
@context-action/react Pattern Guide

@context-action/react Pattern Guide Complete guide to the three main patterns available in @context-action/react framework. Note: This guide has been moved to the Patterns section for better organization. 📋 Quick Reference Choose the right pattern for your use case: | Pattern | Use Case | Import | Best For | |---------|----------|--------|----------| | 🎯 Action Only | Action dispatching without stores | createActionContext | Event systems, command patterns | | 🏪 Store Only | State management without actions | createStoreContext | Pure state management, data layers | | 🔧 Ref Context | Direct DOM manipulation with zero re-renders | createRefContext | High-performance UI, animations, real-time interactions | | ⚡ Selective Subscription | Performance optimization through strategic subscription management | Pattern combination | High-frequency updates, performance-critical apps | For complex applications, compose patterns together for maximum flexibility and separation of concerns. 📚 Detailed Documentation Core Framework Patterns - 🎯 Action Only Pattern - Pure action dispatching without state management - 🏪 Store Only Pattern - Type-safe state management without actions (Recommended) - 🔧 Ref Context Pattern - Direct DOM manipulation with zero re-renders Advanced Patterns - Pattern Composition - Combining all three patterns for complex applications - Selective Subscription Patterns - Pre-memoization optimization through strategic subscription management - Domain Context Architecture - Document-centric context separation - MVVM Architecture - Modern Model-View-ViewModel implementation Implementation Patterns - Real-time State Access - Patterns for accessing real-time state - Ref Context Setup - High-performance DOM manipulation setup - Wait Then Execute - Waiting and execution patterns - Conditional Await - Conditional waiting patterns - Timeout Protection - Timeout protection in async operations Migration Guide From Legacy Action Context Pattern If you were using the removed createActionContextPattern, migrate to pattern composition: 🔍 Examples See the examples/ directory for complete working examples of each pattern and the Pattern Guide documentation for comprehensive implementation details.

Key points:
• **[🎯 Action Only Pattern](../guide/patterns/action-only-pattern.md)** - Pure action dispatching without state management
• **[🏪 Store Only Pattern](../guide/patterns/store-only-pattern.md)** - Type-safe state management without actions (Recommended)
• **[🔧 Ref Context Pattern](../guide/patterns/ref-context-pattern.md)** - Direct DOM manipulation with zero re-renders
• **[Pattern Composition](../guide/patterns/pattern-composition.md)** - Combining all three patterns for complex applications
• **[Selective Subscription Patterns](./selective-subscription-patterns.md)** - Pre-memoization optimization through strategic subscription management
• **[Domain Context Architecture](../guide/patterns/domain-context-architecture.md)** - Document-centric context separation
• **[MVVM Architecture](../guide/patterns/mvvm-architecture.md)** - Modern Model-View-ViewModel implementation
• **[Real-time State Access](../guide/patterns/real-time-state-access.md)** - Patterns for accessing real-time state
• **[Ref Context Setup](../guide/patterns/ref-context-setup.md)** - High-performance DOM manipulation setup
• **[Wait Then Execute](../guide/patterns/wait-then-execute.md)** - Waiting and execution patterns
• **[Conditional Await](../guide/patterns/conditional-await.md)** - Conditional waiting patterns
• **[Timeout Protection](../guide/patterns/timeout-protection.md)** - Timeout protection in async operations