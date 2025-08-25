# Memory Optimization with RefContext

Memory-efficient patterns and techniques for optimal RefContext performance.

## Prerequisites

Before implementing memory optimization patterns, ensure you have proper RefContext setup:

👉 **Setup Guide**: [RefContext Setup](../setup/ref-context-setup.md)

This guide uses the following predefined types from the Setup specification:
- **WorkerRefs**: Web Worker management for background processing
- **ServiceRefs**: External service and library management
- **CanvasRefs**: Canvas element management for graphics
- **MediaRefs**: Media element and stream management

## Memory Management Fundamentals

RefContext provides automatic cleanup, but understanding memory patterns helps optimize for large-scale applications.

## Efficient Event Handling

### Memory-Efficient Event Delegation

```tsx
// Memory-efficient event delegation using Setup CanvasRefs
function useOptimizedEventHandler() {
  const mainCanvas = useCanvasRef('mainCanvas'); // From Setup CanvasRefs
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
      if (mainCanvas.target) {
        const ctx = mainCanvas.target.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, mainCanvas.target.width, mainCanvas.target.height);
          ctx.fillRect(e.clientX, e.clientY, 10, 10);
        }
      }
    });
  }, [mainCanvas]);
  
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
// Automatic event listener cleanup using Setup UIRefs
function useEventListenerCleanup() {
  const modal = useUIRef('modal'); // From Setup UIRefs
  const listeners = useRef(new Map<string, EventListener>());
  
  const addEventListener = useCallback((event: string, handler: EventListener) => {
    if (!modal.target) return;
    
    // Remove existing listener if present
    const existingHandler = listeners.current.get(event);
    if (existingHandler) {
      modal.target.removeEventListener(event, existingHandler);
    }
    
    // Add new listener
    modal.target.addEventListener(event, handler);
    listeners.current.set(event, handler);
  }, [modal]);
  
  const removeEventListener = useCallback((event: string) => {
    if (!modal.target) return;
    
    const handler = listeners.current.get(event);
    if (handler) {
      modal.target.removeEventListener(event, handler);
      listeners.current.delete(event);
    }
  }, [modal]);
  
  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      if (modal.target) {
        listeners.current.forEach((handler, event) => {
          modal.target!.removeEventListener(event, handler);
        });
      }
      listeners.current.clear();
    };
  }, [modal]);
  
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
// Pool components for dynamic content using Setup CanvasRefs
function useDynamicElementPool() {
  const elementPool = useRef<HTMLElement[]>([]);
  const activeElements = useRef(new Set<HTMLElement>());
  const overlayCanvas = useCanvasRef('overlayCanvas'); // From Setup CanvasRefs
  
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
    if (overlayCanvas.target) {
      const element = document.createElement(type);
      activeElements.current.add(element);
      return element;
    }
    
    return null;
  }, [overlayCanvas]);
  
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
// Monitor ref memory usage using Setup ServiceRefs
function useMemoryMonitor() {
  const chartEngine = useServiceRef('chartEngine'); // From Setup ServiceRefs for metrics display
  const memoryHistory = useRef<number[]>([]);
  
  const updateMemoryStats = useCallback(() => {
    if (!chartEngine.target) return;
    
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
      
      // Update chart with memory metrics
      const usage = used / total;
      if (chartEngine.target && chartEngine.target.data) {
        chartEngine.target.data.datasets[0].data.push(used);
        chartEngine.target.update();
      }
      
      // Log memory stats
      console.log(`Memory: ${used}MB / ${total}MB (${Math.round(usage * 100)}%)${leakWarning}`);
    }
  }, [chartEngine]);
  
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

// RefInfo type follows Setup specification patterns
// See: ref-context-setup.md for complete type definitions
```

## Garbage Collection Optimization

### Weak References Pattern

```tsx
// Use WeakMap/WeakSet for automatic cleanup with Setup types
function useWeakReferenceCache() {
  const elementCache = useRef(new WeakMap<HTMLElement, CachedData>());
  const elementSets = useRef(new WeakSet<HTMLElement>());
  const cacheManager = useServiceRef('cacheManager'); // From Setup DatabaseRefs
  
  const cacheData = useCallback((element: HTMLElement, data: CachedData) => {
    elementCache.current.set(element, data);
    elementSets.current.add(element);
    
    // Also store in browser cache if available
    if (cacheManager.target) {
      cacheManager.target.put(`element-${element.id}`, new Response(JSON.stringify(data)));
    }
  }, [cacheManager]);
  
  const getCachedData = useCallback((element: HTMLElement): CachedData | undefined => {
    return elementCache.current.get(element);
  }, []);
  
  const hasElement = useCallback((element: HTMLElement): boolean => {
    return elementSets.current.has(element);
  }, []);
  
  // No cleanup needed - WeakMap/WeakSet handle GC automatically
  // Browser cache cleanup handled by setup patterns
  return { cacheData, getCachedData, hasElement };
}

// CachedData type uses Setup specification patterns
// See: ref-context-setup.md for complete cache type definitions
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
// Lazy initialization for better memory usage using Setup WorkerRefs
function useLazyWorkerRef(workerName: keyof WorkerRefs) {
  const [isInitialized, setIsInitialized] = useState(false);
  const workerRef = useWorkerRef(workerName); // From Setup WorkerRefs
  
  const initializeWorker = useCallback(() => {
    if (!isInitialized && !workerRef.target) {
      const worker = new Worker(`/workers/${workerName}.js`);
      workerRef.setRef(worker);
      setIsInitialized(true);
    }
  }, [isInitialized, workerRef, workerName]);
  
  const destroyWorker = useCallback(() => {
    if (isInitialized && workerRef.target) {
      workerRef.target.terminate();
      setIsInitialized(false);
    }
  }, [isInitialized, workerRef]);
  
  return {
    worker: workerRef.target,
    isInitialized,
    initializeWorker,
    destroyWorker
  };
}
```

