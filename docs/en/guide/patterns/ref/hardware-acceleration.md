# Hardware Acceleration with RefContext

GPU-accelerated DOM manipulation patterns for 60fps+ performance.

## Hardware Acceleration Fundamentals

RefContext enables direct DOM manipulation that can leverage GPU acceleration for smooth, high-performance interactions.

### GPU-Accelerated Properties

```tsx
// Properties that trigger GPU acceleration
const gpuAccelerated = {
  transform: 'translate3d(x, y, z)',  // ✅ GPU accelerated
  opacity: '0.5',                     // ✅ GPU accelerated
  filter: 'blur(5px)',               // ✅ GPU accelerated
  willChange: 'transform, opacity'    // ✅ Optimization hint
};

// Properties that trigger CPU rendering
const cpuRendered = {
  left: '100px',      // ❌ Layout thrashing
  top: '100px',       // ❌ Layout thrashing
  width: '200px',     // ❌ Layout thrashing
  height: '200px'     // ❌ Layout thrashing
};
```

## Hardware-Accelerated Mouse Tracking

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
    <div onMouseMove={handleMouseMove} className="w-full h-96 relative">
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)', opacity: 0 }}
      />
    </div>
  );
}
```

## GPU Layer Management

### Creating Composite Layers

```tsx
// Force GPU layer creation for optimal performance
function useGPULayer() {
  const element = useGPURef('element');
  
  useEffect(() => {
    if (!element.target) return;
    
    // Force GPU layer creation
    element.target.style.willChange = 'transform, opacity';
    element.target.style.transform = 'translate3d(0, 0, 0)';
    element.target.style.backfaceVisibility = 'hidden';
    element.target.style.perspective = '1000px';
    
    // Cleanup on unmount
    return () => {
      if (element.target) {
        element.target.style.willChange = 'auto';
      }
    };
  }, [element]);
  
  return element;
}
```

### Layer Optimization

```tsx
// Manage GPU layers efficiently
function useLayerOptimization() {
  const activeElements = useRef(new Set<HTMLElement>());
  
  const promoteToGPU = useCallback((element: HTMLElement) => {
    if (activeElements.current.has(element)) return;
    
    // Promote to GPU layer
    element.style.willChange = 'transform, opacity';
    element.style.transform = element.style.transform || 'translate3d(0, 0, 0)';
    
    activeElements.current.add(element);
  }, []);
  
  const demoteFromGPU = useCallback((element: HTMLElement) => {
    if (!activeElements.current.has(element)) return;
    
    // Remove from GPU layer to save memory
    element.style.willChange = 'auto';
    
    activeElements.current.delete(element);
  }, []);
  
  // Cleanup all layers on unmount
  useEffect(() => {
    return () => {
      activeElements.current.forEach(element => {
        element.style.willChange = 'auto';
      });
      activeElements.current.clear();
    };
  }, []);
  
  return { promoteToGPU, demoteFromGPU };
}
```

## Smooth Animations with GPU

### Hardware-Accelerated Transitions

```tsx
function useSmoothTransition() {
  const animatedElement = useAnimationRef('animatedElement');
  const isAnimating = useRef(false);
  
  const animateToPosition = useCallback((targetX: number, targetY: number) => {
    if (!animatedElement.target || isAnimating.current) return;
    
    isAnimating.current = true;
    const startTime = performance.now();
    const duration = 300; // 300ms animation
    
    // Get current position
    const computedStyle = getComputedStyle(animatedElement.target);
    const matrix = new DOMMatrix(computedStyle.transform);
    const currentX = matrix.m41;
    const currentY = matrix.m42;
    
    // Promote to GPU layer for animation
    animatedElement.target.style.willChange = 'transform';
    
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      
      const x = currentX + (targetX - currentX) * eased;
      const y = currentY + (targetY - currentY) * eased;
      
      if (animatedElement.target) {
        // Hardware-accelerated transform
        animatedElement.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Demote from GPU layer after animation
        if (animatedElement.target) {
          animatedElement.target.style.willChange = 'auto';
        }
        isAnimating.current = false;
      }
    }
    
    requestAnimationFrame(animate);
  }, [animatedElement]);
  
  return { animateToPosition };
}
```

### Batch GPU Operations

```tsx
// Efficient batch GPU updates
function useBatchGPUUpdates() {
  const elements = useMultiRef(['elem1', 'elem2', 'elem3']);
  const pendingUpdates = useRef(new Map<HTMLElement, GPUUpdate>());
  const frameId = useRef<number>();
  
  const queueGPUUpdate = useCallback((element: HTMLElement, update: GPUUpdate) => {
    pendingUpdates.current.set(element, update);
    
    // Cancel previous frame if pending
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
    }
    
    // Batch all updates in next frame
    frameId.current = requestAnimationFrame(() => {
      pendingUpdates.current.forEach((update, element) => {
        // Apply all transforms at once
        const transform = `translate3d(${update.x}px, ${update.y}px, 0) 
                         scale(${update.scale}) 
                         rotate(${update.rotation}deg)`;
        
        element.style.transform = transform;
        element.style.opacity = update.opacity.toString();
      });
      
      pendingUpdates.current.clear();
    });
  }, []);
  
  return { queueGPUUpdate };
}

