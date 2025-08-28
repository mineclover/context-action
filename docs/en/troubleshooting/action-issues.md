# Action System Issues

Action-related problems and solutions in the Context-Action framework.

## 🎯 Handler State Access Problems

### Stale State in Handlers

#### The Problem
**Issue**: Action handlers using stale component scope values instead of current state.

**Symptoms**:
- Handlers operating on outdated data
- Inconsistent behavior after state changes
- "Ghost" values from previous renders

#### Root Cause
Handler closures capture component scope values at registration time:

```tsx
// ❌ PROBLEM: Stale closure value
function MyComponent() {
  const user = useStoreValue(userStore); // Trapped in closure!
  
  useActionHandler('updateUser', async () => {
    if (user.isActive) { // This could be stale!
      // Update logic uses old user value
    }
  });
}
```

#### The Fix
Always get fresh state from stores within handlers:

```tsx
// ✅ SOLUTION: Fresh state access
function MyComponent() {
  const userStore = useAppStore('user');
  
  useActionHandler('updateUser', useCallback(async () => {
    const currentUser = userStore.getValue(); // Always fresh!
    if (currentUser.isActive) {
      // Update logic uses current state
    }
  }, [userStore]));
}
```

## 🔄 Action Registration Issues

### Handler Registration Patterns

#### Best Practice: Store Integration Pattern
Follow the 3-step pattern for reliable handler implementation:

```tsx
// ✅ RECOMMENDED: Store Integration Pattern
useActionHandler('updateUser', useCallback(async (payload) => {
  // Step 1: Read current state
  const currentState = userStore.getValue();
  
  // Step 2: Execute business logic
  const updatedUser = {
    ...currentState,
    ...payload,
    lastUpdated: new Date()
  };
  
  // Step 3: Update store
  userStore.setValue(updatedUser);
}, [userStore]));
```

### Handler Lifecycle Management

#### Registration Timing
**Issue**: Handlers registered after components mount can miss early actions.

**Solution**: Register handlers before component content:

```tsx
// ✅ CORRECT: Handler registration component
function UserLogic({ children }) {
  const userStore = useUserStore('profile');
  
  // Register handlers BEFORE returning children
  useUserActionHandler('updateProfile', async (payload) => {
    // Handler logic
  });
  
  return children; // Components can now dispatch actions
}
```

#### Handler Cleanup
**Issue**: Memory leaks from unregistered handlers.

**Solution**: Framework handles cleanup automatically, but ensure proper patterns:

```tsx
// ✅ AUTOMATIC: Framework handles cleanup
useActionHandler('myAction', handler); // Auto-cleanup on unmount

// ❌ MANUAL: Only if you need early cleanup
useEffect(() => {
  const unregister = register('myAction', handler);
  
  if (someCondition) {
    unregister(); // Manual early cleanup
  }
  
  return unregister; // Normal cleanup
}, []);
```

## ⚡ Performance Optimization

### Handler Performance

#### Async Handler Patterns
**Issue**: Blocking handlers affecting UI responsiveness.

**Solution**: Use proper async patterns:

```tsx
// ✅ NON-BLOCKING: Proper async handler
useActionHandler('heavyTask', async (payload) => {
  try {
    // Non-blocking async work
    const result = await processHeavyTask(payload);
    store.setValue(result);
  } catch (error) {
    console.error('Heavy task failed:', error);
  }
});
```

#### Batch Operations
**Issue**: Multiple rapid actions causing performance issues.

**Solution**: Use batching for related operations:

```tsx
// ✅ BATCHED: Multiple store updates in one handler  
useActionHandler('batchUpdate', async (payload) => {
  const updates = payload.items;
  
  // Batch all updates together
  store.update(currentItems => {
    return updates.reduce((acc, update) => {
      return acc.map(item => 
        item.id === update.id ? { ...item, ...update } : item
      );
    }, currentItems);
  });
});
```

## 🚨 Error Handling

### Action Error Patterns

#### Error Recovery
**Issue**: Handlers failing silently or causing app crashes.

**Solution**: Implement comprehensive error handling:

```tsx
// ✅ ROBUST: Complete error handling
useActionHandler('riskyAction', async (payload, controller) => {
  try {
    // Validation
    if (!payload.required) {
      controller.abort('Missing required field', { field: 'required' });
      return;
    }
    
    // Business logic
    const result = await riskyOperation(payload);
    
    // Success handling
    store.setValue(result);
    
  } catch (error) {
    // Error handling
    controller.abort('Operation failed', error);
    
    // Optional: Fallback handling
    store.update(current => ({
      ...current,
      error: error.message,
      lastAttempt: new Date()
    }));
  }
});
```

### Action Debugging Tools

#### Handler Monitoring
```tsx
// Debug action execution
const actionRegister = useFactoryActionRegister();

useEffect(() => {
  const monitor = (actionType: string, payload: any) => {
    console.log(`Action dispatched: ${actionType}`, payload);
  };
  
  // Hook into dispatch (framework-specific debugging)
  const originalDispatch = actionRegister.dispatch;
  actionRegister.dispatch = (action, payload) => {
    monitor(action, payload);
    return originalDispatch(action, payload);
  };
}, [actionRegister]);
```

#### Handler Registry Inspection
```tsx
// Check registered handlers (development only)
console.log('Registered actions:', actionRegister.getRegisteredActions());
console.log('Handler count:', actionRegister.getHandlerCount());
```

## 📊 Performance Metrics

### Benchmarking Action Performance
```tsx
// Measure action execution time
const measureAction = async (actionType: string, payload: any) => {
  const startTime = performance.now();
  
  try {
    await actionRegister.dispatch(actionType, payload);
    const duration = performance.now() - startTime;
    console.log(`${actionType} completed in ${duration.toFixed(2)}ms`);
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`${actionType} failed after ${duration.toFixed(2)}ms:`, error);
  }
};
```

### Memory Usage Monitoring
```tsx
// Track handler memory usage
const monitorHandlerMemory = () => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    });
  }
};
```