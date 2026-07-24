---
document_id: guide--patterns--action--type-system
category: guide
source_path: en/guide/patterns/action/type-system.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.184Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Action Type System

Action Type System Complete guide to the Context-Action framework's type system for actions, including ActionPayloadMap, type safety, and TypeScript integration. Prerequisites For action type definitions and context setup, see Basic Action Setup. This document demonstrates type system patterns using the action setup: - Type definitions → Extended Action Interface - Common patterns → Common Action Patterns ActionPayloadMap Interface The foundation of type-safe action handling in the Context-Action framework. Basic Action Mapping Usage with ActionRegister Pipeline Controller Types Type-safe pipeline control for action handlers. Basic Pipeline Control Early Return with Result Priority Jumping Action Handler Types Type-safe action handler definitions with full TypeScript support. Store Integration Pattern Async Handler with Error Handling Handler Configuration Type-safe handler configuration with comprehensive options. Basic Handler Configuration Advanced Configuration Conditional Handler Real-World Examples - TodoListDemo - Complete todo list with action types - ChatDemo - Chat system with message actions - UserProfileDemo - User profile management Related Patterns - Action Basic Usage - Fundamental action patterns - Register Delegation - Advanced registration patterns - Store Integration - Integrating with stores

Key points:
• Type definitions → [Extended Action Interface](../setup/basic-action-setup.md#extended-action-interface)
• Common patterns → [Common Action Patterns](../setup/basic-action-setup.md#common-action-patterns)
• [TodoListDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - Complete todo list with action types
• [ChatDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - Chat system with message actions
• [UserProfileDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - User profile management
• [Action Basic Usage](./basic-usage.md) - Fundamental action patterns
• [Register Delegation](./register-delegation.md) - Advanced registration patterns
• [Store Integration](../store/basic-usage.md) - Integrating with stores