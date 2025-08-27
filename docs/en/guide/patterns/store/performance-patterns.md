# Performance Patterns

Performance optimization patterns for store hooks including memoization, batching, debugging, and best practices.

## Memoization Strategies

### Stable Selectors with useCallback

```tsx
import { useCallback } from 'react';

// ✅ Good: Stable selector prevents unnecessary re-renders
const userName = useStoreValue(userStore, useCallback(
  user => user.name,
  [] // No dependencies needed for stable selector
));

// ❌ Avoid: New selector function on every render
const userName = useStoreValue(userStore, user => user.name);
```

### Complex Selector Memoization

```tsx
const processedUserData = useStoreValue(
  userStore,
  useCallback(user => ({
    displayName: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName[0]}${user.lastName[0]}`,
    status: user.isActive ? 'online' : 'offline',
    joinedDate: new Date(user.createdAt).toLocaleDateString()
  }), [])
);
```

### Memoized Computed Store Dependencies

```tsx
const memoizedComputation = useComputedStore(
  [userStore, settingsStore],
  useMemo(() => ([user, settings]) => {
    // Expensive computation here
    return performComplexCalculation(user, settings);
  }, []),
  {
    comparison: 'shallow'
  }
);
```

## Batched Updates

### Store Update Batching

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

### Store Batch API

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

## Lazy Evaluation Patterns

### Lazy State Access

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

### Conditional Store Access

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

## Subscription Optimization

### Selective Subscriptions

```tsx
// Only subscribe to specific fields
const userName = useStoreValue(userStore, user => user.name);
const userEmail = useStoreValue(userStore, user => user.email);

// Better: Group related subscriptions
const userBasicInfo = useStoreValue(userStore, user => ({
  name: user.name,
  email: user.email
}));
```

### Conditional Subscriptions

```tsx
const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(false);

// Only subscribe when needed
const liveData = useStoreValue(
  enableRealTimeUpdates ? dataStore : null,
  data => data?.liveMetrics
);
```

### Debounced Subscriptions

```tsx
// Debounce rapid store changes
const debouncedValue = useStoreValue(fastChangingStore, undefined, {
  debounce: 300  // Wait 300ms after last change
});

// Use with search or input scenarios
const searchResults = useStoreValue(searchStore, search => search.query, {
  debounce: 500
});
```

## Comparison Strategy Optimization

### Reference Comparison (Fastest)

```tsx
// For primitive values or when exact reference matters
const primitiveValue = useStoreValue(store, undefined, {
  comparison: 'reference' // Default, fastest
});
```

### Shallow Comparison (Balanced)

```tsx
// For objects with shallow changes
const shallowData = useStoreValue(settingsStore, undefined, {
  comparison: 'shallow' // Good balance of performance and accuracy
});
```

### Deep Comparison (Most Accurate)

```tsx
// Only when necessary for complex nested objects
const deepData = useStoreValue(complexStore, undefined, {
  comparison: 'deep' // Most thorough, use sparingly
});
```

### Custom Comparison

```tsx
const customComparison = useStoreValue(userStore, user => user.profile, {
  customComparator: (prev, next) => {
    // Only update if specific fields changed
    return prev.name === next.name && prev.avatar === next.avatar;
  }
});
```

### Circular Reference Safe Comparison

```tsx
// ✅ CORRECT: Safe handling of circular references
const circularSafeComparison = useStoreValue(complexStore, undefined, {
  customComparator: (prev, next) => {
    // The framework automatically handles circular references in deep comparison
    // But for custom comparators, use safe comparison patterns
    
    try {
      // Use JSON.stringify for simple circular reference detection
      const prevStr = JSON.stringify(prev, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seenObjects.has(value)) return '[Circular]';
          seenObjects.add(value);
        }
        return value;
      });
      
      const nextStr = JSON.stringify(next, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seenObjects.has(value)) return '[Circular]';
          seenObjects.add(value);
        }
        return value;
      });
      
      return prevStr === nextStr;
    } catch {
      // Fallback to reference comparison for complex circular structures
      return Object.is(prev, next);
    }
  }
});

// Helper for circular reference detection
const seenObjects = new WeakSet();
```

## Memory Management

### Event Object Storage Prevention

```tsx
// ❌ WRONG: Storing event objects causes memory leaks
function BadEventHandler() {
  const eventStore = useAppStore('events');
  
  const handleClick = (event) => {
    // This will cause memory leaks - DOM events retain references
    eventStore.setValue({ lastEvent: event }); // Don't do this!
  };
  
  return <button onClick={handleClick}>Bad Click</button>;
}

