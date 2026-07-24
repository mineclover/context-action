---
document_id: concept--store-conventions
category: concept
source_path: en/concept/store-conventions.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.341Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Conventions

Store Conventions Complete conventions for Store, TimeTravelStore, and MutableStore patterns in the Context-Action framework. 📋 Table of Contents 1. Store Types Overview 2. Store (Default) 3. TimeTravelStore 4. MutableStore Pattern 5. notifyPath/notifyPaths API 6. Event Loop Control 7. Performance Guidelines 8. Best Practices 9. Business Logic Separation --- Store Types Overview Context-Action Framework provides three specialized Store implementations: | Store Type | Implementation | Key Features | Use Case | |------------|---------------|--------------|----------| | Store | createStore() | Immutability + Deep Freeze | General state, forms, settings | | TimeTravelStore | createTimeTravelStore() | Undo/Redo + Structural Sharing | Text editors, drawing apps | | MutableStore | TimeTravelStore without undo/redo | Structural Sharing + Performance | High-frequency updates, large trees | Quick Selection Guide --- Store (Default) Overview Standard store with full immutability guarantees and safety features. Features - Deep Freeze: Values frozen to prevent accidental mutations - Copy-on-Write: Efficient cloning with version-based caching - RAF Batching: Multiple updates batched into single frame - Error Recovery: Automatic problematic listener removal - Concurrency Protection: Update queue prevents race conditions - notifyPath/notifyPaths: Manual event control API Core API React Integration When to Use - General state management - Forms and settings - Cached data - When immutability guarantees are critical - When using useStoreValue() subscriptions --- TimeTravelStore Overview Store with built-in undo/redo functionality powered by history management. Features - Undo/Redo: Full history navigation - Structural Sharing: Unchanged parts keep same reference - Configurable History: maxHistory option - Patch-based Updates: Efficient change tracking via JSON patches - notifyPath/notifyPaths: Manual event control API Core API React Integration ⚠️ CRITICAL: Use useStorePath(), NOT useStoreValue() Subscription Pattern When to Use - Text editors, drawing applications - Form wizards with back/forward navigation - Any feature requiring undo/redo - Debugging with state history - When history tracking is essential --- MutableStore Pattern Overview Definition: TimeTravelStore with mutable: true where undo/redo functionality is NOT used. This pattern provides structural sharing and high performance without the overhead of history tracking, while still maintaining the technical capability. Key Characteristics 1. Structural Sharing: Unchanged parts keep same reference 2. No Undo/Redo Usage: History methods available but ignored 3. Performance Focus: Optimized for high-frequency updates 4. notifyPath/notifyPaths: Advanced event control Why Not a Separate Implementation? - TimeTravelS

Key points:
• **Deep Freeze**: Values frozen to prevent accidental mutations
• **Copy-on-Write**: Efficient cloning with version-based caching
• **RAF Batching**: Multiple updates batched into single frame
• **Error Recovery**: Automatic problematic listener removal
• **Concurrency Protection**: Update queue prevents race conditions
• **notifyPath/notifyPaths**: Manual event control API
• General state management
• Forms and settings
• Cached data
• When immutability guarantees are critical
• When using `useStoreValue()` subscriptions
• **Undo/Redo**: Full history navigation
• **Structural Sharing**: Unchanged parts keep same reference
• **Configurable History**: `maxHistory` option
• **Patch-based Updates**: Efficient change tracking via JSON patches
• **notifyPath/notifyPaths**: Manual event control API
• Text editors, drawing applications
• Form wizards with back/forward navigation
• Any feature requiring undo/redo
• Debugging with state history
• When history tracking is essential
• TimeTravelStore already provides structural sharing via `mutable: true`
• Simply don't call `undo()`, `redo()`, `goTo()` methods
• Avoids code duplication and maintenance overhead
• History can be enabled later if needed
• High-frequency updates (animations, real-time data)
• Large state trees requiring selective re-rendering
• Performance-sensitive applications
• External system integration (WebSocket, etc.)
• When undo/redo is NOT needed
• 6 detailed patterns with complete examples
• Testing business logic independently
• Performance characteristics and optimization
• Integration strategies with stores and actions
• Real-world implementation examples
• [Main Conventions](./conventions.md) - Overall framework conventions
• [Hooks Reference](./hooks-reference.md) - Complete hooks documentation
• [Architecture...