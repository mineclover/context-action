# Production Debugging Patterns

Advanced debugging techniques and patterns for Context-Action framework applications in production environments.

## 📋 Table of Contents

1. [Critical Issues & Solutions](#critical-issues--solutions)
2. [State Monitoring](#state-monitoring)
3. [Error Recovery](#error-recovery)
4. [Stress Testing](#stress-testing)
5. [Common Debugging Scenarios](#common-debugging-scenarios)

---

## Critical Issues & Solutions

### ⚠️ Duplicate Action Handler Registration

**Problem**: Accidentally registering the same action handler multiple times causes unpredictable behavior.

```tsx
// ❌ WRONG: Duplicate handler registration
useActionHandler('updateResults', async (payload) => {
  store.setValue(payload.data);
});
useActionHandler('updateResults', async (payload) => {  // Duplicate!
  store.setValue(payload.data);  // This overrides the first handler
});

// ✅ CORRECT: Single handler registration
const updateResultsHandler = useCallback(async (payload) => {
  store.setValue(payload.data);
}, [store]);
useActionHandler('updateResults', updateResultsHandler);
```

**Debug tip**: `grep -n "useActionHandler.*'actionName'" src/**/*.tsx`

### 🔄 Race Condition Prevention

**Problem**: Rapid button clicks cause race conditions and state inconsistencies.

```tsx
// ✅ Add processing state to prevent race conditions
const stores = createDeclarativeStorePattern('Demo', {
  data: initialData,
  isProcessing: false  // Add processing state
});

const criticalActionHandler = useCallback(async (payload) => {
  const currentProcessing = isProcessingStore.getValue();
  
  if (currentProcessing) {
    console.warn('Action already in progress, ignoring request');
    return; // Early return prevents race condition
  }
  
  isProcessingStore.setValue(true);
  try {
    await performCriticalOperation(payload);
  } finally {
    isProcessingStore.setValue(false); // Always clear processing state
  }
}, [isProcessingStore]);

useActionHandler('criticalAction', criticalActionHandler);

// ✅ UI reflects processing state
function ActionButton() {
  const isProcessing = useStoreValue(isProcessingStore);
  const dispatch = useActionDispatch();
  
  return (
    <button
      onClick={() => dispatch('criticalAction', payload)}
      disabled={isProcessing}
    >
      {isProcessing ? '⏳ Processing...' : 'Execute Action'}
    </button>
  );
}
```

### 🔧 Component Lifecycle Management

**Problem**: Component unmounting conflicts with manual ref cleanup.

```tsx
// ❌ WRONG: Manual ref cleanup in component useEffect
function Component() {
  const elementRef = useRefHandler('element');
  
  useEffect(() => {
    return () => {
      elementRef.setRef(null); // This conflicts with action handler cleanup
    };
  }, []);
  
  return <div ref={elementRef.setRef} />;
}

// ✅ CORRECT: Separate concerns - React handles DOM, actions handle state
function Component() {
  const elementRef = useRefHandler('element');
  
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounting');
    // Let React handle DOM cleanup automatically
  }, []);
  
  return <div ref={elementRef.setRef} />;
}

// ✅ Action handler manages state and ref coordination
const unmountElementHandler = useCallback(async () => {
  const isCurrentlyMounted = isMountedStore.getValue();
  
  if (isCurrentlyMounted) {
    isMountedStore.setValue(false); // Update state first
    
    // Let React unmount component, then check ref state
    setTimeout(() => {
      const currentRef = elementRef.target;
      if (currentRef) {
        elementRef.setRef(null); // Only manual cleanup if needed
      }
    }, 50);
  }
}, [isMountedStore, elementRef]);

useActionHandler('unmountElement', unmountElementHandler);
```

---

## State Monitoring

### 📊 Multi-dimensional State Monitoring

**Create comprehensive state monitoring for production issues:**

```tsx
// ✅ Multi-dimensional state monitoring
const debugStores = createDeclarativeStorePattern('Debug', {
  actionLog: [] as string[],
  errorCount: 0,
  operationTimes: {} as Record<string, number>
});

const addLogHandler = useCallback(async ({ message }) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  actionLogStore.update(prev => [
    ...prev.slice(-49), // Keep last 50 entries
    logEntry
  ]);
}, [actionLogStore]);

useActionHandler('addLog', addLogHandler);
```

### 🔍 State Debugging Utilities

```tsx
// ✅ Create debug utilities for complex state tracking
const createStateLogger = (storeName: string, store: Store<any>) => ({
  logCurrent: () => console.log(`${storeName}:`, store.getValue()),
  logChange: (action: string) => {
    const before = store.getValue();
    return (after: any) => {
      console.log(`${storeName} ${action}:`, { before, after });
    };
  }
});
```

---

## Error Recovery

### 🔄 Automatic Retry with Exponential Backoff

```tsx
// ✅ Automatic retry with exponential backoff
const reliableActionHandler = useCallback(async (payload) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await performOperation(payload);
      return; // Success
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error; // Final failure
      
      const delay = 100 * Math.pow(2, attempt - 1); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}, []);

useActionHandler('reliableAction', reliableActionHandler);
```

---

## Stress Testing

### 🎯 Simple Stress Testing Helper

```tsx
// ✅ Simple stress testing helper
function StressTester({ children }: { children: ReactNode }) {
  const [isStressTesting, setIsStressTesting] = useState(false);
  
  useEffect(() => {
    if (!isStressTesting) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance per cycle
        // Trigger random actions to simulate rapid user behavior
        const actions = ['mount', 'unmount', 'waitForRef'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        console.log(`🎯 Stress test: ${randomAction}`);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isStressTesting]);
  
  return (
    <div>
      <button onClick={() => setIsStressTesting(!isStressTesting)}>
        {isStressTesting ? '🛑 Stop' : '🎯 Start'} Stress Test
      </button>
      {children}
    </div>
  );
}
```

---

## Common Debugging Scenarios

### 🔍 Component Not Re-rendering on State Change

```tsx
// 🔍 Debug: Component not re-rendering on state change
function DebuggingComponent() {
  const store = useStore('data');
  const value = useStoreValue(store);
  
  // Add logging to verify subscription
  useEffect(() => {
    console.log('Component re-rendered, value:', value);
  });
  
  // Verify store updates are working
  const testUpdate = () => {
    console.log('Before update:', store.getValue());
    store.setValue({ ...store.getValue(), timestamp: Date.now() });
    console.log('After update:', store.getValue());
  };
  
  return (
    <div>
      <div>Current value: {JSON.stringify(value)}</div>
      <button onClick={testUpdate}>Test Update</button>
    </div>
  );
}
```

### 🔍 Action Handler Not Executing

```tsx
// 🔍 Debug: Action handler not executing
function DebuggingActions() {
  useActionHandler('testAction', useCallback(async (payload) => {
    console.log('Handler executed with payload:', payload);
    
    // Add try-catch to catch errors
    try {
      // Your logic here
    } catch (error) {
      console.error('Handler error:', error);
      throw error; // Re-throw to maintain error propagation
    }
  }, []));
  
  const dispatch = useActionDispatch();
  
  const testDispatch = () => {
    console.log('Dispatching testAction...');
    dispatch('testAction', { test: true });
  };
  
  return <button onClick={testDispatch}>Test Action</button>;
}
```

---

## 📚 Related Patterns

- [Real-time State Access](../async/real-time-state-access.md) - Accessing fresh state in handlers
- [Advanced Action Patterns](../action/advanced-patterns.md) - Complex action handler patterns
- [Timeout Protection](../async/timeout-protection.md) - Protecting against timeout issues

---

## 💡 Production Tips

1. **Always use processing state for critical actions**
2. **Implement comprehensive error logging**
3. **Use stress testing to find edge cases**
4. **Monitor state changes with debug utilities**
5. **Set up automatic retry for network operations**
6. **Separate component lifecycle from action lifecycle**