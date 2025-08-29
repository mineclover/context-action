# RefContext Mount State Subscription

RefContext now provides reactive subscription capabilities for mount state changes, allowing components to respond to mounting/unmounting events with React re-renders.

## Overview

While RefContext's traditional `isMounted` property uses lazy evaluation to provide the latest state without causing re-renders, the new subscription hooks enable reactive patterns when you need components to respond to mount state changes.

## Available Subscription Hooks

### 1. `useRefMountState(refName)`

Subscribes to mount state changes and triggers re-renders when the state changes.

```typescript
const { isMounted, isWaitingForMount, mountedTarget } = MyRefContext.useRefMountState('myElement');

// These values will trigger re-renders when they change
useEffect(() => {
  if (isMounted) {
    console.log('Element is now mounted!');
  }
}, [isMounted]); // ✅ Now reacts to mount state changes!
```

**Returns:**
- `isMounted`: boolean - Whether the element is currently mounted
- `isWaitingForMount`: boolean - Whether waiting for mount
- `mountedTarget`: T | null - The actual mounted element (or null)

### 2. `useOnMountStateChange(refName, callback)`

Executes a callback whenever mount state changes.

```typescript
MyRefContext.useOnMountStateChange('myElement', (mounted, target) => {
  console.log('Mount state changed:', { mounted, target });
  
  if (mounted && target) {
    // Element just mounted
    target.style.backgroundColor = 'green';
  } else {
    // Element unmounted
    console.log('Element unmounted');
  }
});
```

### 3. `useRefMountChecker(refName)`

Returns a stable function to check current mount state (useful in event handlers).

```typescript
const checkMountState = MyRefContext.useRefMountChecker('myElement');

const handleClick = useCallback(() => {
  const { isMounted, target } = checkMountState();
  
  if (isMounted && target) {
    // Safe to manipulate DOM
    target.style.transform = 'scale(0.95)';
  }
}, [checkMountState]);
```

## Usage Patterns

### Pattern 1: Reactive Mount Status Display

```typescript
function MountStatusDisplay() {
  // Subscribe to mount state changes
  const containerState = MyRefContext.useRefMountState('container');
  const buttonState = MyRefContext.useRefMountState('button');
  
  return (
    <div>
      <p>Container: {containerState.isMounted ? '✅ Mounted' : '❌ Not Mounted'}</p>
      <p>Button: {buttonState.isMounted ? '✅ Mounted' : '❌ Not Mounted'}</p>
      
      {containerState.isWaitingForMount && <p>⏳ Waiting for container...</p>}
      
      <button disabled={!containerState.isMounted || !buttonState.isMounted}>
        {containerState.isMounted && buttonState.isMounted ? 'Ready!' : 'Waiting...'}
      </button>
    </div>
  );
}
```

### Pattern 2: Mount-Based Effect Execution

```typescript
function MountAwareComponent() {
  const canvasState = MyRefContext.useRefMountState('canvas');
  
  // Execute effects when mount state changes
  useEffect(() => {
    if (canvasState.isMounted && canvasState.mountedTarget) {
      // Initialize canvas when it mounts
      const ctx = canvasState.mountedTarget.getContext('2d');
      initializeCanvas(ctx);
      
      return () => {
        // Cleanup when unmounts
        cleanupCanvas();
      };
    }
  }, [canvasState.isMounted, canvasState.mountedTarget]);
}
```

### Pattern 3: Event Handler Safety Checks

```typescript
function SafeEventHandlers() {
  const elementChecker = MyRefContext.useRefMountChecker('element');
  
  const handleInteraction = useCallback(() => {
    const { isMounted, target } = elementChecker();
    
    // Always get current state at interaction time
    if (isMounted && target) {
      target.style.transform = 'translateY(-2px)';
      
      // Check again after async operation
      setTimeout(() => {
        const currentState = elementChecker();
        if (currentState.isMounted && currentState.target) {
          currentState.target.style.transform = '';
        }
      }, 200);
    }
  }, [elementChecker]);
  
  return <button onClick={handleInteraction}>Animate</button>;
}
```

## Comparison: Lazy Evaluation vs Reactive Subscription

### Traditional (Lazy Evaluation) - Zero Re-renders

