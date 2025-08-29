---
document_id: en_concept_ref-mount-patterns
category: concept
source_path: en/concept/ref-mount-patterns.md
character_limit: 5000
last_update: '2025-08-29T13:15:13.548Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext Mount State Patterns

RefContext Mount State Patterns Overview RefContext provides multiple patterns for handling mount state. Understanding the differences between these patterns is crucial for proper implementation. ✅ Recommended: Reactive Mount State Pattern Use useRefMountState for truly reactive mount state subscription: Benefits - Automatic State Updates: Mount/unmount state changes automatically trigger re-renders - No Manual Cleanup: No need to manually set state to false on unmount - Type Safety: Full TypeScript support with proper typing - Reactive: Integrates naturally with React's reactivity model ⚠️ Common Pitfall: onMount Callback Pattern The onMount callback pattern has a subtle but important limitation: The Issue The unregister function returned by onMount: - ✅ Removes the callback from the internal callback set - ❌ Does NOT update your local state - ❌ Does NOT notify about unmount events Correct Usage with onMount If you must use onMount, handle unmount manually: Pattern Comparison | Pattern | Mount Detection | Unmount Detection | Reactivity | Recommended | |---------|----------------|-------------------|------------|-------------| | useRefMountState | ✅ Automatic | ✅ Automatic | ✅ Full | ✅ Yes | | onMount callback | ✅ Manual | ❌ Not provided | ⚠️ Partial | ❌ No | | executeIfMounted | N/A | N/A | ❌ None | ⚠️ Conditional | Best Practices 1. Always Use Reactive Patterns for State-Dependent UI 2. Use onMount Only for One-Time Initialization 3. Combine Patterns When Needed Migration Guide From onMount to useRefMountState Before: After: Summary - Always prefer useRefMountState for reactive mount state management - Be aware that onMount's unregister function doesn't handle unmount state - Use onMount only for one-time initialization that doesn't affect React state - Combine patterns when you need both reactive state and initialization callbacks

Key points:
• **Automatic State Updates**: Mount/unmount state changes automatically trigger re-renders
• **No Manual Cleanup**: No need to manually set state to false on unmount
• **Type Safety**: Full TypeScript support with proper typing
• **Reactive**: Integrates naturally with React's reactivity model
• ✅ Removes the callback from the internal callback set
• ❌ Does NOT update your local state
• ❌ Does NOT notify about unmount events
• **Always prefer `useRefMountState`** for reactive mount state management
• **Be aware** that `onMount`'s unregister function doesn't handle unmount state
• **Use onMount** only for one-time initialization that doesn't affect React state
• **Combine patterns** when you need both reactive state and initialization callbacks