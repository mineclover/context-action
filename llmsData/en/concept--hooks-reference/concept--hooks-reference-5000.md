---
document_id: concept--hooks-reference
category: concept
source_path: en/concept/hooks-reference.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.349Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action React Hooks Reference

This document categorizes all available React hooks in the Context-Action framework into Essential Hooks (core functionality) and Utility Hooks (convenience and optimization). 📋 Table of Contents

1. Essential Hooks
2. Utility Hooks
3. Hook Categories
4. Usage Guidelines

---

Essential Hooks

These hooks are fundamental to using the Context-Action framework. Most applications will need these. 🔧 RefContext Hooks (Performance)

createRefContext<T>()
Factory function that creates all ref-related hooks for high-performance DOM manipulation. - Purpose: Creates type-safe direct DOM manipulation system with zero React re-renders
- Returns: { Provider, useRefHandler, useWaitForRefs, useGetAllRefs }
- Essential for: Performance-critical UI, animations, real-time interactions

useRefHandler()
Primary hook for accessing typed ref handlers with direct DOM manipulation. - Purpose: Get ref handler for specific DOM element with type safety
- Essential for: Direct DOM updates without React re-renders
- Pattern: Performance layer bypassing React reconciliation

useWaitForRefs()
Utility hook for waiting on multiple refs to mount before executing operations. - Purpose: Coordinate operations requiring multiple DOM elements
- Essential for: Complex DOM initialization sequences
- Pattern: Async ref coordination

🎯 Action Hooks (Core)

createActionContext<T>()
Factory function that creates all action-related hooks for a specific action context. - Purpose: Creates type-safe action dispatch and handler system
- Returns: { Provider, useActionDispatch, useActionHandler, useActionRegister }
- Essential for: Any action-based logic

useActionDispatch()
Primary hook for dispatching actions to handlers. - Purpose: Get dispatch function to trigger actions
- Essential for: Component interaction with business logic
- Pattern: ViewModel layer in MVVM architecture

useActionHandler()
Primary hook for registering action handlers. - Purpose: Register business logic for specific actions
- Essential for: Implementing business logic
- Best Practice: Use with useCallback for optimization

🏪 Store Hooks (Core)

createDeclarativeStorePattern<T>()
Factory function that creates all store-related hooks with type safety. - Purpose: Creates type-safe store management system
- Returns: { Provider, useStore, useStoreManager, withProvider }
- Essential for: Any state management

useStoreValue<T>(store)
Primary hook for subscribing to store changes. - Purpose: Get reactive value from store
- Essential for: Reading state in components
- Performance: Only re-renders on actual value changes

useStore(name) (from pattern)
Primary hook for accessing stores by name. - Purpose: Get store instance from context
- Essential for: Accessing stores in components
- Type-safe: Returns properly typed store

---

Utility Hooks

These hooks provide additional functionality, optimizations, and convenience features. 🎯 Action Utility Hooks

useActionDispatchWithResult()
Utility hook for actions that need to collect results. - Purpose: Dispatch actions and collect handler results
- Use Case: When you need return values from handlers
- Advanced: For complex workflows requiring handler responses

useActionRegister()
Utility hook for direct access to ActionRegister instance. - Purpose: Advanced control over action registry
- Use Case: Dynamic handler management, debugging
- Advanced: Rarely needed in typical applications

🏪 Store Utility Hooks

useStoreSelector<T, R>(store, selector, equalityFn?)
Performance hook for selective subscriptions. - Purpose: Subscribe to specific parts of store
- Optimization: Prevents unnecessary re-renders
- Use Case: Large objects where only part changes

useComputedStore<T, R>(store, compute, config?)
Derived state hook for computed values. - Purpose: Create derived state from stores
- Optimization: Only recomputes when dependencies change
- Use Case: Calculated values, aggregations

useLocalStore<T>(initialValue, name?)
Component-local store hook. - Purpose: Create store scoped to component lifecycle
- Use Case: Complex component state
- Benefit: Store API without global state

usePersistedStore<T>(key, initialValue, options?)
Persistence hook for browser storage. - Purpose: Auto-sync store with localStorage/sessionStorage
- Use Case: Settings, user preferences, draft data
- Feature: Cross-tab synchronization

assertStoreValue<T>(value, storeName)
Type assertion utility for store values. - Purpose: Runtime assertion for non-undefined values
- Type Safety: Throws error if undefined
- Use Case: When store must have a value

🔧 Performance Optimization Hooks

useMultiStoreSelector(stores, selector, equalityFn?)
Multi-store selector for combining stores. - Purpose: Select from multiple stores efficiently
- Optimization: Single subscription for multiple stores
- Use Case: Cross-store computed values

useStorePathSelector(store, path, equalityFn?)
Path-based selector for nested objects.
