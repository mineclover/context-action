# Selective Subscription Examples

Practical examples of selective subscription patterns for performance optimization.

## Overview

This document provides working examples of [Selective Subscription Patterns](../concept/selective-subscription-patterns.md) - a pre-memoization optimization strategy that eliminates unnecessary reactive subscriptions before they occur.

## Example 1: High-Performance Canvas

Real-time mouse tracking with zero React re-renders.

### Problem: Traditional Reactive Approach

```tsx
// ❌ PERFORMANCE PROBLEM: 60 React re-renders per second
function TraditionalCanvas() {
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');
  
  // Reactive subscriptions trigger re-renders
  const position = useStoreValue(positionStore); // 60fps = 60 re-renders
  const movement = useStoreValue(movementStore); // Another 60 re-renders
  
  // Canvas updates via React re-render
  useEffect(() => {
    updateCanvas(position, movement);
  }, [position, movement]); // Triggers on every mouse move
  
  return <canvas ref={canvasRef} />;
}
```

### Solution: Non-Reactive Pattern

```tsx
// ✅ OPTIMIZED: Zero React re-renders
function OptimizedCanvas() {
  const dispatch = useMouseAction();
  const storeData = useStoreDataAccess(); // Non-reactive access
  
  // RefContext for direct DOM manipulation
  const canvasRef = useMouseRef('canvas');
  const pathSvgRef = useMouseRef('pathSvg');
  
  // Direct canvas updates (60fps, no React)
  const updateCanvasDirect = useCallback((x: number, y: number) => {
    const canvas = canvasRef.target;
    const pathSvg = pathSvgRef.target;
    
    if (canvas && pathSvg) {
      // Direct DOM manipulation - no React re-renders
      canvas.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      pathSvg.setAttribute('d', `M ${x} ${y} L ${x+10} ${y+10}`);
    }
  }, [canvasRef, pathSvgRef]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const timestamp = Date.now();
    
    // Immediate visual update (RefContext - 60fps)
    updateCanvasDirect(x, y);
    
    // Store update (throttled to 30fps for data persistence)
    throttledDispatch('updatePosition', { x, y, timestamp });
  }, [updateCanvasDirect]);
  
  return (
    <div onMouseMove={handleMouseMove}>
      <canvas ref={canvasRef.setRef} />
      <svg>
        <path ref={pathSvgRef.setRef} stroke="blue" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

// Supporting hooks
function useStoreDataAccess() {
  const positionStore = useMouseStore('position');
  const movementStore = useMouseStore('movement');
  
  // No useStoreValue() subscriptions - pure data access
  return {
    getCurrentPosition: () => positionStore.getValue(),
    getCurrentMovement: () => movementStore.getValue(),
    dumpAllData: () => ({
      position: positionStore.getValue(),
      movement: movementStore.getValue(),
      timestamp: Date.now()
    })
  };
}
```

## Example 2: Eliminating Periodic Refresh Patterns

Before applying selective subscription patterns, many applications use periodic refresh logic that wastes resources.

### Problem: Unnecessary Periodic Updates

```tsx
// ❌ PERFORMANCE PROBLEM: Constant background processing
function TraditionalMetrics() {
  const [metrics, setMetrics] = useState(null);
  
  // Periodic refresh every 2 seconds - UNNECESSARY!
  useEffect(() => {
    const interval = setInterval(() => {
      updateComputedMetrics(); // Runs even when no user activity
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-refresh function that's never needed
  const startAutoRefresh = useCallback((intervalMs = 1000) => {
    const interval = setInterval(() => {
      refreshEssentials(); // More unnecessary polling
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, []);
  
  return <div>Constantly refreshing metrics...</div>;
}
```

### Solution: Event-Driven Updates Only

```tsx
// ✅ OPTIMIZED: Updates only when needed
function OptimizedMetrics() {
  const storeData = useStoreDataAccess(); // Non-reactive access
  const [displayData, setDisplayData] = useState(null);
  
  // NO periodic updates - eliminated entirely
  // Metrics update only on user actions via handlers:
  
  const refreshMetricsOnDemand = useCallback(() => {
    // Manual refresh only when explicitly requested
    const freshData = storeData.dumpAllStoreData();
    setDisplayData(freshData);
  }, [storeData]);
  
  return (
    <div>
      <button onClick={refreshMetricsOnDemand}>🔄 Refresh Metrics</button>
      <pre>{JSON.stringify(displayData, null, 2)}</pre>
      {/* Metrics update automatically via action handlers, no polling needed */}
    </div>
  );
}

// Action handler updates metrics when actual user events occur
function useOptimizedMouseLogic() {
  const positionStore = useMouseStore('position');
  const computedStore = useMouseStore('computed');
  
  const handleUpdatePosition = useCallback(async (payload) => {
    // Update position
    positionStore.setValue(payload);
    
    // Update computed metrics ONLY when position actually changes
    // No periodic background updates needed
    const movement = calculateMovementMetrics(payload);
    computedStore.setValue(movement);
  }, [positionStore, computedStore]);
  
  useMouseActionHandler('updatePosition', handleUpdatePosition);
}
```

