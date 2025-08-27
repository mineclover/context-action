# Lazy Evaluation Patterns

Optimization patterns for deferring expensive operations and accessing store values only when needed, improving performance by avoiding unnecessary work.

## Lazy State Access

Access current state at execution time, not render time:

```tsx
const handleAction = useCallback(async () => {
  // Get current state at execution time, not render time
  const userStore = manager.getStore('user');
  const settingsStore = manager.getStore('settings');
  
  const currentUser = userStore.getValue();
  const currentSettings = settingsStore.getValue();
  
  // Process with fresh state
  await processData(currentUser, currentSettings);
}, [manager]);
```

## Conditional Store Access

Only access stores when certain conditions are met:

```tsx
const handleConditionalUpdate = useCallback((condition, data) => {
  if (!condition) return;
  
  // Only access stores when needed
  const dataStore = manager.getStore('data');
  const cacheStore = manager.getStore('cache');
  
  if (dataStore.getValue().shouldUpdate) {
    dataStore.setValue(data);
    cacheStore.update(cache => ({ ...cache, lastUpdated: Date.now() }));
  }
}, [manager]);
```

## Lazy Computation Patterns

### Deferred Expensive Calculations

```tsx
const useExpensiveCalculation = (inputStore, enabled) => {
  return useMemo(() => {
    if (!enabled) return null;
    
    // Only perform expensive calculation when enabled
    const input = inputStore.getValue();
    return performExpensiveCalculation(input);
  }, [inputStore, enabled]);
};
```

### Lazy Loading with Stores

```tsx
const useLazyDataLoader = (keyStore) => {
  const [loadedData, setLoadedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadData = useCallback(async () => {
    if (isLoading || loadedData) return;
    
    setIsLoading(true);
    try {
      // Access key only when loading
      const key = keyStore.getValue();
      const data = await fetchData(key);
      setLoadedData(data);
    } finally {
      setIsLoading(false);
    }
  }, [keyStore, isLoading, loadedData]);
  
  return { loadedData, isLoading, loadData };
};
```

## When to Use Lazy Evaluation

### Ideal Scenarios
- **Expensive Operations**: When computations are costly and may not be needed
- **Conditional Logic**: When operations depend on runtime conditions
- **Fresh State Requirements**: When you need the most current state at execution time
- **Resource Conservation**: When minimizing unnecessary work is important

### Performance Benefits
- **Reduced CPU Usage**: Avoid unnecessary calculations
- **Better Memory Usage**: Don't hold onto expensive computed values
- **Improved Responsiveness**: Defer work until actually needed
- **Fresh Data**: Always use current state values

## Best Practices

### ✅ Do
- Access store values at execution time for event handlers
- Use conditional checks before expensive operations
- Implement lazy loading for optional or expensive data
- Profile to identify expensive operations that can be deferred

### ❌ Avoid
- Accessing store values during render for imperative operations
- Performing expensive calculations without checking if they're needed
- Caching stale state values when fresh data is required
- Over-optimizing simple operations

## Related Patterns

- [Memoization Patterns](./memoization-patterns.md) - Cache expensive computations
- [Subscription Optimization](./subscription-optimization.md) - Optimize when to subscribe
- [Memory Management](./memory-management.md) - Efficient resource usage
- [useStoreManager API](./useStoreManager-api.md) - Store manager usage patterns