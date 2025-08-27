# Error Handling & Recovery

Patterns for robust error handling and recovery in store operations, including centralized error management and safe event handling.

## Centralized Error Handling

Use the framework's centralized error handling system for consistent error management:

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

## EventBus Memory Safety

EventBus automatically handles memory-heavy objects safely:

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

## Error Recovery Patterns

### Graceful Degradation

```tsx
const useGracefulStore = (storeName, fallbackValue) => {
  const [error, setError] = useState(null);
  
  try {
    const store = useAppStore(storeName);
    const value = useStoreValue(store);
    
    // Reset error if store is working
    if (error) setError(null);
    
    return { value, error: null, hasError: false };
  } catch (err) {
    if (!error) setError(err);
    
    return { 
      value: fallbackValue, 
      error: err, 
      hasError: true 
    };
  }
};
```

### Retry Mechanisms

```tsx
const useStoreWithRetry = (storeName, maxRetries = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  
  const store = useAppStore(storeName);
  
  const safeOperation = useCallback(async (operation) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation(store);
        setRetryCount(0);
        setLastError(null);
        return result;
      } catch (error) {
        setLastError(error);
        setRetryCount(attempt + 1);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }, [store, maxRetries]);
  
  return { safeOperation, retryCount, lastError };
};
```

## Error Boundary Integration

### Store Error Boundary

```tsx
class StoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    // Check if error is store-related
    if (error.name === 'StoreError' || error.context?.storeName) {
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }
  
  componentDidCatch(error, errorInfo) {
    // Log store errors with context
    ErrorHandlers.store('Store error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }, error);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Store Error: Unable to load data</div>;
    }
    
    return this.props.children;
  }
}
```

## Best Practices

### Error Handling Strategy
1. **Use Centralized System**: Leverage framework's error handling
2. **Graceful Degradation**: Provide fallback values and states
3. **Error Boundaries**: Catch and handle store-specific errors
4. **Retry Logic**: Implement retry mechanisms for transient failures

### Memory Safety
- **EventBus Integration**: Use framework's safe event handling
- **Automatic Cleanup**: Rely on framework's automatic memory management
- **Error Context**: Provide rich context for error diagnosis
- **Resource Management**: Ensure proper cleanup on errors

### ✅ Do
- Use framework's centralized error handling system
- Provide fallback values for critical data
- Implement retry logic for transient failures
- Log errors with sufficient context for debugging

### ❌ Avoid
- Manual console.error instead of centralized error handling
- Storing error states directly in application stores
- Ignoring error propagation and recovery
- Creating memory leaks in error handling code

## Related Patterns

- [Memory Management](./memory-management.md) - Prevent memory leaks in error scenarios
- [Debugging & Development](./debugging-development.md) - Debug error handling code
- [Production Debugging](../debug/production-debugging.md) - Production error handling
- [Store Configuration](./store-configuration.md) - Configure error handling behavior