### Performance Impact

**Before (Periodic Pattern):**
```
- Background timer: every 2000ms → updateComputedMetrics()
- Auto-refresh function: every 1000ms → refreshEssentials() 
- CPU usage: Constant background processing
- Memory: Growing timer references
- Battery: Continuous wake-ups on mobile
```

**After (Event-Driven Pattern):**
```
- Background timers: 0 (eliminated)
- Updates: Only on actual user actions
- CPU usage: Idle when no user activity
- Memory: No timer overhead
- Battery: Sleep-friendly, no unnecessary wake-ups
```

## Example 3: Selective Metrics Dashboard

Dashboard that combines reactive and non-reactive patterns strategically.

### Hybrid Architecture

```tsx
function MetricsDashboard() {
  const [refreshMode, setRefreshMode] = useState<'auto' | 'manual'>('auto');
  
  // Reactive for essential UI state
  const alertsStore = useSystemStore('alerts');
  const alerts = useStoreValue(alertsStore); // Low-frequency, UI-critical
  
  // Non-reactive for detailed metrics
  const metricsAccess = useNonReactiveMetrics();
  
  return (
    <div>
      {/* Reactive section - alerts need immediate UI updates */}
      <AlertsPanel alerts={alerts} />
      
      {/* Non-reactive section - performance data */}
      <MetricsPanel 
        refreshMode={refreshMode}
        metricsAccess={metricsAccess}
      />
    </div>
  );
}

function MetricsPanel({ refreshMode, metricsAccess }) {
  const [displayData, setDisplayData] = useState(null);
  
  // Manual refresh pattern
  const refreshMetrics = useCallback(() => {
    const data = metricsAccess.getAllMetrics();
    setDisplayData(data);
  }, [metricsAccess]);
  
  // Auto-refresh with cleanup
  useEffect(() => {
    if (refreshMode === 'auto') {
      const interval = setInterval(refreshMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [refreshMode, refreshMetrics]);
  
  return (
    <div>
      <button onClick={refreshMetrics}>🔄 Refresh</button>
      <pre>{JSON.stringify(displayData, null, 2)}</pre>
    </div>
  );
}

function useNonReactiveMetrics() {
  const cpuStore = useSystemStore('cpu');
  const memoryStore = useSystemStore('memory');
  const networkStore = useSystemStore('network');
  
  return {
    getAllMetrics: () => ({
      cpu: cpuStore.getValue(),
      memory: memoryStore.getValue(),  
      network: networkStore.getValue(),
      timestamp: Date.now()
    }),
    getCpuOnly: () => cpuStore.getValue(),
    getMemoryOnly: () => memoryStore.getValue()
  };
}
```

## Example 4: Toggle Between Patterns

Comparative implementation showing pattern switching.

```tsx
function PerformanceComparison() {
  const [useNonReactive, setUseNonReactive] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    reactiveRenders: 0,
    nonReactiveUpdates: 0
  });
  
  return (
    <div>
      {/* Pattern selector */}
      <div>
        <button 
          onClick={() => setUseNonReactive(false)}
          className={!useNonReactive ? 'active' : ''}
        >
          🔔 Reactive Pattern
        </button>
        <button 
          onClick={() => setUseNonReactive(true)}
          className={useNonReactive ? 'active' : ''}
        >
          🚀 Non-Reactive Pattern
        </button>
      </div>
      
      {/* Performance stats */}
      <div>
        <p>React Re-renders: {performanceStats.reactiveRenders}</p>
        <p>Non-Reactive Updates: {performanceStats.nonReactiveUpdates}</p>
      </div>
      
      {/* Conditional pattern implementation */}
      <MouseEventsProvider>
        {useNonReactive ? (
          <NonReactiveMouseTracker onUpdate={(stats) => 
            setPerformanceStats(prev => ({ 
              ...prev, 
              nonReactiveUpdates: prev.nonReactiveUpdates + 1 
            }))
          } />
        ) : (
          <ReactiveMouseTracker onRender={() => 
            setPerformanceStats(prev => ({ 
              ...prev, 
              reactiveRenders: prev.reactiveRenders + 1 
            }))
          } />
        )}
      </MouseEventsProvider>
    </div>
  );
}
```