```typescript
function NonReactivePattern() {
  const element = MyRefContext.useRefHandler('element');
  
  // ❌ This useEffect will NOT run when mount state changes
  useEffect(() => {
    console.log('Mount state:', element.isMounted); // Always latest, but no re-render
  }, [element.isMounted]); // Doesn't trigger re-renders
  
  // ✅ Use in event handlers for current state
  const handleClick = () => {
    if (element.isMounted && element.target) {
      element.target.style.color = 'blue'; // Always works correctly
    }
  };
}
```

### New (Reactive Subscription) - Triggers Re-renders

```typescript
function ReactivePattern() {
  // ✅ This WILL trigger re-renders when mount state changes
  const elementState = MyRefContext.useRefMountState('element');
  
  useEffect(() => {
    console.log('Mount state changed:', elementState.isMounted);
    // This runs whenever mount state changes!
  }, [elementState.isMounted]);
  
  return (
    <div>
      Status: {elementState.isMounted ? 'Mounted' : 'Not Mounted'}
      {elementState.isWaitingForMount && <span> (Waiting...)</span>}
    </div>
  );
}
```

## When to Use Each Pattern

### Use Lazy Evaluation (Traditional) When:
- ✅ Building selective subscription patterns (zero re-renders)
- ✅ High-performance direct DOM manipulation
- ✅ Event handlers that check current state
- ✅ Non-reactive patterns for maximum performance

### Use Reactive Subscription (New) When:
- ✅ UI needs to reflect mount state changes
- ✅ Components need to react to mounting/unmounting
- ✅ Conditional rendering based on mount status
- ✅ Triggering effects when elements become available

## Integration with Selective Subscription Patterns

The new subscription hooks work seamlessly with selective subscription patterns:

```typescript
function HybridPattern() {
  // Reactive for UI state
  const containerState = MyRefContext.useRefMountState('container');
  
  // Non-reactive for direct DOM manipulation
  const container = MyRefContext.useRefHandler('container');
  
  // UI reacts to mount state
  const statusMessage = containerState.isMounted ? 'Ready' : 'Loading...';
  
  // Direct DOM manipulation (zero re-renders)
  const updateVisuals = useCallback((x: number, y: number) => {
    if (container.isMounted && container.target) {
      container.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [container]);
  
  return (
    <div>
      <p>{statusMessage}</p>
      <button disabled={!containerState.isMounted} onClick={() => updateVisuals(10, 10)}>
        Update Position
      </button>
    </div>
  );
}
```

## Performance Considerations

- **Reactive Subscription**: Triggers React re-renders when mount state changes
- **Lazy Evaluation**: Zero re-renders, always current state
- **Mount Checker**: Stable function, zero re-renders, current state on demand

Choose the appropriate pattern based on whether you need reactive UI updates or maximum performance with direct DOM manipulation.

## TypeScript Support

All subscription hooks are fully type-safe:

```typescript
interface MyRefs {
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
  container: HTMLDivElement;
}

const MyRefContext = createRefContext<MyRefs>('MyRefs');

// Type-safe mount state subscription
const canvasState = MyRefContext.useRefMountState('canvas');
// canvasState.mountedTarget is HTMLCanvasElement | null

const buttonChecker = MyRefContext.useRefMountChecker('button');
// buttonChecker() returns { isMounted: boolean, target: HTMLButtonElement | null, ... }
```

## Migration Guide

### From Manual State Tracking

```typescript
// ❌ Before: Manual mount state tracking
function OldPattern() {
  const [isMounted, setIsMounted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (elementRef.current) {
      setIsMounted(true);
      return () => setIsMounted(false);
    }
  }, []);
}

// ✅ After: Use RefContext mount subscription
function NewPattern() {
  const elementState = MyRefContext.useRefMountState('element');
  // Automatically tracks mount state with proper cleanup
}
```

### From useEffect + ref checks

```typescript
// ❌ Before: Manual ref checking
function OldPattern() {
  const element = MyRefContext.useRefHandler('element');
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (element.target) {
        // Do something
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
}

// ✅ After: React to actual mount state changes
function NewPattern() {
  const elementState = MyRefContext.useRefMountState('element');
  
  useEffect(() => {
    if (elementState.isMounted && elementState.mountedTarget) {
      // Runs exactly when element becomes available
    }
  }, [elementState.isMounted, elementState.mountedTarget]);
}
```