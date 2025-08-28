# Store & State Issues

Store management problems and solutions in the Context-Action framework.

## 🧩 Memory Leak Prevention

### Event Object Storage Detection

#### The Problem
**Issue**: DOM event objects being stored in stores causing memory leaks and browser performance degradation.

**Symptoms**:
- Browser memory usage continuously increasing
- Slow store operations over time
- Memory warnings in DevTools
- Application performance degradation

#### Root Cause
DOM event objects contain circular references and large object graphs that prevent garbage collection:

```tsx
// ❌ PROBLEM: Event objects cause memory leaks
function handleClick(event: MouseEvent) {
  userStore.setValue({ 
    lastEvent: event // DOM event has circular refs!
  });
}
```

#### The Fix
The framework automatically detects and prevents event object storage:

```tsx
// ❌ This triggers automatic prevention
store.setValue({ event: domEvent });
// Error: [Context-Action] Event object detected in Store.setValue - this may cause memory leaks

// ✅ SOLUTION: Extract only needed data
store.setValue({ 
  eventData: {
    clientX: domEvent.clientX,
    clientY: domEvent.clientY,
    target: domEvent.target?.id,
    timestamp: Date.now()
  }
});
```

### Store Circular Reference Detection

#### The Problem
**Issue**: Circular reference detection in store comparison causing false positives and performance issues.

**Symptoms**:
- Store updates not triggering re-renders when they should
- Performance degradation during deep object comparison
- False circular reference warnings

#### Root Cause
Previous implementation checked both values together instead of individually:

```tsx
// ❌ PROBLEM: Incorrect circular reference detection
if (visited.has(a) || visited.has(b)) {
  return Object.is(a, b); // Wrong logic!
}
```

#### The Fix
Check each value individually for proper circular reference handling:

```tsx
// ✅ SOLUTION: Correct circular reference detection
if (visited.has(a)) {
  return Object.is(a, b);
}
if (visited.has(b)) {
  return Object.is(a, b);
}
```

## 📊 Store Comparison Strategies

### Optimal Comparison Configuration

#### Reference Comparison
**Use Case**: Primitive values, immutable objects, performance-critical scenarios

```tsx
// ✅ FAST: Reference comparison for primitives
const countStore = createStore({ initialValue: 0 });
countStore.setComparisonOptions({ strategy: 'reference' });
```

#### Shallow Comparison  
**Use Case**: Simple objects, form data, configuration objects

```tsx
// ✅ BALANCED: Shallow comparison for objects
const userStore = createStore({ 
  initialValue: { name: '', email: '', preferences: {} }
});
userStore.setComparisonOptions({ strategy: 'shallow' });
```

#### Deep Comparison
**Use Case**: Complex nested objects, when accuracy is more important than performance

```tsx
// ✅ THOROUGH: Deep comparison for complex objects
const complexStore = createStore({ 
  initialValue: { user: { profile: { settings: {} } } }
});
complexStore.setComparisonOptions({ strategy: 'deep' });
```

### Store Performance Optimization

#### Notification Mode Configuration
**Issue**: Excessive re-renders from immediate notifications.

**Solution**: Choose appropriate notification modes:

```tsx
// ✅ PRODUCTION: Batched notifications for performance
store.setNotificationMode('batched');

// ✅ DEVELOPMENT: Immediate for debugging
store.setNotificationMode('immediate');

// ✅ COMPLEX UI: Custom batching strategy
store.setNotificationMode('custom');
```

#### Selector Optimization
**Issue**: Inefficient selectors causing unnecessary re-renders.

```tsx
// ❌ PROBLEM: Creates new object each time
const data = useStoreValue(store, (value) => ({ computed: value * 2 }));

// ✅ SOLUTION: Stable selector with proper comparison
const data = useStoreValue(store, useCallback(
  (value) => ({ computed: value * 2 }), 
  []
));
```

## 🔍 Store Debugging Tools

### Store State Monitoring
```tsx
// Monitor store changes in development
const store = useAppStore('user');

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Store listeners:', store.getListenerCount());
    console.log('Comparison strategy:', store.getComparisonOptions());
    
    const unsubscribe = store.subscribe((value) => {
      console.log('Store updated:', value);
    });
    
    return unsubscribe;
  }
}, [store]);
```

### Memory Usage Tracking
```tsx
// Track memory usage patterns
const monitorStoreMemory = () => {
  if (performance.memory) {
    const memoryInfo = {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    };
    
    console.log('Memory usage (MB):', memoryInfo);
    return memoryInfo;
  }
};

// Monitor periodically
setInterval(monitorStoreMemory, 10000);
```

## 🛠️ Store Configuration Best Practices

### Store Creation Patterns
```tsx
// ✅ RECOMMENDED: Explicit configuration
const userStore = createStore({
  initialValue: { name: '', email: '', isActive: false },
  comparisonOptions: { strategy: 'shallow' },
  notificationMode: 'batched'
});
```

### Store Integration with Actions
**Follow the 3-step Store Integration Pattern**:

```tsx
// ✅ OPTIMAL: Store Integration Pattern
useActionHandler('updateUser', useCallback(async (payload) => {
  // Step 1: Read current state
  const currentUser = userStore.getValue();
  
  // Step 2: Execute business logic
  const updatedUser = {
    ...currentUser,
    ...payload,
    lastUpdated: new Date()
  };
  
  // Step 3: Update store
  userStore.setValue(updatedUser);
}, [userStore]));
```

## ⚠️ Common Store Antipatterns

### Direct Store Access in Render
```tsx
// ❌ PROBLEM: Direct access not reactive
function UserProfile() {
  const userStore = useAppStore('user');
  const user = userStore.getValue(); // Not reactive!
  
  return <div>{user.name}</div>; // Won't update
}

// ✅ SOLUTION: Use reactive subscription
function UserProfile() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore); // Reactive!
  
  return <div>{user.name}</div>; // Updates properly
}
```

### Storing Functions in Stores
```tsx
// ❌ PROBLEM: Functions prevent proper comparison
store.setValue({
  data: someData,
  callback: () => {} // Functions break comparison!
});

// ✅ SOLUTION: Use action dispatching instead
store.setValue({ data: someData });
dispatch('processData'); // Handle logic in action
```

### Mutating Store Values
```tsx
// ❌ PROBLEM: Direct mutation bypasses change detection
const current = userStore.getValue();
current.name = 'New Name'; // Direct mutation!
userStore.setValue(current); // May not trigger updates

// ✅ SOLUTION: Immutable updates
userStore.update(current => ({
  ...current,
  name: 'New Name'
}));
```

## 🚨 Emergency Protocols

### Store Recovery Strategies
```tsx
// Reset store to initial state
const resetStore = () => {
  const initialValue = store.getInitialValue();
  store.setValue(initialValue);
};

// Clear all listeners (emergency cleanup)
const emergencyCleanup = () => {
  store.clearAllListeners();
  store.setNotificationMode('immediate');
};
```

### Memory Leak Recovery
```tsx
// Force garbage collection in development
if (process.env.NODE_ENV === 'development' && window.gc) {
  window.gc();
  console.log('Manual GC triggered');
}

// Reset stores with clean state
const resetAllStores = () => {
  [userStore, settingsStore, dataStore].forEach(store => {
    store.setValue(store.getInitialValue());
    store.clearHistory();
  });
};
```