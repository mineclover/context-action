# Troubleshooting Guide

Common issues and solutions for the Context-Action framework.

## 🔧 Common Framework Issues

### Memory Leak Issues

#### Event Object Storage Prevention
**Issue**: DOM event objects being stored in stores causing memory leaks.

**Solution**: The framework automatically detects and prevents storing event objects:

```tsx
// ❌ This will trigger an error and prevent storage
store.setValue({ event: domEvent });

// ✅ Extract only needed data
store.setValue({ 
  eventData: {
    clientX: domEvent.clientX,
    clientY: domEvent.clientY,
    timestamp: Date.now()
  }
});
```

**Error Message**: 
```
[Context-Action] Event object detected in Store.setValue - this may cause memory leaks
```

#### EventBus Memory Optimization
**Issue**: Large objects (DOM elements, React components) stored in event history causing memory leaks.

**Solution**: EventBus automatically stores only essential metadata for memory-heavy objects:

```tsx
// EventBus automatically handles this:
eventBus.emit('domUpdate', domElement);
// Stores: { __eventBusDataType: 'DOMElement', tagName: 'DIV', id: 'myId', className: 'container' }
```

### Type Compatibility Issues

#### Cross-Platform Timeout Types
**Issue**: `setTimeout` returns different types in browser vs Node.js environments.

**Solution**: Use proper timeout types for cross-platform compatibility:

```tsx
// ✅ Framework uses this approach internally
private batchTimeoutId: ReturnType<typeof requestAnimationFrame> | null = null;
```

### Comparison & Circular Reference Issues

#### Circular Reference Detection
**Issue**: Incorrect circular reference detection in deep comparison.

**Solution**: The framework uses improved circular reference checking:

```tsx
// Framework handles this automatically:
// Checks each value individually rather than both together
if (visited.has(a)) {
  return Object.is(a, b);
}
if (visited.has(b)) {
  return Object.is(a, b);
}
```

### Error Handling Standardization

#### Centralized Error System
**Issue**: Inconsistent error handling across modules.

**Solution**: All modules use standardized `ErrorHandlers`:

```tsx
// Framework uses centralized error handling
ErrorHandlers.store('Error in event handler', {
  event: eventName,
  handlerCount: handlers.size
}, error);
```

## 🚨 Critical Performance Issues

For detailed troubleshooting guides, see:
- [Infinite Loop Issues](/troubleshooting/infinite-loop-issues.md) - Comprehensive guide for all infinite loop patterns (NEW)
- [Performance Issues](/troubleshooting/performance-issues.md) - Memory management, re-renders, and optimization

### Quick Reference: Infinite Loop Prevention

#### Toast System Infinite Loops
**Issue**: Application freezes when toast limit is reached, causing infinite HMR updates.

**Root Cause**: When `maxToasts` limit is reached, removing old toasts triggers tracked actions that create new toasts:

```tsx
// ❌ PROBLEM: Creates infinite loop
if (currentToasts.length >= config.maxToasts) {
  // This dispatch is tracked and creates a new toast!
  toastActionRegister.dispatch('removeToast', { toastId: oldestToast.id });
}
```

**Symptoms**:
- Browser DevTools shows continuous HMR updates
- Application becomes unresponsive after 4-5 consecutive actions
- Console logs show: `Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14}`

**Solution**: Use direct store updates instead of dispatching actions:

```tsx
// ✅ SOLUTION: Direct store update prevents loop
if (currentToasts.length >= config.maxToasts) {
  clearToastTimers(oldestToast.id);
  const filteredToasts = currentToasts.filter(toast => toast.id !== oldestToast.id);
  toastsStore.setValue(filteredToasts); // Direct update - no action dispatch
}
```

#### Action Handler Re-registration Loops
**Issue**: Handlers constantly re-registering causing performance degradation.

**Root Cause**: `useCallback` dependencies changing on every render:

```tsx
// ❌ PROBLEM: Dependencies cause re-registration
useEffect(() => {
  const unsubscribe = register('action', handler);
  return unsubscribe;
}, [handler, store]); // These change every render!
```

**Solution**: Use stable references with refs:

```tsx
// ✅ SOLUTION: Stable handler registration
const handlersRef = useRef({ /* handlers */ });

useEffect(() => {
  handlersRef.current = { /* updated handlers */ };
}, [store]);

const stableHandler = useCallback((payload) => 
  handlersRef.current.handler(payload), []);

useEffect(() => {
  return register('action', stableHandler);
}, []); // Empty deps - register only once
```

#### Timer Cascade Problems
**Issue**: Multiple timers creating cascading effects in rapid succession.

**Root Cause**: Each action creates multiple timers without cleanup:

```tsx
// ❌ PROBLEM: Timer accumulation
function sendMessage() {
  setTimeout(() => simulateTyping(), 100);    // Timer 1
  setTimeout(() => autoScroll(), 150);        // Timer 2
  if (shouldAutoRespond) {
    setTimeout(() => respond(), 1500);        // Timer 3
  }
} // No cleanup mechanism!
```

**Solution**: Centralized timer management:

```tsx
// ✅ SOLUTION: Managed timers
const timersRef = useRef<NodeJS.Timeout[]>([]);

const addTimer = (timer: NodeJS.Timeout) => {
  timersRef.current.push(timer);
};

const clearAllTimers = () => {
  timersRef.current.forEach(clearTimeout);
  timersRef.current = [];
};

useEffect(() => () => clearAllTimers(), []); // Cleanup on unmount
```

### Rate Limiting and Toast Management

#### Toast Spam Prevention
**Issue**: Rapid consecutive actions creating too many toasts.

**Configuration**: Rate limiting is disabled by default to avoid blocking legitimate user interactions:

