---
document_id: guide--actions-based-dispatching
category: guide
source_path: en/guide/actions-based-dispatching.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.156Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Actions-based Dispatching

Actions-based Dispatching Action-based dispatching provides a more intuitive and function-like approach to dispatching actions in Context-Action. Instead of using the traditional registry.dispatch() method, you can call actions directly as functions through the registry.actions property. Overview The actions property provides a function-based interface where each registered action becomes a callable function. This approach offers better developer experience with improved type safety and more intuitive syntax. Basic Usage 1. Define Action Types First, define your action types using the ActionPayloadMap interface: 2. Create ActionRegister Create an ActionRegister instance with your action types: 3. Register Handlers Register handlers for your actions: 4. Dispatch Actions Use the actions-based approach to dispatch actions: 5. Actions with Result Collection For detailed execution results, use actionsWithResult: Advanced Features Options Support Actions-based dispatching supports all the s

Key points:
• Execution modes (sequential, parallel, race)
• Filtering (by handler ID, priority, custom filters)
• Throttling and debouncing
• Result collection
• Abort signals
• Error handling