interface GPUUpdate {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}
```

## Performance Monitoring for GPU

### GPU Usage Tracking

```tsx
// Monitor GPU performance
function useGPUPerformanceMonitor() {
  const metricsDisplay = usePerformanceRef('metricsDisplay');
  const layerCount = useRef(0);
  
  const trackGPULayers = useCallback(() => {
    // Count active GPU layers
    const allElements = document.querySelectorAll('*');
    let activeLayerCount = 0;
    
    allElements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const willChange = computedStyle.willChange;
      const transform = computedStyle.transform;
      
      // Check if element is on GPU layer
      if (willChange !== 'auto' || transform !== 'none') {
        activeLayerCount++;
      }
    });
    
    layerCount.current = activeLayerCount;
    
    if (metricsDisplay.target) {
      metricsDisplay.target.textContent = `GPU Layers: ${activeLayerCount}`;
      
      // Warn if too many layers
      if (activeLayerCount > 50) {
        metricsDisplay.target.style.color = 'red';
        console.warn(`High GPU layer count: ${activeLayerCount}`);
      } else {
        metricsDisplay.target.style.color = 'green';
      }
    }
  }, [metricsDisplay]);
  
  // Monitor every 5 seconds
  useEffect(() => {
    const interval = setInterval(trackGPULayers, 5000);
    return () => clearInterval(interval);
  }, [trackGPULayers]);
  
  return { layerCount: layerCount.current };
}
```

### Frame Rate Monitoring

```tsx
// Track frame rate for GPU-accelerated content
function useFrameRateMonitor() {
  const fpsDisplay = usePerformanceRef('fpsDisplay');
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const isMonitoring = useRef(false);
  
  const startMonitoring = useCallback(() => {
    if (isMonitoring.current) return;
    
    isMonitoring.current = true;
    
    function updateFPS() {
      if (!isMonitoring.current) return;
      
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
    }
    
    requestAnimationFrame(updateFPS);
  }, [fpsDisplay]);
  
  const stopMonitoring = useCallback(() => {
    isMonitoring.current = false;
  }, []);
  
  return { startMonitoring, stopMonitoring };
}
```

## Hardware Acceleration Best Practices

1. **Use GPU-Accelerated Properties**: Prefer `transform` and `opacity` over layout properties
2. **Minimize Layer Creation**: Only promote elements that need acceleration
3. **Cleanup Will-Change**: Remove `will-change` after animations complete
4. **Batch Updates**: Group multiple GPU operations in single frame
5. **Monitor Layer Count**: Keep GPU layers under 50 for optimal performance
6. **Use RequestAnimationFrame**: Sync with refresh rate for smooth animations
7. **Prefer Translate3D**: Force GPU acceleration with 3D transforms

## Performance Comparison

| Technique | CPU Usage | GPU Usage | Smoothness | Memory |
|-----------|-----------|-----------|------------|---------|
| **Layout Properties** | High | None | Poor | Low |
| **CSS Transitions** | Medium | Medium | Good | Medium |
| **GPU Transforms** | Low | High | Excellent | High |
| **RefContext + GPU** | Low | Optimized | Excellent | Optimized |

## Related Patterns

- [Canvas Optimization](./canvas-optimization.md) - Canvas-specific performance
- [Memory Optimization](./memory-optimization.md) - Memory-efficient patterns
- [Basic Usage](./basic-usage.md) - RefContext fundamentals