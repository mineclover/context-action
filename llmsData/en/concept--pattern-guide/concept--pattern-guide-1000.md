---
document_id: concept--pattern-guide
category: concept
source_path: en/concept/pattern-guide.md
character_limit: 1000
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

When to use: Pure action dispatching without state management (event systems, command patterns).
