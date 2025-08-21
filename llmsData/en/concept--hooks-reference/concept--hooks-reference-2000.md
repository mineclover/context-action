---
document_id: concept--hooks-reference
category: concept
source_path: en/concept/hooks-reference.md
character_limit: 2000
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
Primary hook for registering action handlers.
