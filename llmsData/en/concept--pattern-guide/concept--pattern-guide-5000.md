---
document_id: concept--pattern-guide
category: concept
source_path: en/concept/pattern-guide.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.350Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
@context-action/react Pattern Guide

Complete guide to the three main patterns available in @context-action/react framework. 📋 Quick Start Guide

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| 🎯 Action Only | Action dispatching without stores | createActionContext | Event systems, command patterns |
| 🏪 Store Only | State management without actions | createDeclarativeStorePattern | Pure state management, data layers |
| 🔧 Ref Context | Direct DOM manipulation with zero re-renders | createRefContext | High-performance UI, animations, real-time interactions |

Note: For complex applications, compose patterns together for maximum flexibility and separation of concerns. ---

🎯 Action Only Pattern

When to use: Pure action dispatching without state management (event systems, command patterns). Import

Features
- ✅ Type-safe action dispatching
- ✅ Action handler registration
- ✅ Abort support
- ✅ Result handling
- ✅ Lightweight (no store overhead)

Basic Usage

Advanced Features

Available Hooks
- useActionDispatch() - Basic action dispatcher
- useActionHandler(action, handler, config?) - Register action handlers
- useActionDispatchWithResult() - Advanced dispatcher with results/abort
- useActionRegister() - Access raw ActionRegister
- useActionContext() - Access raw context

---

🏪 Store Only Pattern (Recommended)

When to use: Pure state management without action dispatching (data layers, simple state). Key Features: 
- ✅ Excellent type inference without manual type annotations
- ✅ Simplified API focused on store management
- ✅ Direct value or configuration object support
- ✅ No need for separate createStore calls

Import

Basic Usage

Option 1: Type Inference (Current)

Option 2: Explicit Generic Types (New)

HOC Pattern (Advanced)

Advanced Configuration

Available Hooks
- useStore(name) - Get typed store by name (primary API)
- useStoreManager() - Access store manager (advanced use)
- useStoreInfo() - Get registry information
- useStoreClear() - Clear all stores

---

🔧 Ref Context Pattern

When to use: Direct DOM manipulation with zero React re-renders (high-performance UI, animations, real-time interactions). Import

Features
- ✅ Zero React re-renders for DOM manipulation
- ✅ Hardware-accelerated transforms
- ✅ Type-safe ref management
- ✅ Automatic lifecycle management
- ✅ Perfect separation of concerns
- ✅ Memory efficient with automatic cleanup

Basic Usage

Advanced RefContext with Custom Hooks

Multi-RefContext Architecture

Available Hooks
- useRefHandler(name) - Get typed ref handler by name
- useWaitForRefs() - Wait for multiple refs to mount
- useGetAllRefs() - Access all mounted refs
- refHandler.setRef - Set ref callback
- refHandler.target - Access current ref value
- refHandler.isMounted - Check mount status
- refHandler.waitForMount() - Async ref waiting
- refHandler.withTarget() - Safe operations

---

🔧 Pattern Composition

For complex applications, compose all three patterns for maximum flexibility:

---

🎯 Migration Guide

From Legacy Action Context Pattern

If you were using the removed createActionContextPattern, migrate to pattern composition:

---

📚 Best Practices

1. Pattern Selection
- Start with Store Only for simple state management
- Add Action Only when you need side effects or complex workflows
- Add RefContext when you need high-performance DOM manipulation
- Compose all three patterns for full-featured applications

2. Naming Conventions
- Use descriptive context names: UserActions, AppStores, MouseRefs
- Rename exported hooks for clarity: useUserAction, useAppStore, useMouseRef
- Keep store names simple: user, counter, settings
- Use domain-specific ref names: cursor, modal, canvas

3. Performance
- Store Pattern: Use strategy: 'reference' for large datasets, 'shallow' for objects, 'deep' only when necessary
- RefContext Pattern: Use translate3d() for hardware acceleration, batch DOM updates, avoid React re-renders
- Action Pattern: Keep handlers lightweight, use async for heavy operations

4. Type Safety
- Actions: Use explicit interfaces for actions (ActionPayloadMap optional)
- Stores: Let TypeScript infer store types or use explicit generics
- Refs: Define clear ref type interfaces with proper HTML element types
- Use as const for literal types in all patterns

5. Separation of Concerns
- Actions: Handle side effects, business logic, and coordination
- Stores: Manage application state and data
- RefContext: Handle DOM manipulation and performance-critical UI
- Keep each pattern focused on its specific responsibility

---

🔍 Examples

See the examples/ directory for complete working examples of each pattern.
