---
document_id: en_guide_hooks
category: guide
source_path: en/guide/lifecycle/hooks.md
character_limit: 2000
last_update: '2025-08-30T10:42:07.081Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Hooks

React Hooks Context-Action provides React hooks for action dispatching and store management. This guide covers how to use the hooks with API examples and usage patterns. Related Guides - 🔄 Hooks Lifecycle - How hooks work internally (lifecycle, cleanup, performance) - 📚 Hooks Reference - Complete catalog of all available hooks - ✅ Best Practices - Coding patterns and conventions Essential Hooks These are the core hooks you'll use most frequently. Action Hooks createActionContext<T>() Factory function that creates all action-related hooks. useActionDispatch() Primary hook for dispatching actions to handlers. useActionHandler() Primary hook for registering action handlers. Store Hooks createStoreContext<T>() Factory function that creates all store-related hooks. useStoreValue<T>(store) Primary hook for subscribing to store changes. useStore(name) Primary hook for accessing stores by name. Utility Hooks Additional hooks for advanced scenarios. Store Management useStoreManager() Hook for updating stores

Key points:
• 🔄 **[Hooks Lifecycle](./hooks-lifecycle.md)** - How hooks work internally (lifecycle, cleanup, performance)
• 📚 **[Hooks Reference](/en/concept/hooks-reference)** - Complete catalog of all available hooks
• ✅ **[Best Practices](../best-practices.md)** - Coding patterns and conventions
• Store subscriptions are optimized for minimal re-renders
• Handler registration uses stable references
• Action dispatching is automatically memoized
• **Use useCallback for handlers** (see [Lifecycle Guide](/en/guide/hooks-lifecycle) for details):
• **Combine patterns when needed**:
• **Type-safe store access**: