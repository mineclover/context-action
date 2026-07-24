---
document_id: guide--actions-based-dispatching
category: guide
source_path: en/guide/actions-based-dispatching.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.156Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Actions-based Dispatching

Actions-based Dispatching Action-based dispatching provides a more intuitive and function-like approach to dispatching actions in Context-Action. Instead of using the traditional registry.dispatch() method, you can call actions directly as functions through the registry.actions property. Overview The actions property provides a function-based interface where each registered action becomes a callable function. This approach offers better developer experience with improved type safety and more intuitive syntax. Basic Usage 1. Define Action Types First, define your action types using the ActionPayloadMap interface: 2. Create ActionRegister Create an ActionRegister instance with your action types: 3. Register Handlers Register handlers for your actions: 4. Dispatch Actions Use the actions-based approach to dispatch actions: 5. Actions with Result Collection For detailed execution results, use actionsWithResult: Advanced Features Options Support Actions-based dispatching supports all the same options as traditional dispatching: Type Safety The actions-based approach provides excellent type safety: Filtering and Advanced Options You can use all the advanced filtering and execution options: Benefits 1. Intuitive Syntax Actions-based dispatching feels more natural and function-like: 2. Better Type Safety Full TypeScript support with autocomplete and compile-time error checking: 3. Consistent API All actions follow the same pattern regardless of whether they have payloads: 4. Full Feature Support All traditional dispatch features are available: - Execution modes (sequential, parallel, race) - Filtering (by handler ID, priority, custom filters) - Throttling and debouncing - Result collection - Abort signals - Error handling Migration from Traditional Dispatch If you're currently using traditional dispatch, migration is straightforward: Best Practices 1. Use Descriptive Action Names Choose action names that clearly describe what they do: 2. Define Clear Payload Types Use specific types for your payloads: 3. Handle Errors Appropriately Use proper error handling in your handlers: 4. Use Options Wisely Apply execution options based on your use case: Examples Complete Example Actions-based dispatching provides a more intuitive and developer-friendly way to work with Context-Action, while maintaining all the power and flexibility of the traditional approach.

Key points:
• Execution modes (sequential, parallel, race)
• Filtering (by handler ID, priority, custom filters)
• Throttling and debouncing
• Result collection
• Abort signals
• Error handling