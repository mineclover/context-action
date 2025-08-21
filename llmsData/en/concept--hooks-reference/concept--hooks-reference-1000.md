---
document_id: concept--hooks-reference
category: concept
source_path: en/concept/hooks-reference.md
character_limit: 1000
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
Primary hook for accessing typed ref handlers with direct DOM manipulation.
