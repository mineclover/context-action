# Performance & Infinite Loop Issues

Critical performance problems and their solutions in the Context-Action framework.

## 🚨 Infinite Loop Prevention

### Toast System Infinite Loops

#### The Problem
**Symptoms:**
- Application freezes when toast limit is reached
- Continuous HMR updates in development  
- Browser becomes unresponsive after 4-5 consecutive actions
- Console shows: `Current toast state: {currentToastsCount: 4, maxToasts: 4, stackIndex: 14}`

#### Root Cause Analysis
When `maxToasts` limit is reached, the system tries to remove old toasts by dispatching a `removeToast` action. However, if removal actions are tracked by the toast system, this creates an infinite loop:

```tsx
// ❌ INFINITE LOOP CHAIN
1. New toast added → currentToasts.length >= maxToasts
2. Dispatch removeToast action → setupSelectiveActionToast detects it
3. Creates "removeToast started" toast → exceeds maxToasts again  
4. Another removeToast dispatched → Back to step 2...
```

#### The Fix
Use **direct store updates** instead of action dispatches for internal toast management:

```tsx
// ❌ PROBLEM: Creates infinite loop
if (currentToasts.length >= config.maxToasts) {
  toastActionRegister.dispatch('removeToast', { toastId: oldestToast.id });
}

// ✅ SOLUTION: Direct store update prevents loop
if (currentToasts.length >= config.maxToasts) {
  clearToastTimers(oldestToast.id);
  const filteredToasts = currentToasts.filter(toast => toast.id !== oldestToast.id);
  toastsStore.setValue(filteredToasts); // Direct update - no action tracking
}
```

### Action Handler Re-registration Loops

#### The Problem
Handlers constantly re-registering causing performance degradation and potential state inconsistencies.

#### Root Cause
`useCallback` dependencies changing on every render:

```tsx
// ❌ PROBLEM: Dependencies cause re-registration  
const handler = useCallback(async (payload) => {
  const currentState = store.getValue();
  // Handler logic
}, [store]); // Store reference changes!

useEffect(() => {
  const unsubscribe = register('action', handler);
  return unsubscribe;
}, [handler]); // Re-registers every time handler changes
```

#### The Fix
Use **stable references** with refs pattern:

```tsx
// ✅ SOLUTION: Stable handler registration
const handlersRef = useRef({
  action: (payload) => {
    // Handler implementation
  }
});

// Update handlers without changing reference
useEffect(() => {
  handlersRef.current.action = (payload) => {
    const currentState = store.getValue(); // Always fresh
    // Updated handler logic
  };
}, [store]);

// Stable wrapper
const stableHandler = useCallback(
  (payload) => handlersRef.current.action(payload), 
  []
);

// Register only once
useEffect(() => {
  return register('action', stableHandler);
}, []); // Empty dependencies - register only once
```

### Timer Cascade Problems

#### The Problem
Multiple timers creating cascading effects causing memory leaks and performance issues.

#### Root Cause
Each user action creates multiple unmanaged timers:

```tsx
// ❌ PROBLEM: Timer accumulation without cleanup
function sendMessage() {
  setTimeout(() => simulateTyping(), 100);     // Timer 1
  setTimeout(() => autoScroll(), 150);         // Timer 2
  setTimeout(() => autoResponse(), 1500);      // Timer 3
  setTimeout(() => hideTyping(), 2000);        // Timer 4
} 
// 5 rapid messages = 20 unmanaged timers!
```

#### The Fix
**Centralized timer management** with cleanup:

```tsx
// ✅ SOLUTION: Managed timer system
const timersRef = useRef<{
  autoResponse?: NodeJS.Timeout;
  scroll?: NodeJS.Timeout; 
  typing?: NodeJS.Timeout;
}>({});

const clearTimer = (type: string) => {
  if (timersRef.current[type]) {
    clearTimeout(timersRef.current[type]);
    delete timersRef.current[type];
  }
};

const setTimer = (type: string, callback: () => void, delay: number) => {
  clearTimer(type); // Clear existing first
  timersRef.current[type] = setTimeout(callback, delay);
};

function sendMessage() {
  setTimer('typing', () => simulateTyping(), 100);
  setTimer('scroll', () => autoScroll(), 150);
  setTimer('autoResponse', () => autoResponse(), 1500);
}

// Cleanup on unmount
useEffect(() => () => {
  Object.values(timersRef.current).forEach(clearTimeout);
}, []);
```

## 🔍 Diagnostic Tools

### Performance Monitoring
```tsx
// Monitor action frequency
let actionCount = 0;
const startTime = Date.now();

actionRegister.onAction = (actionType) => {
  actionCount++;
  const rate = actionCount / ((Date.now() - startTime) / 1000);
  console.log(`Action rate: ${rate.toFixed(2)} actions/sec`);
};
```

### Toast System Debugging
```tsx
// Monitor toast state
const debugToastState = () => {
  const toasts = toastsStore.getValue();
  const config = toastConfigStore.getValue();
  console.log('Toast State:', {
    current: toasts.length,
    max: config.maxToasts,
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

### Code Review Checklist
- [ ] All `setTimeout` calls have corresponding cleanup
- [ ] Action handlers use fresh state from stores
- [ ] Internal actions excluded from tracking systems
- [ ] Handler registration happens only once
- [ ] Event objects not stored in stores

### Testing Strategies
- **Stress Testing**: Rapid consecutive actions (10+ in 1 second)
- **Memory Monitoring**: Watch for memory growth over time
- **Timer Auditing**: Check for timer accumulation
- **HMR Stability**: Ensure no continuous updates in development