```tsx
// Default: No rate limiting - all toasts shown
setupSelectiveActionToast(actionRegister, trackedActions);

// Optional: Enable rate limiting for high-traffic scenarios
setupSelectiveActionToast(actionRegister, trackedActions, {
  enableRateLimit: true,
  maxToasts: 5,        // Max 5 toasts per second
  resetInterval: 1000  // Reset counter every 1 second
});
```

**Prevention Strategy**: Instead of aggressive rate limiting, use action filtering:

```tsx
// ✅ SOLUTION: Exclude problematic action types
const trackedActions = [
  'sendMessage',    // Track important actions
  'addToCart',
  // Exclude removal actions that can cause loops:
  // 'deleteMessage', 'removeFromCart', 'clearChat'
];
```

#### Memory Leak Prevention
**Best Practices**:

1. **Timer Cleanup**: Always clean up timers
2. **Action Filtering**: Exclude removal actions from toast tracking  
3. **Direct Store Updates**: Use store operations instead of action dispatches for internal operations
4. **Duplicate Prevention**: Prevent identical toasts within short timeframes

## 🚨 Common Runtime Issues

### Handler State Access Problems

#### Stale State in Handlers
**Issue**: Using component scope values in action handlers leads to stale state.

```tsx
// ❌ PROBLEM: Stale closure value
function MyComponent() {
  const user = useStoreValue(userStore); // Trapped in closure!
  
  useActionHandler('updateUser', async () => {
    if (user.isActive) { // This could be stale!
      // Update logic
    }
  });
}
```

**Solution**: Always get fresh state from stores:

```tsx
// ✅ SOLUTION: Fresh state access
function MyComponent() {
  useActionHandler('updateUser', useCallback(async () => {
    const currentUser = userStore.getValue(); // Always fresh!
    if (currentUser.isActive) {
      // Update logic
    }
  }, [userStore]));
}
```

### Performance Issues

#### Excessive Re-renders
**Issue**: Components re-rendering too frequently.

**Diagnostics**:
```tsx
// Add logging to track re-renders
function MyComponent() {
  console.log('Component rendered:', Date.now());
  const value = useStoreValue(myStore);
  return <div>{value}</div>;
}
```

**Solutions**:
1. Check store comparison strategy:
```tsx
// Use appropriate comparison for your data
store.setComparisonOptions({ strategy: 'shallow' }); // For objects
store.setComparisonOptions({ strategy: 'reference' }); // For primitives
```

2. Optimize selectors:
```tsx
// ❌ Creates new object each time
const data = useStoreValue(store, (value) => ({ computed: value * 2 }));

// ✅ Stable reference with proper comparison
const data = useStoreValue(store, useCallback(
  (value) => ({ computed: value * 2 }), 
  []
));
```

### Memory Issues

#### Unresolved Refs
**Issue**: RefContext promises never resolving.

**Diagnostics**:
```tsx
const { waitForMount } = useRefHandler('myRef');

// Add timeout for debugging
Promise.race([
  waitForMount(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Ref mount timeout')), 5000)
  )
]).catch(console.error);
```

**Solutions**:
1. Ensure ref is properly set:
```tsx
const { setRef } = useRefHandler('myRef');

// Make sure this is called
<div ref={setRef}>Content</div>
```

2. Check component mounting order:
```tsx
// Ref handlers should be registered before components mount
function RefLogicComponent({ children }) {
  // Register handlers here
  useRefHandler('myRef', ...);
  return children;
}
```

## 🔍 Debugging Tools

### Error Statistics
Access error statistics for debugging:

```tsx
import { getErrorStatistics } from '@context-action/react';

// Get comprehensive error information
const stats = getErrorStatistics();
console.log('Total errors:', stats.totalErrors);
console.log('Error types:', stats.errorsByType);
console.log('Recent errors:', stats.recentErrors);
```

### Store Debugging
Monitor store changes:

```tsx
// Enable debug mode
store.setNotificationMode('immediate'); // For real-time updates

// Monitor listener count
console.log('Active listeners:', store.getListenerCount());

// Check comparison settings
console.log('Comparison options:', store.getComparisonOptions());
```

### EventBus Debugging
Monitor event flow:

```tsx
// Check active events
console.log('Event names:', eventBus.getEventNames());
console.log('Handler counts:', eventBus.getTotalHandlerCount());

// View event history
console.log('Recent events:', eventBus.getHistory());
```

## 🛡️ Prevention Strategies

### Development Guidelines
1. **Always use `useCallback`** for action handlers
2. **Never store event objects** in stores
3. **Access fresh state** with `store.getValue()` in handlers
4. **Handle async errors** with try-catch blocks
5. **Clean up resources** in useEffect cleanup functions
6. **Avoid circular logging dependencies** - Don't use `actionLogger` in data change handlers that could trigger more actions
7. **Use direct LogMonitor integration** instead of generic `onDataChanged` patterns

### Testing Recommendations
1. **Test unmounted scenarios** to catch memory leaks
2. **Verify handler cleanup** when components unmount
3. **Mock timers** for consistent testing
4. **Test error boundaries** for graceful error handling

### Performance Monitoring
1. **Monitor memory usage** in development
2. **Check re-render frequency** with React DevTools
3. **Profile store operations** in performance-critical paths
4. **Test with realistic data sizes** to catch scaling issues

## 📞 Getting Help

If you encounter issues not covered here:

1. **Check the Error System**: Review `getErrorStatistics()` for detailed error information
2. **Enable Debug Mode**: Set stores to `immediate` notification mode for real-time debugging  
3. **Review Recent Changes**: Check if issues started after recent updates
4. **Test in Isolation**: Create minimal reproductions to isolate the problem

For persistent issues, the centralized error handling system provides detailed context and stack traces to help identify the root cause.