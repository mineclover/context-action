# Infinite Loop Issues

Critical infinite loop problems and their solutions in the Context-Action framework.

## 🔄 Overview

Infinite loops are one of the most critical issues that can occur in state management systems. They typically arise from circular dependencies between actions, state updates, and side effects. This guide covers all known infinite loop patterns and their solutions.

## 🚨 ActionLogger + onDataChanged Infinite Loops

### The Problem
**Symptoms:**
- Application freezes after multiple rapid actions
- Console shows continuous action dispatches
- Browser becomes unresponsive with stack overflow errors
- Memory usage continuously increases

### Root Cause Analysis
When components dispatch `onDataChanged` actions and the handler uses `actionLogger.logAction()`, this creates a circular dependency:

```tsx
// ❌ INFINITE LOOP CHAIN
1. Child dispatches onDataChanged → Parent handler processes it
2. Parent handler calls actionLogger.logAction() → Internally calls addLog()
3. addLog() triggers LogMonitor state changes → May dispatch more actions
4. More actions create more onDataChanged events → Back to step 1...
```

### Problematic Code Pattern
```tsx
// ❌ PROBLEM: Creates infinite loop
ParentActionContext.useActionHandler('onDataChanged', ({ source, data }) => {
  // Update store (this is fine)
  const currentLog = dataLogStore.getValue();
  const newLog = [...currentLog, { source, data, timestamp: Date.now() }];
  dataLogStore.setValue(newLog);
  
  // This triggers another action dispatch internally!
  actionLogger.logAction(
    'onDataChanged',
    { source, data },
    {
      context: 'Parent Context',
      toast: { type: 'success', message: `${source}에서 데이터 변경됨` },
    }
  );
});

// Child components dispatch this action:
parentDispatch('onDataChanged', {
  source: childId,
  data: { counter: newValue, action: 'increment' }
});
```

### Solution 1: Simple Console Logging
Remove `actionLogger` from `onDataChanged` handlers and use simple console logging:

```tsx
// ✅ SOLUTION: Simple logging without circular dependencies
ParentActionContext.useActionHandler('onDataChanged', ({ source, data }) => {
  const currentLog = dataLogStore.getValue();
  const newLog = [...currentLog, { source, data, timestamp: Date.now() }];
  dataLogStore.setValue(newLog.slice(-10)); // Keep last 10 entries

  // Simple console log - no circular dependencies
  console.log('🔄 데이터 변경됨:', { source, data });
});
```

### Solution 2: Direct LogMonitor Integration (Recommended)
Use LogMonitor's MVVM architecture directly instead of generic `onDataChanged` patterns:

```tsx
// ✅ RECOMMENDED: Direct LogMonitor integration
export function useChildACounterActions() {
  const storeManager = useChildAStoreManager();
  const { addLog } = useLogMonitorActions(); // Direct ViewModel usage
  
  const incrementCounterHandler = useCallback(async (payload: { amount: number }) => {
    // 1. Update business logic
    const counterStore = storeManager.getStore('counter');
    const newValue = counterStore.getValue() + payload.amount;
    counterStore.setValue(newValue);
    
    // 2. Log directly to LogMonitor (no circular dependencies)
    addLog({
      level: LogLevel.INFO,
      type: 'action',
      message: `Child A 카운터 증가: ${newValue}`,
      details: {
        counter: newValue,
        action: 'increment',
        amount: payload.amount,
        context: 'Child A Component'
      }
    });
  }, [storeManager, addLog]);
  
  // Register handler
  useChildAActionHandler('incrementCounter', incrementCounterHandler);
}
```

## 🍞 Toast System Infinite Loops

### The Problem
**Symptoms:**
- Application freezes when toast limit is reached
- Continuous HMR updates in development  
- Browser becomes unresponsive after 4-5 consecutive actions
- Console shows: `Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14}`

### Root Cause Analysis
When `maxToasts` limit is reached, the system tries to remove old toasts by dispatching a `removeToast` action. However, if removal actions are tracked by the toast system, this creates an infinite loop:

```tsx
// ❌ INFINITE LOOP CHAIN
1. New toast added → currentToasts.length >= maxToasts
2. Dispatch removeToast action → setupSelectiveActionToast detects it
3. Creates "removeToast started" toast → exceeds maxToasts again  
4. Another removeToast dispatched → Back to step 2...
```

### Problematic Code Pattern
```tsx
// ❌ PROBLEM: Creates infinite loop
if (currentToasts.length >= config.maxToasts) {
  // This dispatch is tracked and creates a new toast!
  toastActionRegister.dispatch('removeToast', { toastId: oldestToast.id });
}
```

### Solution: Direct Store Updates
Use direct store updates instead of action dispatches for internal toast management:

```tsx
// ✅ SOLUTION: Direct store update prevents loop
if (currentToasts.length >= config.maxToasts) {
  // Clean up timers first
  clearToastTimers(oldestToast.id);
  
  // Direct store update - no action dispatch
  const filteredToasts = currentToasts.filter(toast => toast.id !== oldestToast.id);
  toastsStore.setValue(filteredToasts);
}
```

### Prevention Strategy
Exclude removal actions from toast tracking:

```tsx
// ✅ PREVENTION: Exclude problematic action types
const trackedActions = [
  'sendMessage',    // Track important actions
  'addToCart',
  'updateProfile',
  // Exclude removal actions that can cause loops:
  // 'deleteMessage', 'removeFromCart', 'clearChat', 'removeToast'
];

setupSelectiveActionToast(actionRegister, trackedActions);
```

