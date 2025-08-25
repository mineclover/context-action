# RefContext Performance Optimization

Comprehensive performance patterns and optimization techniques for 60fps+ interactions.

## Prerequisites

Before implementing performance patterns, ensure proper RefContext setup:

```typescript
import { createRefContext } from '@context-action/react';
```

**Required Setup**: Review **[RefContext Setup](../setup/ref-context-setup.md)** for:
- Performance Domain RefContext creation
- Provider composition patterns  
- Lazy initialization techniques
- Service and worker management

**Type Definitions**: Use pre-defined types from setup:
- `PerformanceRefs` - Canvas, worker, WASM module refs
- `WorkerRefs` - Background processing workers
- `WASMRefs` - WebAssembly module refs

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

## Performance Optimization Areas

### 🎨 [Canvas Optimization](./canvas-optimization.md)
Real-world case study of solving Canvas interaction lag with immediate visual feedback patterns.

**[→ Try Live Demo](https://mineclover.github.io/context-action/example/refs/canvas)**

**Key Techniques**:
- Immediate visual feedback bypassing React state updates
- Dual-canvas architecture for optimal rendering
- Elimination of unnecessary redraws during mouse interactions
- 80-90% performance improvement in Canvas applications

### ⚡ [Hardware Acceleration](./hardware-acceleration.md)
GPU-accelerated DOM manipulation patterns for smooth, high-performance interactions.

**Key Techniques**:
- GPU-accelerated transforms with `translate3d()`
- Efficient GPU layer management
- Hardware-accelerated animations and transitions
- Batch GPU operations for optimal performance

### 🧠 [Memory Optimization](./memory-optimization.md)
Memory-efficient patterns and techniques for optimal RefContext performance.

**Key Techniques**:
- Object pooling for frequent ref operations
- Memory leak detection and prevention
- Efficient event handling and cleanup
- Garbage collection optimization patterns

## Performance Monitoring and Best Practices

### Built-in Performance Tools

RefContext includes built-in performance monitoring capabilities using setup-defined types:

```tsx
// Performance monitoring with PerformanceRefs setup
function usePerformanceMonitoring() {
  const canvas = usePerformanceRef('canvas');
  const worker = usePerformanceRef('worker');
  const wasmModule = usePerformanceRef('wasmModule');
  
  useEffect(() => {
    if (canvas.target) {
      // Enable built-in FPS monitoring
      canvas.target.setAttribute('data-perf-monitor', 'true');
    }
    
    // Monitor worker performance
    if (worker.target) {
      worker.target.postMessage({ type: 'ENABLE_MONITORING' });
    }
  }, [canvas, worker]);
}
```

### Performance Checklist

**Before Optimization**:
- [ ] Profile current performance bottlenecks
- [ ] Identify high-frequency operations
- [ ] Measure baseline FPS and memory usage
- [ ] Check for unnecessary React re-renders

**During Optimization**:
- [ ] Apply appropriate performance pattern
- [ ] Use hardware acceleration where possible
- [ ] Implement efficient memory management
- [ ] Monitor performance metrics in real-time

**After Optimization**:
- [ ] Validate performance improvements
- [ ] Check for memory leaks
- [ ] Test across different devices
- [ ] Document optimization decisions

## When to Use Performance Patterns

Choose the right optimization approach based on your use case:

### 🎨 Canvas & Graphics
Use [Canvas Optimization](./canvas-optimization.md) for:
- Real-time drawing applications
- Interactive data visualizations
- Game interfaces
- SVG manipulation

### ⚡ Hardware Acceleration
Use [Hardware Acceleration](./hardware-acceleration.md) for:
- Smooth animations and transitions
- Mouse/touch tracking
- Drag & drop interactions
- High-frequency DOM updates

### 🧠 Memory Management
Use [Memory Optimization](./memory-optimization.md) for:
- Large-scale applications
- Dynamic content generation
- Long-running applications
- Mobile optimization

## Quick Performance Wins

```tsx
// Essential performance optimizations using PerformanceRefs setup
function useQuickPerformanceWins() {
  const canvas = usePerformanceRef('canvas');
  const worker = usePerformanceRef('worker');
  
  useEffect(() => {
    if (!canvas.target) return;
    
    // 1. Hardware acceleration for canvas
    canvas.target.style.willChange = 'transform';
    canvas.target.style.transform = 'translate3d(0, 0, 0)';
    
    // 2. Optimize for compositing
    canvas.target.style.backfaceVisibility = 'hidden';
    
    // 3. Enable GPU acceleration
    const ctx = canvas.target.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = false; // For crisp pixel art
    }
    
    // 4. Cleanup on unmount
    return () => {
      if (canvas.target) {
        canvas.target.style.willChange = 'auto';
      }
      if (worker.target) {
        worker.target.terminate();
      }
    };
  }, [canvas, worker]);
}
```

## Advanced Performance Patterns

### Multi-Domain Performance Setup

```tsx
// Using multi-domain refs from setup for comprehensive performance optimization
function useAdvancedPerformanceSetup() {
  // Performance domain refs
  const canvas = usePerformanceRef('canvas');
  const worker = usePerformanceRef('worker');
  const wasmModule = usePerformanceRef('wasmModule');
  
  // Worker domain refs
  const dataWorker = useWorkerRef('dataProcessingWorker');
  const imageWorker = useWorkerRef('imageProcessingWorker');
  
  useEffect(() => {
    // Initialize performance-critical canvas
    if (canvas.target && !worker.target) {
      // Create dedicated rendering worker
      const renderWorker = new Worker('/workers/canvas-renderer.js');
      worker.setRef(renderWorker);
      
      // Setup offscreen canvas for worker
      const offscreen = canvas.target.transferControlToOffscreen();
      renderWorker.postMessage({ canvas: offscreen }, [offscreen]);
    }
    
    // Initialize WebAssembly for heavy computations
    if (!wasmModule.target) {
      import('/wasm/performance-module.wasm').then(module => {
        wasmModule.setRef(module.instance);
      });
    }
    
    // Cleanup
    return () => {
      worker.target?.terminate();
      dataWorker.target?.terminate();
      imageWorker.target?.terminate();
    };
  }, [canvas, worker, wasmModule, dataWorker, imageWorker]);
  
  return {
    canvas: canvas.target,
    isReady: !!(canvas.target && worker.target && wasmModule.target)
  };
}
```

### Performance Monitoring with Setup Types

```tsx
// Comprehensive performance monitoring using setup patterns
function usePerformanceAnalytics() {
  const canvas = usePerformanceRef('canvas');
  const worker = usePerformanceRef('worker');
  const [metrics, setMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0
  });
  
  useEffect(() => {
    if (!canvas.target || !worker.target) return;
    
    let animationId: number;
    let lastTime = 0;
    let frameCount = 0;
    
    const measurePerformance = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Measure memory usage
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo?.usedJSHeapSize || 0;
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: memoryUsage / 1024 / 1024 // MB
        }));
        
        // Send metrics to worker for analysis
        worker.target!.postMessage({
          type: 'PERFORMANCE_METRICS',
          metrics: { fps, memoryUsage }
        });
      }
      
      animationId = requestAnimationFrame(measurePerformance);
    };
    
    animationId = requestAnimationFrame(measurePerformance);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [canvas, worker]);
  
  return metrics;
}
```