---
document_id: en_concept_hooks-reference
category: concept
source_path: en/concept/hooks-reference.md
character_limit: 5000
last_update: '2025-08-30T10:42:20.777Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action React Hooks Reference

Context-Action React Hooks Reference This document is a comprehensive catalog of all available React hooks in the Context-Action framework, categorized by functionality and use cases. This serves as a reference manual for developers. Related Guides - 🎯 React Hooks - How to use hooks (API examples and usage patterns) - 🔄 Hooks Lifecycle - How hooks work internally (lifecycle, cleanup, performance)   - ✅ Best Practices - Coding patterns and conventions --- 📋 Table of Contents 1. Essential Hooks 2. Utility Hooks 3. Hook Categories 4. Usage Guidelines --- Essential Hooks These hooks are fundamental to using the Context-Action framework. Most applications will need these. 🔧 RefContext Hooks (Performance) createRefContext<T>() Factory function that creates all ref-related hooks for high-performance DOM manipulation. - Purpose: Creates type-safe direct DOM manipulation system with zero React re-renders - Returns: { Provider, useRefHandler, useWaitForRefs, useGetAllRefs } - Essential for: Performance-critical UI, animations, real-time interactions useRefHandler() Primary hook for accessing typed ref handlers with direct DOM manipulation. - Purpose: Get ref handler for specific DOM element with type safety - Essential for: Direct DOM updates without React re-renders - Pattern: Performance layer bypassing React reconciliation useWaitForRefs() Utility hook for waiting on multiple refs to mount before executing operations. - Purpose: Coordinate operations requiring multiple DOM elements - Essential for: Complex DOM initialization sequences - Pattern: Async ref coordination 🎯 Action Hooks (Core) createActionContext<T>() Factory function that creates all action-related hooks for a specific action context. - Purpose: Creates type-safe action dispatch and handler system - Returns: { Provider, useActionDispatch, useActionHandler, useActionRegister } - Essential for: Any action-based logic useActionDispatch() Primary hook for dispatching actions to handlers. - Purpose: Get dispatch function to trigger actions - Essential for: Component interaction with business logic - Pattern: ViewModel layer in MVVM architecture useActionHandler() Primary hook for registering action handlers. - Purpose: Register business logic for specific actions - Essential for: Implementing business logic - Best Practice: Use with useCallback for optimization - Handler Updates: Automatically updates when handler function changes - Internal Memoization: Maintains stable reference while allowing handler updates Handler Update Patterns: 📖 See: Handler Runtime Updates for comprehensive patterns 🏪 Store Hooks (Core) createStoreContext<T>() Factory function that creates all store-related hooks with type safety. - Purpose: Creates type-safe store management system - Returns: { Provider, useStore, useSt

Key points:
• 🎯 **[React Hooks](/en/guide/hooks)** - How to use hooks (API examples and usage patterns)
• 🔄 **[Hooks Lifecycle](/en/guide/hooks-lifecycle)** - How hooks work internally (lifecycle, cleanup, performance)
• ✅ **[Best Practices](/en/guide/best-practices)** - Coding patterns and conventions
• **Purpose**: Creates type-safe direct DOM manipulation system with zero React re-renders
• **Returns**: `{ Provider, useRefHandler, useWaitForRefs, useGetAllRefs }`
• **Essential for**: Performance-critical UI, animations, real-time interactions
• **Purpose**: Get ref handler for specific DOM element with type safety
• **Essential for**: Direct DOM updates without React re-renders
• **Pattern**: Performance layer bypassing React reconciliation
• **Purpose**: Coordinate operations requiring multiple DOM elements
• **Essential for**: Complex DOM initialization sequences
• **Pattern**: Async ref coordination
• **Purpose**: Creates type-safe action dispatch and handler system
• **Returns**: `{ Provider, useActionDispatch, useActionHandler, useActionRegister }`
• **Essential for**: Any action-based logic
• **Purpose**: Get dispatch function to trigger actions
• **Essential for**: Component interaction with business logic
• **Pattern**: ViewModel layer in MVVM architecture
• **Purpose**: Register business logic for specific actions
• **Essential for**: Implementing business logic
• **Best Practice**: Use with `useCallback` for optimization
• **Handler Updates**: Automatically updates when handler function changes
• **Internal Memoization**: Maintains stable reference while allowing handler updates
• **Purpose**: Creates type-safe store management system
• **Returns**: `{ Provider, useStore, useStoreManager, withProvider }`
• **Essential for**: Any state management
• **Purpose**: Get reactive value...