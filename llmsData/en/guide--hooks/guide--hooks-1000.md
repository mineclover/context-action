---
document_id: guide--hooks
category: guide
source_path: en/guide/lifecycle/hooks.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.303Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Hooks

Context-Action provides React hooks for action dispatching and store management. This guide covers how to use the hooks with API examples and usage patterns. Related Guides

- 🔄 Hooks Lifecycle - How hooks work internally (lifecycle, cleanup, performance)
- 📚 Hooks Reference - Complete catalog of all available hooks
- ✅ Best Practices - Coding patterns and conventions

Essential Hooks

These are the core hooks you'll use most frequently. Action Hooks

createActionContext<T>()
Factory function that creates all action-related hooks. useActionDispatch()
Primary hook for dispatching actions to handlers. useActionHandler()
Primary hook for registering action handlers. Store Hooks

createDeclarativeStorePattern<T>()
Factory function that creates all store-related hooks. useStoreValue<T>(store)
Primary hook for subscribing to store changes. useStore(name)
Primary hook for accessing stores by name. Utility Hooks

Additional hooks for advanced scenarios.
