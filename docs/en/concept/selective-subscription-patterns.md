# Selective Subscription Patterns

**Pre-memoization optimization: Strategic subscription management that eliminates unnecessary reactive subscriptions before memoization becomes necessary.**

## Overview

Selective Subscription Patterns represent a **pre-memoization optimization strategy** that optimizes performance by eliminating unnecessary reactive subscriptions before they occur. Instead of managing expensive memoization chains, this approach strategically chooses between reactive and non-reactive data access patterns, transforming stores from reactive state managers into pure data repositories when visual updates don't require React re-renders.

### Philosophy: Subscription Optimization First

Rather than optimizing after the fact with memoization techniques, selective subscription patterns prevent performance bottlenecks at their source:

```typescript
// ❌ Traditional approach: Reactive + Memoization
const expensiveValue = useMemo(() => {
  return heavyCalculation(storeValue); // Still subscribes + calculates
}, [storeValue]);

// ✅ Selective approach: Eliminate subscription entirely
const expensiveValue = useMemo(() => {
  return heavyCalculation(store.getValue()); // No subscription, on-demand only
}, []); // Empty deps - calculate once or manually refresh
```

## Core Concepts

### 1. Store as Data Repository Pattern

Transform stores from reactive state managers into pure data storage:

```typescript
// Traditional Reactive Pattern
const position = useStoreValue(positionStore); // Triggers React re-renders

// Non-Reactive Data Repository Pattern
const position = positionStore.getValue(); // On-demand access, no subscriptions
```

### 2. RefContext Direct Manipulation

Use RefContext for visual updates that bypass React entirely:

```typescript
// RefContext-based visual updates (60fps)
const updateCursorDirect = useCallback((x: number, y: number) => {
  const cursor = cursorRef.target;
  if (cursor) {
    cursor.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
  }
}, [cursorRef]);

// Store only for data persistence
dispatch('updatePosition', { x, y, timestamp: Date.now() });
```

### 3. Conditional Subscription Strategy

Apply selective patterns based on use case requirements:

```typescript
// High-frequency visual updates → Non-reactive pattern
const canvasControl = useAdvancedCanvasControl();

// Low-frequency UI updates → Reactive pattern  
const metrics = useStoreValue(metricsStore);

// Manual refresh for debugging/admin → Manual pattern
const debugData = storeManager.dumpAllStoreData();
```

## Implementation Patterns

### Pattern 1: Non-Reactive Canvas Control

For high-performance graphics and animations:

```typescript
export function useAdvancedCanvasControl() {
  const dispatch = useMouseAction();
  const storeData = useStoreDataAccess(); // Non-reactive access
  
  // RefContext references
  const cursorRef = useMouseRef('cursor');
  const pathSvgRef = useMouseRef('pathSvg');
  
  // Direct DOM manipulation (no React re-renders)
  const updatePathDirect = useCallback((newPoint: {x: number, y: number}) => {
    const pathSvg = pathSvgRef.target;
    if (!pathSvg) return;
    
    // Update SVG directly
    const pathData = pathPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    
    pathSvg.setAttribute('d', pathData);
  }, [pathSvgRef]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    
    // Immediate visual update (RefContext)
    updatePathDirect({ x, y });
    
    // Data persistence (Store)
    dispatch('updatePosition', { x, y, timestamp: Date.now() });
  }, [updatePathDirect, dispatch]);
  
  return { handleMouseMove, /* ... */ };
}
```

### Pattern 2: Selective Metrics Subscription

For performance dashboards and debugging:

```typescript
export function useSelectiveMetrics() {
  // Subscribe only to essential metrics
  const computedStore = useMouseStore('computed');
  const computed = useStoreValue(computedStore);
  
  // Non-reactive access for detailed debugging
  const storeAccess = useStoreDataAccess();
  
  const refreshDetailedMetrics = useCallback(() => {
    // Manual refresh without subscription
    return {
      position: storeAccess.getCurrentPosition(),
      movement: storeAccess.getCurrentMovement(),
      clicks: storeAccess.getCurrentClicks(),
      timestamp: Date.now()
    };
  }, [storeAccess]);
  
  return {
    // Reactive for UI display
    computed,
    // Manual for detailed analysis
    refreshDetailedMetrics
  };
}
```

### Pattern 3: Hybrid Architecture Toggle

For comparative performance testing:

```typescript
export function EnhancedContextStorePage() {
  const [isNonReactive, setIsNonReactive] = useState(false);
  
  return (
    <MouseEventsModelProvider>
      {isNonReactive ? (
        <NonReactiveView />  // Pure RefContext + getValue()
      ) : (
        <ReactiveView />     // Traditional useStoreValue()
      )}
    </MouseEventsModelProvider>
  );
}
```

## Store Data Access Patterns

### Non-Reactive Store Access Hook

