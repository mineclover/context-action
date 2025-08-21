# Async Patterns

Collection of patterns for handling asynchronous operations, element waiting, and DOM safety in the Context-Action framework.

## Overview

This section contains specialized patterns for async operations:

### Core Async Patterns
- **[Real-time State Access](./real-time-state-access.md)** - Avoiding closure traps with store.getValue()
- **[Wait-Then-Execute](./wait-then-execute.md)** - Safe DOM operations after element availability
- **[Conditional Await](./conditional-await.md)** - Smart waiting based on conditions
- **[Timeout Protection](./timeout-protection.md)** - Preventing infinite waits with fallback strategies

## Quick Reference

| Pattern | Purpose | Key Method |
|---------|---------|------------|
| **Real-time State Access** | Avoid stale closures | `store.getValue()` |
| **Wait-Then-Execute** | Safe DOM manipulation | `await waitForRefs()` |
| **Conditional Await** | Smart waiting | `if (condition) await waitForRefs()` |
| **Timeout Protection** | Prevent infinite waits | `Promise.race()` with timeout |

## Combined Pattern Example

```typescript
function CompleteAsyncComponent() {
  const { useStore } = createDeclarativeStorePattern('AsyncDemo', {
    isReady: false,
    isProcessing: false,
    retryCount: 0
  });
  
  const isReadyStore = useStore('isReady');
  const isProcessingStore = useStore('isProcessing');
  const retryCountStore = useStore('retryCount');
  
  const waitForRefs = useWaitForRefs();
  const elementRef = useAppRef('asyncElement');
  
  const complexAsyncOperation = useCallback(async () => {
    // Real-time state access pattern
    const isProcessing = isProcessingStore.getValue();
    if (isProcessing) return;
    
    isProcessingStore.setValue(true);
    
    try {
      // Conditional await pattern
      const isReady = isReadyStore.getValue();
      if (!isReady) {
        // Timeout protection pattern
        const success = await waitWithRetry('asyncElement', 3, 2000);
        
        if (!success) {
          throw new Error('Element not available after retries');
        }
      }
      
      // Wait-then-execute pattern
      await waitForRefs('asyncElement');
      
      const element = elementRef.target;
      if (element) {
        // Safe DOM manipulation
        element.style.transform = 'scale(1.1)';
        element.textContent = 'Operation completed!';
      }
      
      // Update state
      isReadyStore.setValue(true);
      retryCountStore.setValue(0);
      
    } catch (error) {
      console.error('Async operation failed:', error);
      const currentRetries = retryCountStore.getValue();
      retryCountStore.setValue(currentRetries + 1);
    } finally {
      isProcessingStore.setValue(false);
    }
  }, [isReadyStore, isProcessingStore, retryCountStore, waitForRefs, elementRef]);
  
  return (
    <div>
      <div ref={elementRef.setRef}>Async Target Element</div>
      <button onClick={complexAsyncOperation}>
        Execute Complex Async Operation
      </button>
    </div>
  );
}
```

## Best Practices

1. **Real-time State Access**: Always use `store.getValue()` in async operations
2. **Element Availability**: Use `waitForRefs` before DOM manipulation
3. **Timeout Protection**: Always protect against infinite waits
4. **Error Recovery**: Implement fallback strategies for failed operations
5. **State Management**: Update processing states to prevent race conditions
6. **Memory Management**: Properly clean up timeouts and async operations

## When to Use Each Pattern

- **Real-time State Access**: Any action handler that needs current state
- **Wait-Then-Execute**: DOM manipulation after dynamic element creation
- **Conditional Await**: Feature flags or state-dependent waiting
- **Timeout Protection**: Network-dependent or slow-loading elements

For detailed implementation examples and advanced use cases, see the individual pattern documentation.