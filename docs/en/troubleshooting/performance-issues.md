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

## ⚡ Selective Subscription Patterns

### High-Frequency Update Performance Issues

#### The Problem
**Symptoms:**
- Laggy animations and visual updates
- High React re-render counts (50+ per second)
- Browser performance warnings
- Memory usage growth during interactions
- Console shows: `useStoreSelector: Value updated` at high frequency

```typescript
// ❌ PROBLEM: Every mouse move triggers React re-render
const position = useStoreValue(positionStore); // 60fps = 60 re-renders/sec
const movement = useStoreValue(movementStore);

useEffect(() => {
  updateCanvas(position, movement);
}, [position, movement]); // Re-renders on every position change
```

#### Root Cause Analysis
Traditional reactive patterns create performance bottlenecks for high-frequency updates:

1. **Store Subscription Overhead**: `useStoreValue()` creates reactive subscriptions
2. **React Re-render Cascade**: Each store update triggers component re-render
3. **Virtual DOM Processing**: Unnecessary diff calculations for visual updates
4. **State Update Batching**: Multiple rapid updates overwhelm React's batching

#### The Solution: Non-Reactive Patterns

Transform stores from reactive state managers into pure data repositories:

```typescript
// ✅ SOLUTION: Non-reactive data access pattern
export function useStoreDataAccess() {
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');
  
  // No useStoreValue() subscriptions - pure data access
  const getCurrentPosition = useCallback(() => 
    positionStore.getValue(), [positionStore]);
  
  const dumpAllStoreData = useCallback(() => ({
    position: getCurrentPosition(),
    movement: movementStore.getValue(),
    timestamp: Date.now()
  }), [getCurrentPosition]);
  
  return { getCurrentPosition, dumpAllStoreData };
}

// ✅ SOLUTION: RefContext for direct DOM manipulation
export function useAdvancedCanvasControl() {
  const storeData = useStoreDataAccess(); // Non-reactive access
  const pathSvgRef = useMouseRef('pathSvg');
  
  // Direct DOM updates (60fps, no React re-renders)
  const updatePathDirect = useCallback((newPoint) => {
    const pathSvg = pathSvgRef.target;
    if (!pathSvg) return;
    
    // Direct SVG manipulation
    const pathData = pathPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    pathSvg.setAttribute('d', pathData);
  }, [pathSvgRef]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Immediate visual update (RefContext - 60fps)
    updatePathDirect({ x: e.clientX, y: e.clientY });
    
    // Store update (throttled to 30fps)
    throttledDispatch('updatePosition', { 
      x: e.clientX, 
      y: e.clientY, 
      timestamp: Date.now() 
    });
  }, [updatePathDirect]);
  
  return { handleMouseMove };
}
```

### React Key Duplication Issues

#### The Problem
**Symptoms:**
- Console warning: `Encountered two children with the same key`
- Duplicated or missing list items
- Inconsistent rendering behavior

```typescript
// ❌ PROBLEM: Non-unique keys based on position
{clicks.recent.map((click, index) => (
  <div key={`${click.x}-${click.y}-${click.timestamp}`}> // Duplicate when same position
    Click at ({click.x}, {click.y})
  </div>
))}
```

#### The Fix
Use timestamp + index for guaranteed uniqueness:

```typescript
// ✅ SOLUTION: Unique key generation
{clicks.recent.map((click, index) => (
  <div key={`click-${click.timestamp}-${index}`}> // Always unique
    Click at ({click.x}, {click.y})
  </div>
))}
```

### Performance Pattern Guidelines

#### When to Use Non-Reactive Patterns
1. **High-frequency visual updates** (>30fps animations)
2. **Real-time graphics** (canvas, drawing, games)  
3. **Performance-critical interactions** (drag & drop, gestures)
4. **Large datasets** (virtualized lists, data visualization)

#### When to Keep Reactive Patterns
1. **Form state management** (inputs, validation)
2. **Business logic state** (user data, settings)
3. **Low-frequency updates** (<10 updates per second)
4. **UI component state** (modals, dropdowns)

#### Hybrid Architecture Implementation

```typescript
// ✅ SOLUTION: Conditional pattern selection
export function PerformancePage() {
  const [useNonReactive, setUseNonReactive] = useState(false);
  
  return (
    <MouseEventsModelProvider>
      {useNonReactive ? (
        <NonReactiveView />    // RefContext + getValue() pattern
      ) : (
        <ReactiveView />       // Traditional useStoreValue() pattern
      )}
    </MouseEventsModelProvider>
  );
}
```

### Memory Management for Non-Reactive Patterns

```typescript
// ✅ Proper cleanup in non-reactive patterns
export function useAdvancedCanvasControl() {
  const throttleTimeoutRef = useRef<number>();
  const animationFrameRef = useRef<number>();
  
  useEffect(() => {
    return () => {
      // Clear all pending timeouts and RAF
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // ... rest of implementation
}
```

### Performance Monitoring

```typescript
// Monitor pattern performance
const performanceTracker = {
  reactiveReRenders: 0,
  nonReactiveUpdates: 0,
  startTime: Date.now()
};

// In reactive components
useEffect(() => {
  performanceTracker.reactiveReRenders++;
}, [storeValue]);

// In non-reactive handlers
const handleUpdate = useCallback(() => {
  performanceTracker.nonReactiveUpdates++;
  // Direct DOM update
}, []);
```

### Debugging Selective Patterns

```typescript
// Debug store access patterns
const debugStoreAccess = () => {
  const stores = storeManager.getAllStores();
  stores.forEach((store, name) => {
    console.log(`Store ${name}:`, {
      subscribers: store.getSubscriberCount?.() || 0,
      lastUpdate: store.getLastUpdateTime?.() || 0,
      currentValue: store.getValue()
    });
  });
};

// Performance comparison helper
const measurePatternPerformance = (patternName: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${patternName} took ${end - start} milliseconds`);
};
```

For detailed implementation guidance, see [Selective Subscription Patterns](../concept/selective-subscription-patterns.md).

### Testing Strategies
- **Stress Testing**: Rapid consecutive actions (10+ in 1 second)
- **Memory Monitoring**: Watch for memory growth over time
- **Timer Auditing**: Check for timer accumulation
- **HMR Stability**: Ensure no continuous updates in development
- **Pattern Performance**: Compare reactive vs non-reactive performance
- **Re-render Tracking**: Monitor React DevTools for excessive re-renders