### Conditional Ref Loading

```tsx
// Load service refs only when needed using Setup ServiceRefs
function useConditionalServiceLoading() {
  const [loadedServices, setLoadedServices] = useState(new Set<keyof ServiceRefs>());
  const mapService = useServiceRef('mapService');
  const chartEngine = useServiceRef('chartEngine');
  const paymentService = useServiceRef('paymentService');
  
  const loadService = useCallback(async (serviceName: keyof ServiceRefs) => {
    if (loadedServices.has(serviceName)) return;
    
    switch (serviceName) {
      case 'mapService':
        if (!mapService.target) {
          const maps = await import('google-maps');
          mapService.setRef(maps.default);
        }
        break;
      case 'chartEngine':
        if (!chartEngine.target) {
          const Chart = await import('chart.js');
          chartEngine.setRef(Chart.default);
        }
        break;
      case 'paymentService':
        if (!paymentService.target) {
          const { loadStripe } = await import('@stripe/stripe-js');
          const stripe = await loadStripe(process.env.REACT_APP_STRIPE_KEY!);
          paymentService.setRef(stripe);
        }
        break;
    }
    
    setLoadedServices(prev => new Set([...prev, serviceName]));
  }, [loadedServices, mapService, chartEngine, paymentService]);
  
  const unloadService = useCallback((serviceName: keyof ServiceRefs) => {
    switch (serviceName) {
      case 'mapService':
        mapService.setRef(null);
        break;
      case 'chartEngine':
        if (chartEngine.target && chartEngine.target.destroy) {
          chartEngine.target.destroy();
        }
        chartEngine.setRef(null);
        break;
      case 'paymentService':
        paymentService.setRef(null);
        break;
    }
    
    setLoadedServices(prev => {
      const newSet = new Set(prev);
      newSet.delete(serviceName);
      return newSet;
    });
  }, [mapService, chartEngine, paymentService]);
  
  return { loadService, unloadService, loadedServices };
}
```

## Memory Optimization Best Practices

### Setup-Based Optimization
1. **Reuse Setup Types**: Use predefined WorkerRefs, ServiceRefs, CanvasRefs, and MediaRefs
2. **Follow Setup Patterns**: Implement lazy initialization from Setup guide
3. **Use Setup Cleanup**: Follow cleanup patterns defined in Setup specification

### Memory Management
4. **Use WeakMap/WeakSet**: Automatic cleanup when elements are removed
5. **Throttle High-Frequency Events**: Prevent memory pressure from rapid updates
6. **Pool Frequently Created Objects**: Reuse elements instead of creating new ones
7. **Monitor Memory Usage**: Track trends to detect leaks early
8. **Cleanup Event Listeners**: Always remove listeners on unmount
9. **Avoid Closures with Large Objects**: Prevent accidental retention
10. **Use Lazy Loading**: Only create refs when actually needed

## Memory Performance Patterns

### Efficient Batch Processing

```tsx
// Process large datasets efficiently using Setup WorkerRefs
function useBatchProcessor<T>(
  items: T[],
  batchSize: number = 100,
  processingDelay: number = 16
) {
  const [processedItems, setProcessedItems] = useState<T[]>([]);
  const processingRef = useRef<number>();
  const dataWorker = useWorkerRef('dataProcessingWorker'); // From Setup WorkerRefs
  
  const processBatch = useCallback(() => {
    const startIndex = processedItems.length;
    const endIndex = Math.min(startIndex + batchSize, items.length);
    const batch = items.slice(startIndex, endIndex);
    
    // Use worker for heavy processing if available
    if (dataWorker.target) {
      dataWorker.target.postMessage({ type: 'PROCESS_BATCH', batch });
      dataWorker.target.onmessage = (e) => {
        if (e.data.type === 'BATCH_PROCESSED') {
          setProcessedItems(prev => [...prev, ...e.data.result]);
        }
      };
    } else {
      // Fallback to main thread processing
      setProcessedItems(prev => [...prev, ...batch]);
    }
    
    // Continue processing if more items remain
    if (endIndex < items.length) {
      processingRef.current = setTimeout(processBatch, processingDelay);
    }
  }, [items, processedItems, batchSize, processingDelay, dataWorker]);
  
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

### Setup Integration
- **[RefContext Setup](../setup/ref-context-setup.md)** - Complete setup patterns and type definitions
- **[Multi-Context Setup](../setup/multi-context-setup.md)** - Complex architecture integration
- **[Provider Composition Setup](../setup/provider-composition-setup.md)** - Advanced composition

### Performance Optimization
- **[Hardware Acceleration](./hardware-acceleration.md)** - GPU optimization techniques
- **[Canvas Optimization](./canvas-optimization.md)** - Canvas-specific performance
- **[Basic Usage](./basic-usage.md)** - RefContext fundamentals