## ⚙️ Action Handler Re-registration Loops

### The Problem
Handlers constantly re-registering causing performance degradation and potential state inconsistencies.

### Root Cause
`useCallback` dependencies changing on every render:

```tsx
// ❌ PROBLEM: Dependencies cause re-registration
const handler = useCallback((payload) => {
  // Handler logic using store
}, [store, someValue]); // These change every render!

useEffect(() => {
  const unsubscribe = register('action', handler);
  return unsubscribe;
}, [handler]); // Re-registers whenever handler changes
```

### Solution: Stable Handler References
Use ref patterns for stable handler references:

```tsx
// ✅ SOLUTION: Stable handler registration
const handlersRef = useRef({ /* handlers */ });

// Update ref without changing reference
useEffect(() => {
  handlersRef.current = { 
    store,
    someValue 
  };
}, [store, someValue]);

// Stable handler that uses ref
const stableHandler = useCallback((payload) => {
  const { store, someValue } = handlersRef.current;
  // Handler logic
}, []); // Empty deps - stable reference

// Register only once
useEffect(() => {
  const unsubscribe = register('action', stableHandler);
  return unsubscribe;
}, []); // Empty deps - register only once
```

## ⏱️ Timer Cascade Loops

### The Problem
Multiple timers creating cascading effects in rapid succession.

### Root Cause
Each action creates multiple timers without proper cleanup:

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

### Solution: Centralized Timer Management
```tsx
// ✅ SOLUTION: Managed timers
const timersRef = useRef<NodeJS.Timeout[]>([]);

const addTimer = (callback: () => void, delay: number) => {
  const timer = setTimeout(() => {
    callback();
    // Remove from tracking after execution
    timersRef.current = timersRef.current.filter(t => t !== timer);
  }, delay);
  timersRef.current.push(timer);
  return timer;
};

const clearAllTimers = () => {
  timersRef.current.forEach(clearTimeout);
  timersRef.current = [];
};

// Use managed timers
function sendMessage() {
  addTimer(() => simulateTyping(), 100);
  addTimer(() => autoScroll(), 150);
  if (shouldAutoRespond) {
    addTimer(() => respond(), 1500);
  }
}

// Cleanup on unmount
useEffect(() => () => clearAllTimers(), []);
```

## 🔄 Store Update Loops

### The Problem
Store updates triggering actions that update the same store.

### Root Cause
```tsx
// ❌ PROBLEM: Store update triggers action that updates same store
useEffect(() => {
  const unsubscribe = myStore.subscribe((value) => {
    if (value.needsUpdate) {
      dispatch('updateStore', { data: processData(value) });
    }
  });
  return unsubscribe;
}, []);

useActionHandler('updateStore', (payload) => {
  myStore.setValue({ ...payload.data, needsUpdate: true }); // Loop!
});
```

### Solution: Conditional Updates
```tsx
// ✅ SOLUTION: Prevent recursive updates
useEffect(() => {
  const unsubscribe = myStore.subscribe((value, previousValue) => {
    // Check if update is actually needed
    if (value.needsUpdate && !previousValue?.needsUpdate) {
      dispatch('updateStore', { data: processData(value) });
    }
  });
  return unsubscribe;
}, []);

useActionHandler('updateStore', (payload) => {
  // Clear flag to prevent loop
  myStore.setValue({ ...payload.data, needsUpdate: false });
});
```

## 🛡️ Prevention Strategies

### Design Principles
1. **Unidirectional Data Flow**: Actions → Handlers → Store Updates → UI Updates
2. **No Circular Dependencies**: Never have handlers dispatch actions that trigger the same handler
3. **Direct Store Updates**: Use direct store operations for internal state management
4. **Action Filtering**: Exclude internal/removal actions from tracking systems

### Code Review Checklist
- [ ] Check for actions that dispatch other actions in a circular pattern
- [ ] Verify toast/logging systems don't track their own removal actions
- [ ] Ensure store subscriptions don't trigger updates to the same store
- [ ] Confirm timer cleanup is implemented for all setTimeout/setInterval calls
- [ ] Validate that handler registrations use stable references

### Debugging Techniques

#### Detecting Infinite Loops
```tsx
// Add loop detection to action dispatcher
const actionCounter = new Map<string, number>();
const ACTION_LIMIT = 100;
const TIME_WINDOW = 1000; // 1 second

function detectLoop(actionType: string) {
  const count = actionCounter.get(actionType) || 0;
  actionCounter.set(actionType, count + 1);
  
  if (count > ACTION_LIMIT) {
    console.error(`Possible infinite loop detected: ${actionType} dispatched ${count} times`);
    return true;
  }
  
  // Reset counter after time window
  setTimeout(() => {
    actionCounter.set(actionType, 0);
  }, TIME_WINDOW);
  
  return false;
}
```

#### Stack Trace Analysis
```tsx
// Capture stack trace for action dispatches
function debugDispatch(actionType: string, payload: any) {
  console.group(`Action: ${actionType}`);
  console.log('Payload:', payload);
  console.trace('Dispatch origin');
  console.groupEnd();
  
  // Continue with normal dispatch
  dispatch(actionType, payload);
}
```

## 📚 Related Documentation
- [Performance Issues](./performance-issues.md) - General performance optimization
- [Action System Issues](./action-issues.md) - Action handler best practices
- [Store Issues](./store-issues.md) - Store subscription patterns