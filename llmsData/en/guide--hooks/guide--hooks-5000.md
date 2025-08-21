---
document_id: guide--hooks
category: guide
source_path: en/guide/hooks.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.368Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Hooks

Context-Action provides React hooks for action dispatching and store management. Essential Hooks

These are the core hooks you'll use most frequently. Action Hooks

createActionContext<T>()
Factory function that creates all action-related hooks. useActionDispatch()
Primary hook for dispatching actions to handlers. useActionHandler()
Primary hook for registering action handlers. Store Hooks

createDeclarativeStorePattern<T>()
Factory function that creates all store-related hooks. useStoreValue<T>(store)
Primary hook for subscribing to store changes. useStore(name)
Primary hook for accessing stores by name. Utility Hooks

Additional hooks for advanced scenarios. Store Management

useStoreManager()
Hook for updating stores programmatically. Advanced Action Hooks

useActionDispatchWithResult()
Hook that provides both dispatch and result collection capabilities. Usage Guidelines

Best Practices

1. Use useCallback for handlers:

2. Combine patterns when needed:

3. Type-safe store access:

Performance Tips

- Store subscriptions only re-render on actual value changes
- Use specific store subscriptions rather than subscribing to entire state
- Handler registration is optimized for minimal re-renders
- Action dispatching is memoized automatically.
