# Debugging & Development

Development tools and debugging patterns for store operations, including debug modes, performance monitoring, and state inspection utilities.

## Debug Mode for Stores

Enable debug mode to track store value changes during development:

```tsx
const debugUser = useStoreValue(userStore, undefined, {
  debug: true,
  debugName: 'UserProfile'
});

// Console output:
// [UserProfile] Store value changed: { previous: {...}, current: {...} }
```

## Performance Monitoring

Monitor store performance with custom performance tracking:

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

## Store State Inspection

Create a debugging utility to inspect multiple stores:

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

## Development Tools

### Store Value Inspector

```tsx
const useStoreInspector = (store, enabled = process.env.NODE_ENV === 'development') => {
  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = store.subscribe((value, previous) => {
      console.table({
        'Store': store.name || 'Unknown',
        'Previous': JSON.stringify(previous, null, 2),
        'Current': JSON.stringify(value, null, 2),
        'Timestamp': new Date().toISOString()
      });
    });
    
    return unsubscribe;
  }, [store, enabled]);
};
```

### Performance Profiler

```tsx
const useStoreProfiler = (stores) => {
  const [profile, setProfile] = useState({});
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const profiler = {};
    
    const unsubscribers = Object.entries(stores).map(([name, store]) => {
      profiler[name] = {
        updates: 0,
        lastUpdate: Date.now(),
        intervals: []
      };
      
      return store.subscribe(() => {
        const now = Date.now();
        const interval = now - profiler[name].lastUpdate;
        
        profiler[name].updates++;
        profiler[name].intervals.push(interval);
        profiler[name].lastUpdate = now;
        
        // Keep only last 100 intervals
        if (profiler[name].intervals.length > 100) {
          profiler[name].intervals.shift();
        }
        
        setProfile({ ...profiler });
      });
    });
    
    return () => unsubscribers.forEach(unsub => unsub());
  }, [stores]);
  
  return profile;
};
```

## Debugging Strategies

### Development Workflow
1. **Enable Debug Mode**: Use debug flags during development
2. **Monitor Performance**: Track update frequencies and patterns
3. **Inspect State Changes**: Log state transitions for debugging
4. **Profile Subscriptions**: Identify performance bottlenecks

### Production Considerations
- **Disable Debug Code**: Ensure debug code is stripped from production
- **Conditional Logging**: Use environment checks for debug output
- **Memory Monitoring**: Monitor memory usage in production
- **Error Reporting**: Implement error tracking for production issues

## Best Practices

### ✅ Do
- Use debug mode only in development environment
- Monitor performance metrics during development
- Create reusable debugging utilities
- Profile subscription patterns and update frequencies

### ❌ Avoid
- Leaving debug code enabled in production
- Excessive logging that impacts performance
- Debug utilities that create memory leaks
- Performance monitoring in production without proper controls

## Related Patterns

- [Memory Management](./memory-management.md) - Prevent memory leaks in debugging code
- [Error Handling & Recovery](./error-handling-recovery.md) - Handle debugging errors safely
- [Subscription Optimization](./subscription-optimization.md) - Optimize subscription patterns
- [Production Debugging](../debug/production-debugging.md) - Production debugging techniques