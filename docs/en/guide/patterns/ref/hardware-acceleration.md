# Hardware Acceleration with RefContext

GPU-accelerated DOM manipulation patterns for 60fps+ performance.

## Prerequisites

Before using hardware acceleration patterns, set up RefContext with GPU and performance references:

**Required Setup**: [RefContext Setup](../setup/ref-context-setup.md) - Configure GPURefs, WASMRefs, and WorkerRefs

```typescript
// Import hardware acceleration ref types from setup
import { GPURefs, WASMRefs, WorkerRefs } from '../setup/ref-context-setup';
import { createRefContext } from '@context-action/react';

// Hardware acceleration RefContext setup
const {
  Provider: HardwareRefProvider,
  useRefHandler: useHardwareRef
} = createRefContext<GPURefs & WASMRefs & WorkerRefs>('Hardware');
```

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
// Hardware-accelerated mouse tracking with Setup-based refs
function HighPerformanceMouseTracker() {
  const cursor = useHardwareRef('cursor');
  const trail = useHardwareRef('trail');
  
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
// Force GPU layer creation using Setup-based GPU refs
function useGPULayer() {
  const element = useHardwareRef('element');
  
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
// Smooth transitions using Setup-based hardware refs
function useSmoothTransition() {
  const animatedElement = useHardwareRef('animatedElement');
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
// Efficient batch GPU updates using Setup-based refs
function useBatchGPUUpdates() {
  const elements = useHardwareRef('elements');
  const pendingUpdates = useRef(new Map<HTMLElement, HardwareUpdate>());
  const frameId = useRef<number>();
  
  const queueGPUUpdate = useCallback((element: HTMLElement, update: HardwareUpdate) => {
    pendingUpdates.current.set(element, update);
    
    // Cancel previous frame if pending
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
    }
    
    // Batch all updates in next frame
    frameId.current = requestAnimationFrame(() => {
      pendingUpdates.current.forEach((update, element) => {
        // Apply hardware-accelerated transforms following Setup pattern
        const transform = `translate3d(${update.transform.x}px, ${update.transform.y}px, ${update.transform.z}px) 
                         scale(${update.transform.scale}) 
                         rotate(${update.transform.rotation}deg)`;
        
        element.style.transform = transform;
        element.style.opacity = update.appearance.opacity.toString();
        element.style.filter = update.appearance.filter;
        element.style.willChange = update.acceleration.willChange;
        element.style.backfaceVisibility = update.acceleration.backfaceVisibility;
      });
      
      pendingUpdates.current.clear();
    });
  }, []);
  
  return { queueGPUUpdate };
}

// HardwareUpdate type uses Setup specification patterns  
// See: ref-context-setup.md for complete hardware update type definitions
```

## WebAssembly Hardware Acceleration

### WASM-Based Image Processing
```tsx
// Hardware acceleration with WebAssembly following Setup patterns
function useWASMAcceleration() {
  const imageProcessor = useHardwareRef('imageProcessor');
  const cryptoModule = useHardwareRef('cryptoModule');
  
  useEffect(() => {
    // Initialize WASM modules for hardware acceleration
    if (!imageProcessor.target) {
      import('/wasm/image-processor.wasm').then(async (wasmModule) => {
        const instance = await WebAssembly.instantiate(wasmModule);
        imageProcessor.setRef(instance);
      });
    }
    
    if (!cryptoModule.target) {
      import('/wasm/crypto-module.wasm').then(async (wasmModule) => {
        const instance = await WebAssembly.instantiate(wasmModule);
        cryptoModule.setRef(instance);
      });
    }
  }, [imageProcessor, cryptoModule]);
  
  const processImageWithHardware = useCallback(async (imageData: ImageData) => {
    if (!imageProcessor.target) throw new Error('WASM module not loaded');
    
    // Use WebAssembly for hardware-accelerated processing
    const result = imageProcessor.target.exports.processImage(
      imageData.data.buffer,
      imageData.width,
      imageData.height
    );
    
    return new ImageData(new Uint8ClampedArray(result), imageData.width, imageData.height);
  }, [imageProcessor]);
  
  const encryptDataWithHardware = useCallback(async (data: ArrayBuffer) => {
    if (!cryptoModule.target) throw new Error('Crypto WASM module not loaded');
    
    return cryptoModule.target.exports.encrypt(data);
  }, [cryptoModule]);
  
  return { processImageWithHardware, encryptDataWithHardware };
}
```

### Worker-Based Hardware Acceleration
```tsx
// Combine Workers with GPU acceleration using Setup patterns
function useWorkerGPUAcceleration() {
  const renderingWorker = useHardwareRef('renderingWorker');
  const dataProcessor = useHardwareRef('dataProcessingWorker');
  
  useEffect(() => {
    if (!renderingWorker.target) {
      const worker = new Worker('/workers/gpu-renderer.js');
      worker.postMessage({ type: 'INIT_GPU_CONTEXT' });
      renderingWorker.setRef(worker);
    }
    
    if (!dataProcessor.target) {
      const worker = new Worker('/workers/data-processor.js');
      worker.postMessage({ type: 'INIT_ACCELERATION' });
      dataProcessor.setRef(worker);
    }
    
    return () => {
      renderingWorker.target?.terminate();
      dataProcessor.target?.terminate();
    };
  }, [renderingWorker, dataProcessor]);
  
  const renderWithWorkerGPU = useCallback(async (renderData: any) => {
    if (!renderingWorker.target) throw new Error('Rendering worker not ready');
    
    return new Promise((resolve, reject) => {
      renderingWorker.target!.postMessage({
        type: 'RENDER_WITH_GPU',
        data: renderData
      });
      
      renderingWorker.target!.onmessage = (e) => {
        if (e.data.type === 'RENDER_COMPLETE') {
          resolve(e.data.result);
        } else if (e.data.type === 'RENDER_ERROR') {
          reject(new Error(e.data.error));
        }
      };
    });
  }, [renderingWorker]);
  
  return { renderWithWorkerGPU };
}
```

## Performance Monitoring for GPU

### GPU Usage Tracking

```tsx
// Monitor GPU performance using Setup-based performance refs
function useGPUPerformanceMonitor() {
  const metricsDisplay = useHardwareRef('metricsDisplay');
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
// Track frame rate using Setup-based performance monitoring
function useFrameRateMonitor() {
  const fpsDisplay = useHardwareRef('fpsDisplay');
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

## Complete Hardware Acceleration Setup

### Full Setup Integration
```tsx
// Complete hardware acceleration setup following Setup specifications
import { 
  GPURefs, 
  WASMRefs, 
  WorkerRefs,
  CanvasRefs 
} from '../setup/ref-context-setup';

// Combined hardware acceleration refs
interface HardwareAccelerationRefs extends 
  GPURefs, 
  WASMRefs, 
  WorkerRefs, 
  CanvasRefs {}

const {
  Provider: HardwareAccelerationProvider,
  useRefHandler: useHardwareRef,
  useWaitForRefs: useWaitForHardware,
  useGetAllRefs: getAllHardwareRefs
} = createRefContext<HardwareAccelerationRefs>('HardwareAcceleration');

// Application setup with all hardware acceleration capabilities
function HardwareAcceleratedApp() {
  return (
    <HardwareAccelerationProvider>
      <GPUAcceleratedComponents />
      <WASMAcceleratedComponents />
      <WorkerAcceleratedComponents />
    </HardwareAccelerationProvider>
  );
}
```

### Hardware Acceleration Initialization
```tsx
// Initialize all hardware acceleration capabilities
function useHardwareAccelerationInit() {
  const imageProcessor = useHardwareRef('imageProcessor');
  const cryptoModule = useHardwareRef('cryptoModule');
  const renderingWorker = useHardwareRef('renderingWorker');
  const dataWorker = useHardwareRef('dataProcessingWorker');
  
  useEffect(() => {
    const initHardwareAcceleration = async () => {
      try {
        // Initialize WebAssembly modules
        await Promise.all([
          initWASMModule(imageProcessor, '/wasm/image-processor.wasm'),
          initWASMModule(cryptoModule, '/wasm/crypto-module.wasm')
        ]);
        
        // Initialize Workers with GPU context
        await Promise.all([
          initWorkerWithGPU(renderingWorker, '/workers/gpu-renderer.js'),
          initWorkerWithGPU(dataWorker, '/workers/data-processor.js')
        ]);
        
        console.log('Hardware acceleration fully initialized');
      } catch (error) {
        console.error('Hardware acceleration initialization failed:', error);
      }
    };
    
    initHardwareAcceleration();
  }, [imageProcessor, cryptoModule, renderingWorker, dataWorker]);
  
  return {
    imageProcessor: imageProcessor.target,
    cryptoModule: cryptoModule.target,
    renderingWorker: renderingWorker.target,
    dataWorker: dataWorker.target
  };
}

// Helper functions for initialization
async function initWASMModule(ref: any, path: string) {
  const wasmModule = await import(path);
  const instance = await WebAssembly.instantiate(wasmModule);
  ref.setRef(instance);
}

async function initWorkerWithGPU(ref: any, path: string) {
  const worker = new Worker(path);
  worker.postMessage({ type: 'INIT_GPU_CONTEXT' });
  ref.setRef(worker);
}
```

## Hardware Acceleration Best Practices

### Setup-Based Best Practices
1. **Use Setup-Defined Types**: Always use ref types from the Setup specification
2. **Lazy Hardware Initialization**: Initialize hardware resources only when needed
3. **Combined Hardware Strategy**: Use GPU + WASM + Workers for optimal performance
4. **Setup-Based Providers**: Use provider composition from Setup patterns
5. **Resource Cleanup**: Properly dispose of hardware resources following Setup guidelines

### GPU Optimization
1. **Use GPU-Accelerated Properties**: Prefer `transform` and `opacity` over layout properties
2. **Minimize Layer Creation**: Only promote elements that need acceleration
3. **Cleanup Will-Change**: Remove `will-change` after animations complete
4. **Batch Updates**: Group multiple GPU operations in single frame
5. **Monitor Layer Count**: Keep GPU layers under 50 for optimal performance
6. **Use RequestAnimationFrame**: Sync with refresh rate for smooth animations
7. **Prefer Translate3D**: Force GPU acceleration with 3D transforms

### WASM Integration
1. **Module Pooling**: Reuse WASM instances across operations
2. **Memory Management**: Properly manage WASM memory allocations
3. **Type Safety**: Use TypeScript definitions for WASM exports
4. **Error Handling**: Implement robust error recovery for WASM failures

### Worker Coordination  
1. **GPU Context Sharing**: Share GPU context between main thread and workers
2. **Message Optimization**: Minimize data transfer between threads
3. **Worker Lifecycle**: Properly manage worker creation and termination
4. **Fallback Strategies**: Implement fallbacks when workers fail

## Performance Comparison

| Technique | CPU Usage | GPU Usage | Smoothness | Memory |
|-----------|-----------|-----------|------------|---------|
| **Layout Properties** | High | None | Poor | Low |
| **CSS Transitions** | Medium | Medium | Good | Medium |
| **GPU Transforms** | Low | High | Excellent | High |
| **RefContext + GPU** | Low | Optimized | Excellent | Optimized |

## Related Patterns

- **[RefContext Setup](../setup/ref-context-setup.md)** - Essential setup for GPURefs, WASMRefs, WorkerRefs
- [Canvas Optimization](./canvas-optimization.md) - Canvas-specific performance using CanvasRefs
- [Memory Optimization](./memory-optimization.md) - Memory-efficient patterns with Setup cleanup
- [Basic Usage](./basic-usage.md) - RefContext fundamentals and Setup integration