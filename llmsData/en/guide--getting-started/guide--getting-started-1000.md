---
document_id: guide--getting-started
category: guide
source_path: en/guide/getting-started.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.366Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Getting Started

Context-Action provides three main patterns for building scalable React applications with perfect separation of concerns. Quick Start

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| 🎯 Action Only | Action dispatching without stores | createActionContext | Event systems, command patterns |
| 🏪 Store Only | State management without actions | createDeclarativeStorePattern | Pure state management, data layers |
| 🔧 Ref Context | Direct DOM manipulation with zero re-renders | createRefContext | High-performance UI, animations, real-time interactions |

🎯 Action Only Pattern

Pure action dispatching without state management. Basic Usage

🏪 Store Only Pattern

Type-safe state management without action dispatching. Basic Usage

🔧 Ref Context Pattern

High-performance direct DOM manipulation with zero React re-renders.