// ✅ CORRECT: Extract only needed data from events
function GoodEventHandler() {
  const eventStore = useAppStore('events');
  
  const handleClick = useCallback((event) => {
    // Extract only the data you need
    const eventData = {
      clientX: event.clientX,
      clientY: event.clientY,
      target: event.target?.tagName,
      timestamp: Date.now(),
      type: event.type
    };
    
    eventStore.setValue({ lastEventData: eventData });
  }, [eventStore]);
  
  return <button onClick={handleClick}>Good Click</button>;
}
```

### Cleanup Subscriptions

```tsx
function UserComponent() {
  const userStore = useAppStore('user');
  
  useEffect(() => {
    // Manual subscription with cleanup
    const unsubscribe = userStore.subscribe((user, prevUser) => {
      // Handle user changes
      console.log('User changed:', { user, prevUser });
    });
    
    // Cleanup subscription
    return unsubscribe;
  }, [userStore]);
  
  return <div>User Component</div>;
}
```

### Cross-Platform Timeout Handling

```tsx
// ✅ CORRECT: Cross-platform compatible timeout handling
function useCrossPlatformTimeout() {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof requestAnimationFrame> | null>(null);
  
  const scheduleUpdate = useCallback((callback: () => void, delay: number = 0) => {
    // Cancel existing timeout
    if (timeoutId) {
      if (typeof timeoutId === 'number' && typeof window !== 'undefined') {
        cancelAnimationFrame(timeoutId);
      } else {
        clearTimeout(timeoutId);
      }
    }
    
    // Schedule new update - use requestAnimationFrame for better performance
    const newTimeoutId = delay === 0 
      ? requestAnimationFrame(callback)
      : setTimeout(callback, delay) as any;
    
    setTimeoutId(newTimeoutId);
  }, [timeoutId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        if (typeof timeoutId === 'number' && typeof window !== 'undefined') {
          cancelAnimationFrame(timeoutId);
        } else {
          clearTimeout(timeoutId);
        }
      }
    };
  }, [timeoutId]);
  
  return scheduleUpdate;
}
```

### Weak References for Large Data

```tsx
const largeDataCache = new WeakMap();

const processedLargeData = useComputedStore(
  [largeDataStore],
  ([data]) => {
    // Use WeakMap for caching large objects
    if (largeDataCache.has(data)) {
      return largeDataCache.get(data);
    }
    
    const processed = expensiveProcessing(data);
    largeDataCache.set(data, processed);
    return processed;
  }
);
```

## Debugging and Development

### Debug Mode for Stores

```tsx
const debugUser = useStoreValue(userStore, undefined, {
  debug: true,
  debugName: 'UserProfile'
});

// Console output:
// [UserProfile] Store value changed: { previous: {...}, current: {...} }
```

### Performance Monitoring

```tsx
const useStorePerformanceMonitor = (storeName) => {
  const [metrics, setMetrics] = useState({
    updateCount: 0,
    lastUpdate: null,
    averageUpdateInterval: 0
  });
  
  const store = useAppStore(storeName);
  
  useEffect(() => {
    const startTime = Date.now();
    let updateCount = 0;
    let lastUpdateTime = startTime;
    
    const unsubscribe = store.subscribe(() => {
      const now = Date.now();
      updateCount++;
      
      setMetrics(prev => ({
        updateCount,
        lastUpdate: now,
        averageUpdateInterval: (now - startTime) / updateCount
      }));
      
      lastUpdateTime = now;
    });
    
    return unsubscribe;
  }, [store]);
  
  return metrics;
};

// Usage
function MonitoredComponent() {
  const metrics = useStorePerformanceMonitor('user');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Store metrics:', metrics);
  }
  
  return <div>Component with monitoring</div>;
}
```

### Store State Inspection

```tsx
const useStoreDebugger = (stores) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const unsubscribers = Object.entries(stores).map(([name, store]) => {
      return store.subscribe((value, previous) => {
        console.group(`🏪 Store [${name}] Updated`);
        console.log('Previous:', previous);
        console.log('Current:', value);
        console.log('Changed:', !Object.is(previous, value));
        console.groupEnd();
      });
    });
    
    return () => unsubscribers.forEach(unsub => unsub());
  }, [stores]);
};

