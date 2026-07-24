---
document_id: guide--react-context-migration
category: guide
source_path: en/guide/react-context-migration.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.249Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Context to Context-Action Migration Guide

React Context to Context-Action Migration Guide This guide helps developers migrate from traditional React Context patterns to Context-Action. It covers common patterns, their context-action equivalents, and patterns that require different approaches. Overview Context-Action provides a more structured approach to state management compared to vanilla React Context. While most patterns can be directly translated, some require architectural adjustments due to the framework's separation of concerns philosophy. Key Differences | Aspect | React Context | Context-Action | |--------|--------------|----------------| | State + Logic | Combined in Provider | Separated (Store + Handler) | | State Updates | setState / dispatch | setValue / update | | Cross-context | Hook calls in Provider | Handler accesses multiple stores | | Side Effects | In Provider's useEffect | Separate components/hooks | | Immutability | Manual | Automatic (Mutative) | --- Pattern Migration Guide 1. Basic State Management React Context: Context-Action: --- 2. Smart Setters (Function or Value) React's useState and many Context patterns support both direct values and updater functions in a single setter. React Context: Context-Action: Key Points: - setValue(value) - Direct replacement (no access to previous) - update(prev => newValue) - Functional update with previous value access - Create a wrapper function if you need both patterns in one API --- 3. localStorage Persistence React Context: Context-Action: --- 4. Cross-Context Communication React Context: Context-Action: --- 5. DOM Side Effects React Context: Context-Action: --- 6. Nested State Updates React Context: Context-Action (with Mutative): --- 7. Undo/Redo Pattern React Context: Context-Action (Built-in TimeTravelStore): --- Migration Checklist Before Migration - [ ] Identify all Context providers in your app - [ ] Map out cross-context dependencies - [ ] List all side effects in providers (localStorage, DOM, API calls) - [ ] Identify smart setter patterns (function/value dual support) During Migration - [ ] Create store contexts for each state domain - [ ] Separate business logic into handler components - [ ] Extract side effects into dedicated components/hooks - [ ] Replace setState with setValue/update - [ ] Update cross-context communication to use handler pattern After Migration - [ ] Verify all state updates work correctly - [ ] Test undo/redo if using TimeTravelStore - [ ] Check persistence (localStorage) functionality - [ ] Validate cross-store coordination - [ ] Performance test with useStorePath for nested data --- Patterns Not Directly Supported 1. Dynamic Context Creation React allows creating contexts at runtime. Context-Action requires pre-defined stores. Workaround: Use useLocalStore for truly dynamic state, or pre-defi

Key points:
• `setValue(value)` - Direct replacement (no access to previous)
• `update(prev => newValue)` - Functional update with previous value access
• Create a wrapper function if you need both patterns in one API
• [ ] Identify all Context providers in your app
• [ ] Map out cross-context dependencies
• [ ] List all side effects in providers (localStorage, DOM, API calls)
• [ ] Identify smart setter patterns (function/value dual support)
• [ ] Create store contexts for each state domain
• [ ] Separate business logic into handler components
• [ ] Extract side effects into dedicated components/hooks
• [ ] Replace setState with setValue/update
• [ ] Update cross-context communication to use handler pattern
• [ ] Verify all state updates work correctly
• [ ] Test undo/redo if using TimeTravelStore
• [ ] Check persistence (localStorage) functionality
• [ ] Validate cross-store coordination
• [ ] Performance test with useStorePath for nested data
• **Better Separation of Concerns** - UI, business logic, and state are clearly separated
• **Automatic Immutability** - Mutative integration prevents accidental mutations
• **Built-in Time Travel** - Undo/redo without manual implementation
• **Path-based Subscriptions** - Fine-grained re-rendering control
• **Type Safety** - Full TypeScript inference throughout
• **Memory Leak Prevention** - Automatic cleanup and event object filtering