```typescript
export function useStoreDataAccess() {
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');
  const clicksStore = useMouseStore('clicks');
  
  // No useStoreValue() subscriptions - pure data access
  const getCurrentPosition = useCallback(() => positionStore.getValue(), [positionStore]);
  const getCurrentMovement = useCallback(() => movementStore.getValue(), [movementStore]);
  const getCurrentClicks = useCallback(() => clicksStore.getValue(), [clicksStore]);
  
  const dumpAllStoreData = useCallback(() => ({
    position: getCurrentPosition(),
    movement: getCurrentMovement(),
    clicks: getCurrentClicks(),
    timestamp: Date.now()
  }), [getCurrentPosition, getCurrentMovement, getCurrentClicks]);
  
  return {
    // Individual store access
    getCurrentPosition,
    getCurrentMovement, 
    getCurrentClicks,
    // Bulk access
    dumpAllStoreData,
    // Store references for advanced usage
    stores: { positionStore, movementStore, clicksStore }
  };
}
```

## Performance Comparison

### Traditional Reactive Pattern

```typescript
// ❌ Every position change triggers React re-render
const position = useStoreValue(positionStore);
const movement = useStoreValue(movementStore);

useEffect(() => {
  // Canvas update via React re-render
  updateCanvas(position, movement);
}, [position, movement]);
```

**Impact**: ~60 React re-renders per second for mouse tracking

### Non-Reactive Selective Pattern

```typescript
// ✅ Zero React re-renders for visual updates
const handleMouseMove = useCallback((e) => {
  // Direct DOM update (60fps)
  updateCanvasDirect(e.clientX, e.clientY);
  
  // Store update (throttled to 30fps)
  throttledDispatch('updatePosition', { x: e.clientX, y: e.clientY });
}, []);
```

**Impact**: 0 React re-renders + 60fps GPU-accelerated visuals

## Architecture Guidelines

### When to Use Non-Reactive Patterns

1. **High-frequency visual updates** (animations, real-time graphics)
2. **Performance-critical interactions** (games, drawing apps)
3. **Large-scale data visualization** (charts, dashboards)
4. **Memory-constrained environments** (mobile, embedded)

### When to Use Reactive Patterns

1. **Form state management** (user inputs, validation)
2. **UI component state** (modals, dropdowns, toggles)
3. **Business logic state** (user profiles, settings)
4. **Low-frequency updates** (notifications, status messages)

### When to Use Manual Patterns

1. **Debugging and development** (store inspection, logging)
2. **Admin interfaces** (system monitoring, analytics)
3. **Batch operations** (data export, bulk updates)
4. **Performance profiling** (metrics collection, benchmarking)

## Best Practices

### 1. Clear Pattern Separation

```typescript
// ✅ Clear pattern indication
function useReactiveUserProfile() { /* reactive pattern */ }
function useNonReactiveCanvas() { /* non-reactive pattern */ }
function useManualMetrics() { /* manual pattern */ }

// ❌ Mixed patterns in same hook
function useConfusingPattern() { /* unclear intent */ }
```

### 2. Performance Monitoring

```typescript
const performanceMetrics = {
  reactiveSubscriptions: 0,
  nonReactiveAccesses: 0,
  manualRefreshes: 0,
  renderCount: 0
};
```

### 3. Documentation of Pattern Choice

```typescript
/**
 * Canvas Control Hook - Non-Reactive Pattern
 * 
 * Uses RefContext for direct DOM manipulation to achieve 60fps performance.
 * Store subscriptions eliminated to prevent React re-renders.
 * 
 * Performance: 0 React re-renders, GPU-accelerated animations
 */
export function useAdvancedCanvasControl() { /* ... */ }
```

## Troubleshooting

### Common Issues and Solutions

See [Performance Issues Troubleshooting](../troubleshooting/performance-issues.md#selective-subscription-patterns) for detailed debugging guidance.

### Memory Management

```typescript
// ✅ Proper cleanup in non-reactive patterns
useEffect(() => {
  return () => {
    // Clear RAF callbacks
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Clear throttled functions
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
  };
}, []);
```

## Related Patterns

- [RefContext Guide](./react-refs-guide.md) - Direct DOM manipulation patterns
- [Store Patterns](./pattern-guide.md#store-patterns) - Traditional reactive patterns
- [Performance Optimization](../guide/best-practices.md#performance-optimization) - General performance guidelines
- [MVVM Architecture](./mvvm-core-architecture.md) - Architectural context

## Examples

For complete implementation examples, see:

- [Enhanced Context Store Demo](../../example/src/pages/performance/mouse-events/enhanced-context-store/) - Production example
- [Canvas Performance Comparison](../examples/selective-subscription.md) - Benchmarking examples
- [Architecture Toggle Implementation](../examples/pattern-comparison.md) - Hybrid patterns

---

**Note**: Selective Subscription Patterns represent advanced optimization techniques. Start with traditional reactive patterns and migrate to selective patterns only when performance profiling indicates clear benefits.