## Example 5: Gaming Performance

High-performance game loop with selective subscriptions. This pattern eliminates all periodic background updates in favor of the requestAnimationFrame game loop.

```tsx
function GameCanvas() {
  const gameState = useGameStoreAccess(); // Non-reactive
  const gameRefs = useGameRefs(); // RefContext
  
  // Game loop with RAF - NO setInterval, NO periodic updates
  useEffect(() => {
    let animationFrame: number;
    
    const gameLoop = () => {
      // Non-reactive state access - no subscriptions
      const state = gameState.getCurrentState();
      
      // Direct canvas manipulation
      if (gameRefs.canvas.isMounted && gameRefs.canvas.target) {
        const ctx = gameRefs.canvas.target.getContext('2d');
        renderFrame(ctx, state);
      }
      
      animationFrame = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    return () => cancelAnimationFrame(animationFrame);
  }, [gameState, gameRefs]);
  
  return <canvas ref={gameRefs.canvas.setRef} />;
}

function useGameStoreAccess() {
  const playerStore = useGameStore('player');
  const enemiesStore = useGameStore('enemies');
  const scoreStore = useGameStore('score');
  
  return {
    getCurrentState: () => ({
      player: playerStore.getValue(),
      enemies: enemiesStore.getValue(),
      score: scoreStore.getValue()
    })
  };
}

function useGameRefs() {
  return createRefContext('Game', {
    canvas: HTMLCanvasElement,
    ui: HTMLDivElement
  });
}
```

## Performance Benchmarks

### Before: Traditional Reactive Pattern
```
Mouse tracking at 60fps:
- React re-renders: 120/sec (position + movement)
- Virtual DOM ops: 240/sec 
- Memory allocations: High
- Frame drops: Frequent
```

### After: Selective Subscription Pattern
```
Mouse tracking at 60fps:
- React re-renders: 0/sec (eliminated)
- Direct DOM ops: 60/sec
- Memory allocations: Minimal
- Frame drops: None
```

## Best Practices from Examples

### 1. Pattern Decision Matrix

```typescript
// High-frequency visual updates → Non-reactive
if (updateFrequency > 30 && isVisualUpdate) {
  useNonReactivePattern();
}

// Business logic updates → Reactive
if (isBusinessLogic || isFormState) {
  useReactivePattern();
}

// Debugging/admin → Manual
if (isDevelopment || isAdminInterface) {
  useManualPattern();
}
```

### 2. Memory Management

```typescript
// ✅ Always cleanup non-reactive patterns
useEffect(() => {
  return () => {
    // Clear timeouts
    clearTimeout(throttleRef.current);
    // Cancel animation frames
    cancelAnimationFrame(animationRef.current);
    // Clear intervals (prefer eliminating them entirely)
    clearInterval(intervalRef.current);
  };
}, []);
```

**Periodic Update Elimination Strategy**:
- Replace `setInterval()` with event-driven updates
- Use `requestAnimationFrame()` for visual updates instead of timers
- Prefer user action triggers over background polling
- Store only data, not update mechanisms

### 3. Debugging Support

```typescript
// Add debug helpers for pattern comparison
const debugPatternPerformance = (patternName: string) => {
  console.log(`${patternName} pattern active:`, {
    subscriptions: getActiveSubscriptions(),
    domUpdates: getDomUpdateCount(),
    memoryUsage: getMemoryUsage()
  });
};
```

## Related Examples

- [Enhanced Context Store Demo](../../example/src/pages/performance/mouse-events/enhanced-context-store/) - Complete implementation
- [Canvas Performance Tests](../../example/src/pages/performance/mouse-events/canvas-demo/) - Benchmarking suite
- [Pattern Composition Examples](./pattern-composition.md) - Combining multiple patterns

## Further Reading

- [Selective Subscription Patterns](../concept/selective-subscription-patterns.md) - Detailed concept guide
- [Performance Issues Troubleshooting](../troubleshooting/performance-issues.md) - Debugging performance problems
- [RefContext Guide](../concept/react-refs-guide.md) - Direct DOM manipulation patterns