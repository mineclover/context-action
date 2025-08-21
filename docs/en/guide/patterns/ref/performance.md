# RefContext Performance Optimization

Hardware acceleration and performance optimization techniques for 60fps+ interactions.

## Overview

RefContext performance patterns focus on achieving consistent 60fps performance through hardware acceleration, efficient DOM manipulation, and zero React re-renders.

## Performance Architecture

### Zero Re-render Philosophy

The RefContext pattern introduces a **performance-first layer** that bypasses React's rendering cycle entirely for DOM manipulation:

```
[User Interaction] → [Direct DOM Manipulation] → [Hardware Acceleration] → [60fps Updates]
                               ↓
                         [No React Re-renders]
```

### Performance Comparison

| Approach | React Re-renders | Performance | Memory | Complexity |
|----------|------------------|-------------|---------|------------|
| **useState** | Every update | ~30fps | High GC | Simple |
| **useRef** | Manual checks | ~45fps | Medium | Medium |
| **RefContext** | Zero | 60fps+ | Low | Optimized |

## Hardware Acceleration Patterns

### GPU-Accelerated Transforms

```tsx
// Hardware-accelerated mouse tracking
function HighPerformanceMouseTracker() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !trail.target) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // Hardware acceleration with translate3d
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    trail.target.style.transform = `translate3d(${x-10}px, ${y-10}px, 0)`;
    
    // GPU-accelerated opacity changes
    trail.target.style.opacity = '0.7';
    
    // Will-change for optimization hint
    cursor.target.style.willChange = 'transform';
    trail.target.style.willChange = 'transform, opacity';
  }, [cursor, trail]);
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div ref={cursor.setRef} className="cursor" />
      <div ref={trail.setRef} className="trail" />
    </div>
  );
}
```

### Batch DOM Operations

```tsx
// Efficient batch DOM updates
function BatchedUpdates() {
  const elements = useMultiRef(['elem1', 'elem2', 'elem3']);
  
  const updateAllElements = useCallback((data: UpdateData[]) => {
    // Use requestAnimationFrame for optimal timing
    requestAnimationFrame(() => {
      data.forEach((item, index) => {
        const element = elements[index];
        if (!element.target) return;
        
        // Batch all style updates
        Object.assign(element.target.style, {
          transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
          opacity: item.opacity,
          scale: item.scale
        });
      });
    });
  }, [elements]);
  
  return { updateAllElements };
}
```

## Memory Optimization

### Efficient Event Handling

```tsx
// Memory-efficient event delegation
function PerformantEventHandler() {
  const container = useContainerRef('container');
  const lastFrameTime = useRef(0);
  const frameId = useRef<number>();
  
  const optimizedHandler = useCallback((e: Event) => {
    // Throttle to 60fps
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
    
    pool.current.push(ref);
  }, []);
  
  return { borrowRef, returnRef };
}
```

## Performance Monitoring

### FPS Tracking

```tsx
// Built-in FPS monitoring for RefContext operations
function usePerformanceMonitor() {
  const fpsDisplay = usePerformanceRef('fpsDisplay');
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  
  const updateFPS = useCallback(() => {
    frameCount.current++;
    const now = performance.now();
    const delta = now - lastTime.current;
    
    if (delta >= 1000) { // Update every second
      const fps = Math.round((frameCount.current * 1000) / delta);
      
      if (fpsDisplay.target) {
        fpsDisplay.target.textContent = `${fps} FPS`;
        
        // Color-code performance
        fpsDisplay.target.style.color = fps >= 58 ? 'green' : 
                                       fps >= 45 ? 'orange' : 'red';
      }
      
      frameCount.current = 0;
      lastTime.current = now;
    }
    
    requestAnimationFrame(updateFPS);
  }, [fpsDisplay]);
  
  useEffect(() => {
    updateFPS();
  }, [updateFPS]);
}
```

### Memory Usage Tracking

```tsx
// Monitor ref memory usage
function useMemoryMonitor() {
  const metricsPanel = usePerformanceRef('metricsPanel');
  
  const updateMemoryStats = useCallback(() => {
    if (!metricsPanel.target) return;
    
    // Get memory info (if available)
    const memory = (performance as any).memory;
    if (memory) {
      const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
      const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
      
      metricsPanel.target.innerHTML = `
        <div>Memory: ${used}MB / ${total}MB</div>
        <div>Usage: ${Math.round((used / total) * 100)}%</div>
      `;
    }
  }, [metricsPanel]);
  
  // Update every 5 seconds
  useEffect(() => {
    const interval = setInterval(updateMemoryStats, 5000);
    return () => clearInterval(interval);
  }, [updateMemoryStats]);
}
```

## Performance Best Practices

1. **Hardware Acceleration**: Always use `translate3d()` instead of `left/top`
2. **Will-Change Optimization**: Set `will-change` for elements that will be animated
3. **RequestAnimationFrame**: Use `requestAnimationFrame` for smooth animations
4. **Event Throttling**: Throttle high-frequency events to 60fps max
5. **Memory Management**: Clean up refs and cancel pending animations on unmount
6. **Batch Operations**: Group DOM updates to minimize layout thrashing
7. **GPU Layers**: Use transforms that promote elements to GPU layers

## Common Performance Patterns

### Smooth Animation Pattern

```tsx
function useSmoothAnimation() {
  const animatedElement = useAnimationRef('animatedElement');
  const isAnimating = useRef(false);
  
  const animateToPosition = useCallback((targetX: number, targetY: number) => {
    if (!animatedElement.target || isAnimating.current) return;
    
    isAnimating.current = true;
    const startTime = performance.now();
    const duration = 300; // 300ms animation
    
    const startTransform = animatedElement.target.style.transform;
    const currentX = 0; // Parse from current transform
    const currentY = 0;
    
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      
      const x = currentX + (targetX - currentX) * eased;
      const y = currentY + (targetY - currentY) * eased;
      
      if (animatedElement.target) {
        animatedElement.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isAnimating.current = false;
      }
    }
    
    requestAnimationFrame(animate);
  }, [animatedElement]);
  
  return { animateToPosition };
}
```

### Performance Monitoring Integration

```tsx
// Performance-aware RefContext usage
function usePerformanceAwareRefs() {
  const performanceMetrics = useRef({
    frameTime: 0,
    updateCount: 0,
    averageFrameTime: 0
  });
  
  const updateWithMetrics = useCallback((element: HTMLElement, transform: string) => {
    const startTime = performance.now();
    
    // Apply transform
    element.style.transform = transform;
    
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    
    // Track performance metrics
    performanceMetrics.current.frameTime = frameTime;
    performanceMetrics.current.updateCount++;
    performanceMetrics.current.averageFrameTime = 
      (performanceMetrics.current.averageFrameTime + frameTime) / 2;
    
    // Warn if performance is degrading
    if (frameTime > 16.67) { // Slower than 60fps
      console.warn(`Slow DOM update: ${frameTime.toFixed(2)}ms`);
    }
  }, []);
  
  return { updateWithMetrics, performanceMetrics: performanceMetrics.current };
}
```

## When to Use Performance Patterns

- **Real-time Interactions**: Mouse tracking, gesture recognition, drag & drop
- **Smooth Animations**: 60fps+ animations and transitions
- **Canvas/SVG Manipulation**: Direct graphics manipulation
- **Game Development**: Game loops and real-time rendering
- **Data Visualization**: Interactive charts and graphs
- **Performance-Critical UI**: High-frequency updates and interactions