# Performance Issues

Performance optimization and troubleshooting for the Context-Action framework.

## 🚨 Important Note

For infinite loop issues, see the dedicated guide:
→ [Infinite Loop Issues](./infinite-loop-issues.md) - Comprehensive coverage of all infinite loop patterns and solutions

## ⚡ Performance Optimization

### Memory Management

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

#### EventBus Memory Optimization
**Issue**: Large objects (DOM elements, React components) stored in event history causing memory leaks.

**Solution**: EventBus automatically stores only essential metadata for memory-heavy objects:

```tsx
// EventBus automatically handles this:
eventBus.emit('domUpdate', domElement);
// Stores: { __eventBusDataType: 'DOMElement', tagName: 'DIV', id: 'myId', className: 'container' }
```

### Excessive Re-renders
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

### Selective Subscription Patterns

#### High-Frequency Update Performance Issues

**The Problem**:
- Components subscribing to stores with high-frequency updates
- UI becomes unresponsive during rapid state changes
- Performance degradation with large component trees

**Solution**: Use selective subscription with debouncing:

```tsx
// ✅ SOLUTION: Selective subscription with performance optimization
function PerformantComponent() {
  // Subscribe only to specific slice of data
  const criticalData = useStoreValue(
    highFrequencyStore, 
    useCallback((state) => ({
      essential: state.essential,
      userVisible: state.userVisible
    }), [])
  );
  
  // Use debounced subscription for non-critical updates
  const debouncedData = useStoreValue(
    highFrequencyStore,
    useCallback((state) => state.nonCritical, []),
    { debounce: 100 } // 100ms debounce
  );
  
  return (
    <div>
      <CriticalUI data={criticalData} />
      <NonCriticalUI data={debouncedData} />
    </div>
  );
}
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

## 🔍 Monitoring & Debugging

### Performance Monitoring
Monitor store operations and subscription patterns:

```tsx
// Enable performance monitoring
const performanceMonitor = {
  trackStoreOperations: true,
  trackSubscriptions: true,
  trackActionDispatches: true
};

// Monitor subscription count
console.log('Active subscriptions:', store.getListenerCount());
console.log('Store operations per second:', getStoreOpsPerSecond());
```

### Toast System Debugging
```tsx
// Monitor toast system health
const monitorToastSystem = () => {
  const toasts = toastStore.getValue();
  console.log('Toast system status:', {
    total: toasts.length,
    visible: toasts.filter(t => t.phase === 'visible').length,
    active: toasts.filter(t => t.phase !== 'hidden').length
  });
};
```

### Timer Leak Detection
```tsx
// Track timer creation
const timerTracker = new Set();
const originalSetTimeout = window.setTimeout;
window.setTimeout = (...args) => {
  const id = originalSetTimeout(...args);
  timerTracker.add(id);
  return id;
};

// Check for leaks
setInterval(() => {
  console.log('Active timers:', timerTracker.size);
}, 5000);
```

## 🛡️ Prevention Strategies

### Development Guidelines
1. **Timer Management**: Always pair timer creation with cleanup
2. **Action Filtering**: Exclude internal/removal actions from tracking
3. **Direct Store Access**: Use store operations for internal state management
4. **Rate Limiting**: Enable only when needed, not by default
5. **Handler Stability**: Use ref patterns for stable handler references
6. **Memory Management**: Never store event objects or large DOM elements
7. **Selective Subscriptions**: Subscribe only to data you actually need

### Code Review Checklist
- [ ] All `setTimeout` calls have corresponding cleanup
- [ ] Action handlers use fresh state from stores
- [ ] Internal actions excluded from tracking systems
- [ ] Handler registration happens only once
- [ ] Event objects not stored in stores
- [ ] Store subscriptions use appropriate comparison strategies
- [ ] High-frequency updates use debouncing or selective subscriptions

### Testing Strategies
- **Stress Testing**: Rapid consecutive actions (10+ in 1 second)
- **Memory Monitoring**: Watch for memory growth over time
- **Timer Auditing**: Check for timer accumulation
- **HMR Stability**: Ensure no continuous updates in development
- **Subscription Efficiency**: Monitor component re-render frequency
- **Store Performance**: Test with realistic data sizes

### Memory Leak Prevention
**Best Practices**:

1. **Timer Cleanup**: Always clean up timers
2. **Action Filtering**: Exclude removal actions from toast tracking  
3. **Direct Store Updates**: Use store operations instead of action dispatches for internal operations
4. **Event Object Prevention**: Never store DOM events in stores
5. **Subscription Management**: Unsubscribe when components unmount
6. **Selective Data Access**: Subscribe only to needed data slices

### Bundle Size Optimization

#### Code Splitting Strategies
```tsx
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Split store contexts by feature
const FeatureAProvider = React.lazy(() => import('./contexts/FeatureAContext'));
```

#### Import Optimization
```tsx
// ❌ Imports entire library
import { ActionRegister } from '@context-action/react';

// ✅ Import only what you need (if tree-shaking is available)
import { ActionRegister } from '@context-action/core';
import { useStoreValue } from '@context-action/react/hooks';
```

## 📚 Related Documentation
- [Infinite Loop Issues](./infinite-loop-issues.md) - Dedicated infinite loop troubleshooting
- [Action System Issues](./action-issues.md) - Action handler best practices
- [Store Issues](./store-issues.md) - Store subscription patterns
- [Ref Issues](./ref-issues.md) - Ref system optimization