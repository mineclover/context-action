# Memory Optimization with RefContext

Memory-efficient patterns and techniques for optimal RefContext performance.

## Memory Management Fundamentals

RefContext provides automatic cleanup, but understanding memory patterns helps optimize for large-scale applications.

## Efficient Event Handling

### Memory-Efficient Event Delegation

```tsx
// Memory-efficient event delegation
function useOptimizedEventHandler() {
  const container = useContainerRef('container');
  const lastFrameTime = useRef(0);
  const frameId = useRef<number>();
  
  const optimizedHandler = useCallback((e: Event) => {
    // Throttle to 60fps to prevent memory pressure
    const now = performance.now();
    if (now - lastFrameTime.current < 16.67) return; // ~60fps
    
    lastFrameTime.current = now;
    
    // Cancel previous frame if still pending
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
    }
    
    frameId.current = requestAnimationFrame(() => {
      // Perform DOM updates here
      if (container.target) {
        container.target.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    });
  }, [container]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, []);
  
  return { optimizedHandler };
}
```

### Event Listener Cleanup

```tsx
// Automatic event listener cleanup
function useEventListenerCleanup() {
  const elementRef = useElementRef('element');
  const listeners = useRef(new Map<string, EventListener>());
  
  const addEventListener = useCallback((event: string, handler: EventListener) => {
    if (!elementRef.target) return;
    
    // Remove existing listener if present
    const existingHandler = listeners.current.get(event);
    if (existingHandler) {
      elementRef.target.removeEventListener(event, existingHandler);
    }
    
    // Add new listener
    elementRef.target.addEventListener(event, handler);
    listeners.current.set(event, handler);
  }, [elementRef]);
  
  const removeEventListener = useCallback((event: string) => {
    if (!elementRef.target) return;
    
    const handler = listeners.current.get(event);
    if (handler) {
      elementRef.target.removeEventListener(event, handler);
      listeners.current.delete(event);
    }
  }, [elementRef]);
  
  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      if (elementRef.target) {
        listeners.current.forEach((handler, event) => {
          elementRef.target!.removeEventListener(event, handler);
        });
      }
      listeners.current.clear();
    };
  }, [elementRef]);
  
  return { addEventListener, removeEventListener };
}
```

## Object Pooling Patterns

### Ref Pool Pattern

```tsx
// Object pooling for frequent ref operations
function useRefPool<T extends HTMLElement>(size: number = 100) {
  const pool = useRef<T[]>([]);
  const activeRefs = useRef(new Set<T>());
  
  const borrowRef = useCallback((): T | null => {
    // Return ref from pool or create new one
    const ref = pool.current.pop();
    if (ref) {
      activeRefs.current.add(ref);
      return ref;
    }
    return null;
  }, []);
  
  const returnRef = useCallback((ref: T) => {
    // Clean and return to pool
    activeRefs.current.delete(ref);
    
    // Reset styles for reuse
    ref.style.transform = '';
    ref.style.opacity = '';
    ref.style.visibility = 'hidden';
    ref.style.willChange = 'auto';
    
    // Clear any event listeners
    ref.replaceWith(ref.cloneNode(true));
    
    pool.current.push(ref);
  }, []);
  
  // Cleanup pool on unmount
  useEffect(() => {
    return () => {
      pool.current.length = 0;
      activeRefs.current.clear();
    };
  }, []);
  
  return { borrowRef, returnRef };
}
```

### Component Pool for Dynamic Elements

```tsx
// Pool components for dynamic content
function useDynamicElementPool() {
  const elementPool = useRef<HTMLElement[]>([]);
  const activeElements = useRef(new Set<HTMLElement>());
  const container = useContainerRef('container');
  
  const createElement = useCallback((type: string): HTMLElement | null => {
    // Try to reuse from pool first
    const pooled = elementPool.current.find(el => 
      el.tagName.toLowerCase() === type.toLowerCase()
    );
    
    if (pooled) {
      elementPool.current = elementPool.current.filter(el => el !== pooled);
      activeElements.current.add(pooled);
      return pooled;
    }
    
    // Create new element if pool is empty
    if (container.target) {
      const element = document.createElement(type);
      activeElements.current.add(element);
      return element;
    }
    
    return null;
  }, [container]);
  
  const releaseElement = useCallback((element: HTMLElement) => {
    if (!activeElements.current.has(element)) return;
    
    // Remove from DOM
    element.remove();
    
    // Reset for reuse
    element.className = '';
    element.style.cssText = '';
    element.innerHTML = '';
    
    // Return to pool
    activeElements.current.delete(element);
    elementPool.current.push(element);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeElements.current.forEach(el => el.remove());
      elementPool.current.length = 0;
      activeElements.current.clear();
    };
  }, []);
  
  return { createElement, releaseElement };
}
```

