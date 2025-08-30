---
document_id: en_concept_hooks-reference
category: concept
source_path: en/concept/hooks-reference.md
character_limit: 2000
last_update: '2025-08-30T10:42:20.777Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action React Hooks Reference

Context-Action React Hooks Reference This document is a comprehensive catalog of all available React hooks in the Context-Action framework, categorized by functionality and use cases. This serves as a reference manual for developers. Related Guides - 🎯 React Hooks - How to use hooks (API examples and usage patterns) - 🔄 Hooks Lifecycle - How hooks work internally (lifecycle, cleanup, performance)   - ✅ Best Practices - Coding patterns and conventions --- 📋 Table of Contents 1. Essential Hooks 2. Utility Hooks 3. Hook Categories 4. Usage Guidelines --- Essential Hooks These hooks are fundamental to using the Context-Action framework. Most applications will need these. 🔧 RefContext Hooks (Performance) createRefContext<T>() Factory function that creates all ref-related hooks for high-performance DOM manipulation. - Purpose: Creates type-safe direct DOM manipulation system with zero React re-renders - Returns: { Provider, useRefHandler, useWaitForRefs, useGetAllRefs } - Essential for: Perfor

Key points:
• 🎯 **[React Hooks](/en/guide/hooks)** - How to use hooks (API examples and usage patterns)
• 🔄 **[Hooks Lifecycle](/en/guide/hooks-lifecycle)** - How hooks work internally (lifecycle, cleanup, performance)
• ✅ **[Best Practices](/en/guide/best-practices)** - Coding patterns and conventions
• **Purpose**: Creates type-safe direct DOM manipulation system with zero React re-renders
• **Returns**: `{ Provider, useRefHandler, useWaitForRefs, useGetAllRefs }`
• **Essential for**: Performance-critical UI, animations, real-time interactions
• **Purpose**: Get ref handler for specific DOM element with type safety
•...