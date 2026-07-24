---
document_id: concept--store-conventions
category: concept
source_path: en/concept/store-conventions.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.340Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store Conventions

Store Conventions Complete conventions for Store, TimeTravelStore, and MutableStore patterns in the Context-Action framework. 📋 Table of Contents 1. Store Types Overview 2. Store (Default) 3. TimeTravelStore 4. MutableStore Pattern 5. notifyPath/notifyPaths API 6. Event Loop Control 7. Performance Guidelines 8. Best Practices 9. Business Logic Separation --- Store Types Overview Context-Action Framework provides three specialized Store implementations: | Store Type | Implementation | Key Features | Use Case | |------------|---------------|--------------|----------| | Store | createStore() | Immutability + Deep Freeze | General state, forms, settings | | TimeTravelStore | createTimeTravelStore() | Undo/Redo + Structural Sharing | Text editors, drawing apps | | MutableStore | TimeTravelStore without undo/redo | Structural Sharing + Performance | High-frequency updates, large trees | Quick Selection Guide --- Store (Default) Overview Standard store with full immutability guarantees and safety

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
•...