## Memory Monitoring

### Memory Usage Tracking

```tsx
// Monitor ref memory usage
function useMemoryMonitor() {
  const metricsPanel = usePerformanceRef('metricsPanel');
  const memoryHistory = useRef<number[]>([]);
  
  const updateMemoryStats = useCallback(() => {
    if (!metricsPanel.target) return;
    
    // Get memory info (if available)
    const memory = (performance as any).memory;
    if (memory) {
      const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
      const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
      
      // Track memory history
      memoryHistory.current.push(used);
      if (memoryHistory.current.length > 100) {
        memoryHistory.current.shift();
      }
      
      // Detect memory leaks
      const trend = calculateMemoryTrend(memoryHistory.current);
      const leakWarning = trend > 0.1 ? ' ⚠️ Possible leak' : '';
      
      metricsPanel.target.innerHTML = `
        <div>Memory: ${used}MB / ${total}MB</div>
        <div>Usage: ${Math.round((used / total) * 100)}%${leakWarning}</div>
        <div>Trend: ${trend > 0 ? '+' : ''}${(trend * 100).toFixed(1)}%</div>
      `;
      
      // Color code based on usage
      const usage = used / total;
      metricsPanel.target.style.color = usage > 0.8 ? 'red' : 
                                       usage > 0.6 ? 'orange' : 'green';
    }
  }, [metricsPanel]);
  
  // Update every 5 seconds
  useEffect(() => {
    const interval = setInterval(updateMemoryStats, 5000);
    return () => clearInterval(interval);
  }, [updateMemoryStats]);
  
  return { updateMemoryStats };
}

function calculateMemoryTrend(history: number[]): number {
  if (history.length < 2) return 0;
  
  const recent = history.slice(-10);
  const older = history.slice(-20, -10);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  return (recentAvg - olderAvg) / olderAvg;
}
```

### Ref Leak Detection

```tsx
// Detect ref memory leaks
function useRefLeakDetection() {
  const refRegistry = useRef(new WeakMap<HTMLElement, RefInfo>());
  const activeRefCount = useRef(0);
  
  const registerRef = useCallback((element: HTMLElement, info: RefInfo) => {
    refRegistry.current.set(element, info);
    activeRefCount.current++;
  }, []);
  
  const unregisterRef = useCallback((element: HTMLElement) => {
    if (refRegistry.current.has(element)) {
      refRegistry.current.delete(element);
      activeRefCount.current--;
    }
  }, []);
  
  const checkForLeaks = useCallback(() => {
    // Count elements still in DOM
    let elementsInDOM = 0;
    document.querySelectorAll('*').forEach(el => {
      if (refRegistry.current.has(el as HTMLElement)) {
        elementsInDOM++;
      }
    });
    
    const leakedRefs = activeRefCount.current - elementsInDOM;
    
    if (leakedRefs > 0) {
      console.warn(`Potential ref leak detected: ${leakedRefs} refs not cleaned up`);
    }
    
    return { activeRefs: activeRefCount.current, elementsInDOM, leakedRefs };
  }, []);
  
  return { registerRef, unregisterRef, checkForLeaks };
}

interface RefInfo {
  name: string;
  createdAt: number;
  component?: string;
}
```

## Garbage Collection Optimization

### Weak References Pattern

```tsx
// Use WeakMap/WeakSet for automatic cleanup
function useWeakReferenceCache() {
  const elementCache = useRef(new WeakMap<HTMLElement, CachedData>());
  const elementSets = useRef(new WeakSet<HTMLElement>());
  
  const cacheData = useCallback((element: HTMLElement, data: CachedData) => {
    elementCache.current.set(element, data);
    elementSets.current.add(element);
  }, []);
  
  const getCachedData = useCallback((element: HTMLElement): CachedData | undefined => {
    return elementCache.current.get(element);
  }, []);
  
  const hasElement = useCallback((element: HTMLElement): boolean => {
    return elementSets.current.has(element);
  }, []);
  
  // No cleanup needed - WeakMap/WeakSet handle GC automatically
  return { cacheData, getCachedData, hasElement };
}

interface CachedData {
  computedStyles?: CSSStyleDeclaration;
  dimensions?: DOMRect;
  lastUpdate?: number;
}
```

