# Memory Management

Patterns for preventing memory leaks and managing resources efficiently in store operations, including event handling, subscriptions, and data caching.

## Event Object Storage Prevention

Never store DOM event objects directly in stores as they can cause memory leaks:

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

## Cleanup Subscriptions

Always clean up manual subscriptions to prevent memory leaks:

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

## Cross-Platform Timeout Handling

Handle timeouts safely across different JavaScript environments:

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

## Weak References for Large Data

Use WeakMap and WeakSet for caching large objects without preventing garbage collection:

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

## Memory Management Best Practices

### Event Handling
- **Extract Data**: Only extract needed data from DOM events
- **Avoid References**: Never store entire DOM elements or React synthetic events
- **Use Primitives**: Prefer primitive values and plain objects
- **Clean Extraction**: Create new objects with only necessary properties

### Subscription Management
- **Auto Cleanup**: Use React hooks that handle cleanup automatically
- **Manual Cleanup**: Always return cleanup functions from useEffect
- **Conditional Subscriptions**: Unsubscribe when subscriptions are no longer needed
- **Memory Monitoring**: Monitor subscription count in development

### Data Caching
- **WeakMap/WeakSet**: Use for object-keyed caches to allow garbage collection
- **TTL Patterns**: Implement time-to-live for cache entries
- **Size Limits**: Set maximum cache sizes and implement eviction policies
- **Cleanup Cycles**: Periodically clean up stale cache entries

## Common Memory Leak Sources

### ❌ Avoid These Patterns
- Storing DOM events or synthetic events in stores
- Creating closures that capture large objects unnecessarily  
- Forgetting to unsubscribe from manual subscriptions
- Keeping references to unmounted components
- Accumulating data without cleanup strategies

### ✅ Use These Patterns Instead
- Extract only needed data from events before storing
- Use React hooks with proper cleanup
- Implement automatic subscription management
- Use WeakMap/WeakSet for object references
- Implement data retention policies

## Related Patterns

- [Subscription Optimization](./subscription-optimization.md) - Efficient subscription patterns
- [Error Handling & Recovery](./error-handling-recovery.md) - Safe error handling
- [Lazy Evaluation Patterns](./lazy-evaluation-patterns.md) - Defer expensive operations
- [Debugging & Development](./debugging-development.md) - Memory debugging techniques