// Usage
function DebuggedApp() {
  const userStore = useAppStore('user');
  const settingsStore = useAppStore('settings');
  
  useStoreDebugger({
    user: userStore,
    settings: settingsStore
  });
  
  return <div>App with store debugging</div>;
}
```

## Real-World Optimization Examples

### Optimized User Dashboard

```tsx
function OptimizedUserDashboard() {
  // Memoize expensive selector
  const userStats = useStoreValue(
    userStore,
    useCallback(user => ({
      name: user.name,
      totalOrders: user.orders?.length || 0,
      totalSpent: user.orders?.reduce((sum, order) => sum + order.total, 0) || 0,
      memberSince: new Date(user.createdAt).getFullYear()
    }), [])
  );
  
  // Use shallow comparison for settings
  const displaySettings = useStoreValue(settingsStore, undefined, {
    comparison: 'shallow'
  });
  
  // Debounce search updates
  const searchResults = useStoreValue(searchStore, search => search.results, {
    debounce: 300
  });
  
  return (
    <div>
      <h1>Welcome, {userStats.name}!</h1>
      <div>Orders: {userStats.totalOrders}</div>
      <div>Total Spent: ${userStats.totalSpent}</div>
    </div>
  );
}
```

### High-Performance Data Table

```tsx
function OptimizedDataTable() {
  // Use computed store for expensive filtering/sorting
  const processedData = useComputedStore(
    [dataStore, filtersStore, sortStore],
    ([data, filters, sort]) => {
      let filtered = data;
      
      // Apply filters
      if (filters.searchTerm) {
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }
      
      if (filters.category !== 'all') {
        filtered = filtered.filter(item => item.category === filters.category);
      }
      
      // Apply sorting
      if (sort.field) {
        filtered.sort((a, b) => {
          const aValue = a[sort.field];
          const bValue = b[sort.field];
          const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return sort.direction === 'desc' ? -result : result;
        });
      }
      
      return filtered;
    },
    {
      comparison: 'shallow',
      cacheKey: 'table-data'
    }
  );
  
  return (
    <table>
      {processedData.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>{item.category}</td>
        </tr>
      ))}
    </table>
  );
}
```

## Error Handling & Recovery

### Centralized Error Handling

```tsx
// ✅ CORRECT: Use framework's centralized error handling
import { ErrorHandlers } from '@context-action/react';

function useStoreErrorHandling() {
  const handleStoreError = useCallback((error: Error, context: any) => {
    // Framework provides centralized error handling
    ErrorHandlers.store('Store operation failed', {
      storeName: context.storeName,
      operation: context.operation,
      timestamp: Date.now()
    }, error);
  }, []);

  return { handleStoreError };
}

// Store operations with error handling
function useSafeStoreOperations() {
  const userStore = useAppStore('user');
  
  const safeUpdate = useCallback(async (userData: any) => {
    try {
      userStore.setValue(userData);
    } catch (error) {
      // Framework automatically handles this through centralized error system
      // No need for manual console.error - it's handled centrally
      throw error; // Re-throw to maintain error propagation
    }
  }, [userStore]);
  
  return { safeUpdate };
}
```

### EventBus Memory Safety

```tsx
// ✅ CORRECT: EventBus automatically handles memory-heavy objects
function useEventBusSafety() {
  const [eventBus] = useState(() => new EventBus());
  
  const emitSafeEvent = useCallback((eventName: string, data: any) => {
    // EventBus automatically detects and safely handles:
    // - DOM elements
    // - React components  
    // - Large objects
    // - Circular references
    
    eventBus.emit(eventName, data);
  }, [eventBus]);
  
  const handleDOMEvent = useCallback((event: Event) => {
    // Safe to pass DOM events - EventBus extracts only essential metadata
    eventBus.emit('dom-interaction', event);
  }, [eventBus]);
  
  return { emitSafeEvent, handleDOMEvent };
}
```

## Best Practices Summary

### ✅ Do

- Use `useCallback` for stable selectors
- Batch multiple store updates
- Choose appropriate comparison strategies
- Enable debug mode in development
- Monitor performance in complex applications
- Use lazy evaluation for expensive operations
- Extract data from DOM events instead of storing event objects
- Use framework's centralized error handling system
- Handle circular references in custom comparators

### ❌ Avoid

- Creating new functions in selectors on every render
- Deep comparisons unless absolutely necessary
- Subscribing to entire large objects when only parts are needed
- Ignoring subscription cleanup
- Side effects in computed values
- Excessive debugging in production
- Storing DOM events or React synthetic events in stores
- Using direct console.error instead of centralized error handling
- Assuming timeout types are consistent across platforms

## Related Patterns

- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [useStoreSelector Patterns](./useStoreSelector-patterns.md) - Multiple store selection
- [useComputedStore Patterns](./useComputedStore-patterns.md) - Computed value patterns