### Manual GC Triggers

```tsx
// Force garbage collection in development
function useGarbageCollectionTrigger() {
  const triggerGC = useCallback(() => {
    // Only in development and if available
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      console.log('Triggering manual garbage collection...');
      (window as any).gc();
    }
  }, []);
  
  // Trigger GC after heavy operations
  const performHeavyOperation = useCallback((operation: () => void) => {
    operation();
    
    // Defer GC to avoid blocking
    setTimeout(triggerGC, 1000);
  }, [triggerGC]);
  
  return { triggerGC, performHeavyOperation };
}
```

## Performance-Aware Ref Management

### Lazy Ref Initialization

```tsx
// Lazy initialization for better memory usage
function useLazyRef<T extends HTMLElement>(name: string) {
  const [isInitialized, setIsInitialized] = useState(false);
  const refHandler = useConditionalRef(name, isInitialized);
  
  const initializeRef = useCallback(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  const destroyRef = useCallback(() => {
    if (isInitialized) {
      setIsInitialized(false);
    }
  }, [isInitialized]);
  
  return {
    ...refHandler,
    isInitialized,
    initializeRef,
    destroyRef
  };
}
```

### Conditional Ref Loading

```tsx
// Load refs only when needed
function useConditionalRefLoading() {
  const [loadedRefs, setLoadedRefs] = useState(new Set<string>());
  const refs = useRef(new Map<string, RefHandler<HTMLElement>>());
  
  const loadRef = useCallback((name: string) => {
    if (loadedRefs.has(name)) return refs.current.get(name);
    
    const refHandler = createRefHandler<HTMLElement>(name);
    refs.current.set(name, refHandler);
    setLoadedRefs(prev => new Set([...prev, name]));
    
    return refHandler;
  }, [loadedRefs]);
  
  const unloadRef = useCallback((name: string) => {
    const refHandler = refs.current.get(name);
    if (refHandler) {
      // Cleanup ref
      refHandler.cleanup?.();
      refs.current.delete(name);
      setLoadedRefs(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  }, []);
  
  return { loadRef, unloadRef, loadedRefs };
}
```

## Memory Optimization Best Practices

1. **Use WeakMap/WeakSet**: Automatic cleanup when elements are removed
2. **Throttle High-Frequency Events**: Prevent memory pressure from rapid updates
3. **Pool Frequently Created Objects**: Reuse elements instead of creating new ones
4. **Monitor Memory Usage**: Track trends to detect leaks early
5. **Cleanup Event Listeners**: Always remove listeners on unmount
6. **Avoid Closures with Large Objects**: Prevent accidental retention
7. **Use Lazy Loading**: Only create refs when actually needed

## Memory Performance Patterns

### Efficient Batch Processing

```tsx
// Process large datasets efficiently
function useBatchProcessor<T>(
  items: T[],
  batchSize: number = 100,
  processingDelay: number = 16
) {
  const [processedItems, setProcessedItems] = useState<T[]>([]);
  const processingRef = useRef<number>();
  
  const processBatch = useCallback(() => {
    const startIndex = processedItems.length;
    const endIndex = Math.min(startIndex + batchSize, items.length);
    const batch = items.slice(startIndex, endIndex);
    
    setProcessedItems(prev => [...prev, ...batch]);
    
    // Continue processing if more items remain
    if (endIndex < items.length) {
      processingRef.current = setTimeout(processBatch, processingDelay);
    }
  }, [items, processedItems, batchSize, processingDelay]);
  
  useEffect(() => {
    // Reset and start processing
    setProcessedItems([]);
    processingRef.current = setTimeout(processBatch, processingDelay);
    
    return () => {
      if (processingRef.current) {
        clearTimeout(processingRef.current);
      }
    };
  }, [items, processBatch, processingDelay]);
  
  return processedItems;
}
```

## Related Patterns

- [Hardware Acceleration](./hardware-acceleration.md) - GPU optimization techniques
- [Canvas Optimization](./canvas-optimization.md) - Canvas-specific performance
- [Basic Usage](./basic-usage.md) - RefContext fundamentals