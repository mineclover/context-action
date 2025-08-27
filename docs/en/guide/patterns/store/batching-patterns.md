# Batched Updates

Optimization patterns for batching multiple store updates to prevent unnecessary re-renders and improve performance.

## Store Update Batching

Use React's `unstable_batchedUpdates` to batch multiple store updates:

```tsx
import { unstable_batchedUpdates } from 'react-dom';

const handleBulkUpdate = useCallback(async (updates) => {
  // Batch multiple store updates to prevent unnecessary re-renders
  unstable_batchedUpdates(() => {
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const profileStore = manager.getStore('profile');
    
    userStore.update(user => ({ ...user, ...updates.user }));
    settingsStore.update(settings => ({ ...settings, ...updates.settings }));
    profileStore.update(profile => ({ ...profile, ...updates.profile }));
  });
}, [manager]);
```

## Store Batch API

Use the store's built-in batch method for optimal performance:

```tsx
const updateMultipleStores = useCallback(async (updates) => {
  const userStore = manager.getStore('user');
  
  // Use store's batch method for optimal performance
  userStore.batch(() => {
    userStore.update(user => ({ ...user, ...updates.user }));
    
    // Other store operations within the batch
    const profileStore = manager.getStore('profile');
    profileStore.update(profile => ({ ...profile, ...updates.profile }));
    
    const settingsStore = manager.getStore('settings');
    settingsStore.update(settings => ({ ...settings, ...updates.settings }));
  });
}, [manager]);
```

## When to Use Batching

### Ideal Scenarios
- **Multiple Store Updates**: When updating several stores simultaneously
- **Related Operations**: When operations are logically related and should appear atomic
- **Performance Critical**: When minimizing re-renders is crucial for performance
- **Form Submissions**: When processing complex form data across multiple stores

### Performance Benefits
- **Reduced Re-renders**: Multiple updates trigger only one re-render
- **Better UX**: Atomic updates prevent intermediate inconsistent states
- **Improved Performance**: Fewer DOM updates and effect executions

## Best Practices

### ✅ Do
- Batch related store updates together
- Use store's native batch method when available
- Keep batched operations focused and atomic
- Profile performance impact of batching

### ❌ Avoid
- Batching unrelated operations
- Over-batching simple single updates
- Nesting multiple batch operations
- Batching operations that need intermediate states

## Related Patterns

- [Memory Management](./memory-management.md) - Efficient resource management
- [useStoreManager API](./useStoreManager-api.md) - Store manager usage patterns
- [Store Configuration](./store-configuration.md) - Advanced store configuration