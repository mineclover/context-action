# React Refs Management Guide

This guide covers the **React Refs Management System** in the Context-Action framework - a simple and safe reference management system designed for managing DOM elements, custom objects, and complex component references with type safety and lifecycle management.

> **⚠️ Important**: Always use `createRefContext()` for ref management. Direct `RefStore` instantiation is discouraged and only intended for internal framework use.

## Overview

The React Refs system provides declarative ref management with automatic cleanup, type safety, and advanced lifecycle features through the **`createRefContext()` API**. It's particularly useful for:

- **DOM Element Management**: Safe access to DOM elements with proper lifecycle handling
- **Custom Object References**: Managing Three.js objects, game engines, or other complex instances  
- **Async Ref Operations**: Waiting for refs to mount and performing safe operations
- **Memory Management**: Automatic cleanup and leak prevention

### 🎯 Recommended Usage Pattern

**✅ Always use `createRefContext()`**:
```typescript
// ✅ RECOMMENDED: Use createRefContext for all ref management
const MyRefs = createRefContext('MyRefs', { /* ... */ });

// ❌ AVOID: Direct RefStore usage (internal API)
// const store = new RefStore({ name: 'myRef' }); // Don't do this!
```

## Core Concepts

### RefContext System

The refs system is built around `createRefContext()`, which provides a clean, declarative API that abstracts away internal `RefStore` complexity:

- **Type Safety**: Full TypeScript support with proper type inference
- **Lifecycle Management**: Automatic mounting/unmounting detection
- **Safe Operations**: Protected ref access with error handling
- **Flexible Configuration**: Both simple and advanced configuration options
- **Internal Optimization**: Uses `RefStore` internally but provides a better developer experience

> **🔧 Architecture Note**: `createRefContext()` manages `RefStore` instances internally, providing a cleaner API while handling all the complex lifecycle management, error handling, and memory cleanup automatically.

### Two Configuration Approaches

#### 1. Simple Type Definition (Legacy)
```typescript
import { createRefContext } from '@context-action/react/refs';

// Simple type specification
const GameRefs = createRefContext<{
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
}>('GameRefs');
```

#### 2. Declarative Definitions (Recommended)
```typescript
// ✅ Recommended: Renaming Pattern with declarative configuration
const {
  Provider: GameRefsProvider,
  useRefHandler: useGameRefHandler,
  useWaitForRefs: useGameWaitForRefs,  // Direct hook usage - much more intuitive!
  useGetAllRefs: useGameGetAllRefs
} = createRefContext('GameRefs', {
  canvas: {
    name: 'canvas',
    autoCleanup: true
  },
  scene: {
    name: 'scene', 
    autoCleanup: true,
    cleanup: (scene) => {
      scene.dispose();
    }
  }
});

// Usage example:
function GameComponent() {
  const canvas = useGameRefHandler('canvas');
  const scene = useGameRefHandler('scene');
  
  // ✅ CORRECT: Extract function at component level
  const waitForRefs = useGameWaitForRefs();
  
  const initGame = async () => {
    // ✅ Use the extracted function
    const refs = await waitForRefs('canvas', 'scene');
    console.log('All refs ready:', refs);
  };
  
  return (
    <GameRefsProvider>
      <canvas ref={canvas.setRef} />
      <button onClick={initGame}>Initialize Game</button>
    </GameRefsProvider>
  );
}
```

## Naming Conventions

Following the Context-Action framework conventions, **all refs contexts should use the renaming pattern** for consistency and improved developer experience.

### ✅ Recommended: Renaming Pattern

```typescript
// ✅ Domain-specific renaming pattern
const {
  Provider: GameRefsProvider,
  useRefHandler: useGameRefHandler,
  useWaitForRefs: useGameWaitForRefs,
  useGetAllRefs: useGameGetAllRefs
} = createRefContext('GameRefs', { /* ... */ });

const {
  Provider: FormRefsProvider,
  useRefHandler: useFormRefHandler,
  useWaitForRefs: useFormWaitForRefs,
  useGetAllRefs: useFormGetAllRefs  
} = createRefContext('FormRefs', { /* ... */ });
```

### ❌ Avoided: Direct Object Access

```typescript
// ❌ Avoid direct object usage (poor naming clarity)
const GameRefs = createRefContext('GameRefs', { /* ... */ });
const canvas = GameRefs.useRefHandler('canvas'); // Domain unclear

// ❌ Generic naming (causes confusion)
const {
  Provider,
  useRef,
  useWaitForRefs,
  useGetAllRefs
} = createRefContext('GameRefs', { /* ... */ });
```

### 🎯 Context Naming Rules

#### Domain-Based Context Names
```typescript
// ✅ Recommended: Clear domain indication
'GameRefs'        // Game-related references
'FormRefs'        // Form element references  
'MediaRefs'       // Media player references
'CanvasRefs'      // Canvas and graphics references
'UIRefs'          // UI component references

// ❌ Avoided: Vague naming
'Refs'            // Too generic
'Elements'        // Not specific enough
'DOM'             // Too broad
'Components'      // Unclear scope
```

#### Hook Naming Pattern
```typescript
// ✅ Recommended: use + Domain + Ref pattern
const useGameRefHandler = GameRefsContext.useRefHandler;
const useFormRefHandler = FormRefsContext.useRefHandler;
const useMediaRefHandler = MediaRefsContext.useRefHandler;

// Usage
const canvas = useGameRef('canvas');
const emailInput = useFormRefHandler('emailInput');
const videoPlayer = useMediaRefHandler('videoPlayer');
```

## Basic Usage

### Setting Up Refs

```typescript
import { createRefContext } from '@context-action/react/refs';

// ✅ Recommended: Renaming Pattern for refs
const {
  Provider: AppRefsProvider,
  useRefHandler: useAppRef,
  useWaitForRefs: useAppWaitForRefs,
  useGetAllRefs: useAppGetAllRefs
} = createRefContext<{
  headerElement: HTMLElement;
  videoPlayer: HTMLVideoElement;
  customWidget: any;
}>('AppRefs');

function MyComponent() {
  const header = useAppRefHandler('headerElement');
  const video = useAppRefHandler('videoPlayer');
  const widget = useAppRefHandler('customWidget');
  
  return (
    <AppRefsProvider>
      <header ref={header.setRef}>
        <h1>My App</h1>
      </header>
      <video ref={video.setRef} />
      <div ref={(el) => widget.setRef(someCustomWidget)} />
    </AppRefsProvider>
  );
}
```

### Accessing Ref Values

```typescript
function ComponentUsingRefs() {
  const header = useAppRefHandler('headerElement');
  
  const handleClick = () => {
    // Direct access (may be null)
    if (header.target) {
      header.target.scrollIntoView();
    }
    
    // Check if mounted
    if (header.isMounted) {
      console.log('Header is available');
    }
  };
  
  return <button onClick={handleClick}>Scroll to Header</button>;
}
```

## Advanced Features

### Hook Usage Pattern

The refs system follows React's hook pattern where you **extract the function first, then use it**:

#### ✅ Correct Usage Pattern
```typescript
function MyComponent() {
  const canvas = useGameRefHandler('canvas');
  const scene = useGameRefHandler('scene');
  
  // ✅ STEP 1: Call the hook to extract the function
  const waitForRefs = useGameWaitForRefs();
  const getAllRefs = useGameGetAllRefs();
  
  const handleClick = async () => {
    // ✅ STEP 2: Use the extracted function
    const refs = await waitForRefs('canvas', 'scene');
    console.log('Refs ready:', refs);
  };
  
  const checkAllRefs = () => {
    // ✅ Use the extracted function
    const allRefs = getAllRefs();
    console.log('All mounted refs:', allRefs);
  };
  
  // ✅ Perfect for useEffect and other React hooks
  useEffect(() => {
    const initAsync = async () => {
      const refs = await waitForRefs('canvas', 'scene');
      // Initialize with refs...
    };
    initAsync();
  }, [waitForRefs]); // Stable reference due to useCallback
  
  return (
    <div>
      <canvas ref={canvas.setRef} />
      <button onClick={handleClick}>Wait for Refs</button>
      <button onClick={checkAllRefs}>Check All Refs</button>
    </div>
  );
}
```

#### ❌ Common Mistakes

```typescript
function BadComponent() {
  const handleClick = async () => {
    // ❌ WRONG: Cannot await hook directly
    // const refs = await useGameWaitForRefs('canvas', 'scene'); // This won't work!
    
    // ❌ WRONG: Violates React hook rules (hooks must be at top level)
    const waitForRefs = useGameWaitForRefs(); // Hook called inside callback
    const refs = await waitForRefs('canvas', 'scene');
  };
}
```

#### Why This Pattern Works

```typescript
// ✅ The hook returns a stable function reference
function GoodComponent() {
  const waitForRefs = useGameWaitForRefs(); // Returns memoized function
  
  // This function is stable across re-renders thanks to useCallback
  const stableCallback = useCallback(async () => {
    const refs = await waitForRefs('canvas', 'scene');
    // Handle refs...
  }, [waitForRefs]); // Stable dependency - won't cause unnecessary re-runs
  
  return <button onClick={stableCallback}>Initialize</button>;
}
```

### Comprehensive Waiting Patterns

```typescript
function AsyncRefOperations() {
  const canvas = useGameRefHandler('canvas');
  const scene = useGameRefHandler('scene');
  
  // ✅ Extract function for reuse (Pattern 1 - Recommended)
  const waitForRefs = useGameWaitForRefs();
  
  // Wait for single ref
  const initCanvas = async () => {
    try {
      const canvasElement = await canvas.waitForMount();
      // Canvas is guaranteed to be available here
      const context = canvasElement.getContext('2d');
      context.fillRect(0, 0, 100, 100);
    } catch (error) {
      console.error('Canvas failed to mount:', error);
    }
  };
  
  // Wait for multiple refs using extracted function
  const initGame = async () => {
    try {
      const refs = await waitForRefs('canvas', 'scene');
      console.log('All refs ready:', refs);
      
      // Type-safe access to mounted refs
      if (refs.canvas && refs.scene) {
        // Initialize game with both refs available
      }
    } catch (error) {
      console.error('Refs failed to mount:', error);
    }
  };
  
  // ❌ WRONG: This violates hook rules - don't do this
  // const quickCheck = async () => {
  //   const waitForRefs = useGameWaitForRefs(); // Hook in callback = violation
  //   const refs = await waitForRefs('canvas');
  // };
  
  return (
    <div>
      <canvas ref={canvas.setRef} />
      <button onClick={initCanvas}>Initialize Canvas</button>
      <button onClick={initGame}>Initialize Game</button>
    </div>
  );
}
```

### Safe Operations with withTarget

```typescript
function SafeRefOperations() {
  const video = useAppRefHandler('videoPlayer');
  
  const playVideo = async () => {
    const result = await video.withTarget(
      async (videoElement) => {
        // Safe operations inside this function
        videoElement.currentTime = 0;
        await videoElement.play();
        return { duration: videoElement.duration };
      },
      {
        timeout: 5000,      // Wait up to 5 seconds
        retries: 3,         // Retry up to 3 times
        retryDelay: 1000    // 1 second between retries
      }
    );
    
    if (result.success) {
      console.log('Video duration:', result.data.duration);
    } else {
      console.error('Failed to play video:', result.error);
    }
  };
  
  return <button onClick={playVideo}>Play Video</button>;
}
```

## RefDefinitions Management Strategies

RefDefinitions provide powerful configuration options for different ref management strategies:

### Basic DOM Elements

```typescript
// ✅ Recommended: Renaming Pattern
const {
  Provider: AppRefsProvider,
  useRefHandler: useAppRef
} = createRefContext('AppRefs', {
  // Simple DOM element with basic settings
  container: {
    name: 'container',
    autoCleanup: true,
    mountTimeout: 3000
  }
});
```

### Input Validation

```typescript
// ✅ Recommended: Renaming Pattern for form refs
const {
  Provider: FormRefsProvider,
  useRefHandler: useFormRef
} = createRefContext('FormRefs', {
  // Strict validation for email input
  emailInput: {
    name: 'emailInput',
    autoCleanup: true,
    mountTimeout: 2000,
    validator: (el): el is HTMLInputElement => 
      el instanceof HTMLInputElement && el.type === 'email'
  },
  
  // Loose management for general elements
  infoDiv: {
    name: 'infoDiv', 
    autoCleanup: false,  // Manual management
    mountTimeout: 5000   // Longer timeout
  }
});
```

### Custom Object Management

```typescript
// ✅ Recommended: Renaming Pattern for game refs
const {
  Provider: GameRefsProvider,
  useRefHandler: useGameRef
} = createRefContext('GameRefs', {
  // Complex cleanup for game engine
  gameEngine: {
    name: 'gameEngine',
    autoCleanup: true,
    cleanup: async (engine) => {
      await engine.stopAllSounds();
      engine.disposeResources();
      engine.disconnect();
    },
    validator: (obj) => obj && typeof obj.dispose === 'function'
  },
  
  // Three.js scene management
  threeScene: {
    name: 'threeScene',
    autoCleanup: true,
    cleanup: (scene) => {
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      scene.clear();
    }
  }
});
```

### Metadata and Lifecycle Management

```typescript
// ✅ Recommended: Renaming Pattern for advanced refs
const {
  Provider: AdvancedRefsProvider,
  useRefHandler: useAdvancedRef
} = createRefContext('AdvancedRefs', {
  mediaPlayer: {
    name: 'mediaPlayer',
    autoCleanup: true,
    mountTimeout: 10000,
    initialMetadata: {
      createdAt: Date.now(),
      version: '1.0.0',
      features: ['play', 'pause', 'seek']
    },
    cleanup: async (player) => {
      await player.pause();
      player.destroy();
    },
    validator: (player) => 
      player && 
      typeof player.play === 'function' && 
      typeof player.pause === 'function'
  }
});
```

## Available Management Strategies

| Strategy | Purpose | Usage |
|----------|---------|--------|
| `autoCleanup` | Automatic cleanup when component unmounts | Most refs should use `true` |
| `mountTimeout` | Maximum time to wait for ref mounting | Adjust based on complexity |
| `validator` | Type and validity checking | Critical for type safety |
| `cleanup` | Custom cleanup function | Complex objects needing disposal |
| `initialMetadata` | Additional ref metadata | Debugging and tracking |

### Simplified Reference Management

The RefContext system now treats all references as singleton objects without deep cloning or immutability checks. This is based on the understanding that refs are meant to manage singleton objects that should never be cloned.

#### Key Principles:
- **No Cloning**: All refs maintain direct references to their target objects
- **Reference Comparison Only**: State changes are detected using reference equality
- **Universal Handling**: DOM elements, custom objects, and Three.js objects are all handled identically
- **Cleanup Functions**: The only differentiation is through optional cleanup functions

```typescript
// All refs are handled the same way - as singleton references
const refs = createRefContext('AppRefs', {
  // DOM element - no special handling needed
  container: {
    name: 'container',
    autoCleanup: true
  },
  
  // Three.js object - just add cleanup if needed
  scene: {
    name: 'scene',
    autoCleanup: true,
    cleanup: (scene) => {
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    }
  },
  
  // Custom object - same pattern
  engine: {
    name: 'engine',
    autoCleanup: true,
    cleanup: async (engine) => {
      await engine.shutdown();
    }
  }
});
```

This simplified approach:
- Eliminates circular reference issues with React Fiber
- Improves performance by avoiding unnecessary cloning
- Provides consistent behavior across all ref types
- Makes the API simpler and more predictable

## Real-World Example: Mouse Events with RefContext

Here's a practical example showing how RefContext enables high-performance mouse tracking with zero React re-renders:

```typescript
import React, { useCallback, useRef } from 'react';
import { createRefContext } from '@context-action/react';

// 1. Define mouse event types
type MousePosition = { x: number; y: number };
type MouseClick = { x: number; y: number; timestamp: number; button: number };

// 2. Create RefContext for mouse position management
const {
  Provider: MousePositionProvider,
  useRefHandler: useMousePositionRef
} = createRefContext<{
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
}>('MousePosition');

// 3. Create RefContext for visual effects
const {
  Provider: VisualEffectsProvider,
  useRefHandler: useVisualEffectsRef
} = createRefContext<{
  clickEffectsContainer: HTMLDivElement;
  pathSvg: SVGSVGElement;
  pathElement: SVGPathElement;
}>('VisualEffects');

// 4. Custom hook for mouse position updates
function useMousePositionUpdater() {
  const cursor = useMousePositionRef('cursor');
  const trail = useMousePositionRef('trail');
  
  const updatePosition = useCallback((position: MousePosition) => {
    // Direct DOM manipulation - zero React re-renders!
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    }
    if (trail.target) {
      trail.target.style.transform = `translate3d(${position.x - 5}px, ${position.y - 5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
  }, [cursor, trail]);
  
  const showCursor = useCallback((visible: boolean) => {
    if (cursor.target) {
      cursor.target.style.display = visible ? 'block' : 'none';
    }
  }, [cursor]);
  
  return { updatePosition, showCursor };
}

// 5. Custom hook for visual effects
function useVisualEffectsUpdater() {
  const clickEffectsContainer = useVisualEffectsRef('clickEffectsContainer');
  const pathElement = useVisualEffectsRef('pathElement');
  const pathHistoryRef = useRef<MousePosition[]>([]);
  
  const addClickEffect = useCallback((click: MouseClick) => {
    if (!clickEffectsContainer.target) return;
    
    // Create click effect element
    const effect = document.createElement('div');
    effect.className = 'absolute pointer-events-none';
    effect.style.cssText = `
      left: ${click.x - 15}px;
      top: ${click.y - 15}px;
      width: 30px;
      height: 30px;
      border: 2px solid #ef4444;
      border-radius: 50%;
      transform: scale(0);
      opacity: 1;
      transition: all 800ms cubic-bezier(0.23, 1, 0.32, 1);
    `;
    
    clickEffectsContainer.target.appendChild(effect);
    
    // Start animation
    requestAnimationFrame(() => {
      effect.style.transform = 'scale(2)';
      effect.style.opacity = '0';
    });
    
    // Clean up after animation
    setTimeout(() => {
      if (clickEffectsContainer.target && effect.parentNode) {
        clickEffectsContainer.target.removeChild(effect);
      }
    }, 800);
  }, [clickEffectsContainer]);
  
  const addPathPoint = useCallback((position: MousePosition) => {
    pathHistoryRef.current = [position, ...pathHistoryRef.current.slice(0, 49)];
    
    if (pathElement.target && pathHistoryRef.current.length > 1) {
      const pathString = generatePathString(pathHistoryRef.current);
      pathElement.target.setAttribute('d', pathString);
    }
  }, [pathElement]);
  
  return { addClickEffect, addPathPoint };
}

// 6. Helper function for smooth path generation
function generatePathString(points: MousePosition[]): string {
  if (points.length < 2) return '';
  
  const [firstPoint, ...restPoints] = points;
  let pathString = `M ${firstPoint.x},${firstPoint.y}`;
  
  for (let i = 0; i < restPoints.length; i++) {
    const current = restPoints[i];
    if (i === restPoints.length - 1) {
      pathString += ` L ${current.x},${current.y}`;
    } else {
      const next = restPoints[i + 1];
      const cpx = (current.x + next.x) / 2;
      const cpy = (current.y + next.y) / 2;
      pathString += ` Q ${current.x},${current.y} ${cpx},${cpy}`;
    }
  }
  
  return pathString;
}

// 7. Main mouse events component
function RefContextMouseDemo() {
  const { updatePosition, showCursor } = useMousePositionUpdater();
  const { addClickEffect, addPathPoint } = useVisualEffectsUpdater();
  
  const container = useMousePositionRef('container');
  const cursor = useMousePositionRef('cursor');
  const trail = useMousePositionRef('trail');
  
  // Event handlers with direct DOM manipulation
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const position: MousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    // Update all visual elements without React re-renders
    updatePosition(position);
    addPathPoint(position);
  }, [container, updatePosition, addPathPoint]);
  
  const handleMouseClick = useCallback((event: React.MouseEvent) => {
    if (!container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const click: MouseClick = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      timestamp: performance.now(),
      button: event.button,
    };
    
    addClickEffect(click);
  }, [container, addClickEffect]);
  
  return (
    <div
      ref={container.setRef}
      className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
      onClick={handleMouseClick}
      onMouseEnter={() => showCursor(true)}
      onMouseLeave={() => showCursor(false)}
    >
      {/* Mouse cursor */}
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      
      {/* Mouse trail */}
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)', opacity: 0 }}
      />
    </div>
  );
}

// 8. Complete app with all providers
function MouseEventsApp() {
  return (
    <MousePositionProvider>
      <VisualEffectsProvider>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">RefContext Mouse Events</h2>
          <RefContextMouseDemo />
          <p className="mt-4 text-sm text-gray-600">
            Move your mouse and click to see zero React re-render performance!
          </p>
        </div>
      </VisualEffectsProvider>
    </MousePositionProvider>
  );
}
```

### Key Benefits of This Approach:

1. **Zero React Re-renders**: All mouse movements are handled through direct DOM manipulation
2. **Perfect Separation of Concerns**: Each RefContext manages its own domain
3. **Hardware Acceleration**: Using `translate3d()` for smooth 60fps performance
4. **Type Safety**: Full TypeScript support with proper ref typing
5. **Independent Contexts**: Mouse position and visual effects are completely decoupled
6. **Memory Efficient**: Automatic cleanup when components unmount

## Complete Example: Game Component

```typescript
import { createRefContext } from '@context-action/react/refs';
import * as THREE from 'three';

// ✅ Recommended: Renaming Pattern with comprehensive configuration
const {
  Provider: GameRefsProvider,
  useRefHandler: useGameRefHandler,
  waitForRefs: useGameWaitForRefs
} = createRefContext('GameRefs', {
  canvas: {
    name: 'canvas',
    autoCleanup: true,
    validator: (el): el is HTMLCanvasElement => 
      el instanceof HTMLCanvasElement
  },
  
  scene: {
    name: 'scene',
    autoCleanup: true,
    cleanup: (scene) => {
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
      scene.clear();
    }
  },
  
  renderer: {
    name: 'renderer',
    autoCleanup: true,
    cleanup: (renderer) => {
      renderer.dispose();
    }
  },
  
  gameState: {
    name: 'gameState',
    autoCleanup: true,
    cleanup: (state) => {
      state.cleanup();
    }
  }
});

function GameComponent() {
  const canvas = useGameRefHandler('canvas');
  const scene = useGameRefHandler('scene');
  const renderer = useGameRef('renderer');
  const gameState = useGameRef('gameState');
  
  // ✅ Extract function for stable reference (Pattern 1)
  const waitForRefs = useGameWaitForRefs();
  
  const initializeGame = async () => {
    try {
      // Wait for all essential refs using extracted function
      const refs = await waitForRefs('canvas', 'scene', 'renderer');
      
      if (!refs.canvas) throw new Error('Canvas not available');
      
      // Initialize Three.js scene
      const threeScene = new THREE.Scene();
      const threeRenderer = new THREE.WebGLRenderer({ 
        canvas: refs.canvas 
      });
      
      // Set refs
      scene.setRef(threeScene);
      renderer.setRef(threeRenderer);
      gameState.setRef(new GameState());
      
      console.log('Game initialized successfully');
    } catch (error) {
      console.error('Game initialization failed:', error);
    }
  };
  
  const startGame = async () => {
    const result = await scene.withTarget(
      async (sceneRef) => {
        const result2 = await renderer.withTarget(
          async (rendererRef) => {
            // Both refs are guaranteed to be available
            return startGameLoop(sceneRef, rendererRef);
          }
        );
        return result2.data;
      }
    );
    
    if (result.success) {
      console.log('Game started:', result.data);
    } else {
      console.error('Failed to start game:', result.error);
    }
  };
  
  return (
    <GameRefsProvider>
      <div className="game-container">
        <canvas 
          ref={canvas.setRef}
          width={800}
          height={600}
        />
        <div className="game-controls">
          <button onClick={initializeGame}>
            Initialize Game
          </button>
          <button onClick={startGame}>
            Start Game
          </button>
          <div>
            Canvas Ready: {canvas.isMounted ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </GameRefsProvider>
  );
}

class GameState {
  cleanup() {
    // Game state cleanup logic
  }
}

function startGameLoop(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  // Game loop implementation
  return { status: 'running' };
}
```

## Best Practices

### 1. Choose the Right Configuration Approach

```typescript
// ✅ For simple cases - use type definition with renaming pattern
const {
  Provider: SimpleRefsProvider,
  useRefHandler: useSimpleRef
} = createRefContext<{
  input: HTMLInputElement;
  button: HTMLButtonElement;
}>('SimpleRefs');

// ✅ For complex cases - use declarative definitions with renaming pattern
const {
  Provider: ComplexRefsProvider,
  useRefHandler: useComplexRef
} = createRefContext('ComplexRefs', {
  mediaEngine: {
    name: 'mediaEngine',
    autoCleanup: true,
    cleanup: engine => engine.destroy()
  }
});
```

### 2. Handle Async Operations Safely

```typescript
// Good - use waitForMount or withTarget
const handleClick = async () => {
  const canvas = await canvasRef.waitForMount();
  const context = canvas.getContext('2d');
  // Safe to use context
};

// Better - use withTarget for error handling
const handleClick = async () => {
  const result = await canvasRef.withTarget(
    (canvas) => {
      const context = canvas.getContext('2d');
      return context;
    }
  );
  
  if (result.success) {
    // Use result.data safely
  }
};
```

### 3. Configure Appropriate Timeouts

```typescript
// ✅ Recommended: Renaming Pattern with appropriate timeouts
const {
  Provider: AppRefsProvider,
  useRefHandler: useAppRef
} = createRefContext('AppRefs', {
  button: {
    name: 'button',
    mountTimeout: 1000
  },
  
  // Longer timeout for complex initialization
  gameEngine: {
    name: 'gameEngine', 
    mountTimeout: 10000
  }
});
```

### 4. Implement Proper Cleanup

```typescript
// ✅ Recommended: Renaming Pattern with proper cleanup
const {
  Provider: ResourceRefsProvider,
  useRefHandler: useResourceRef
} = createRefContext('ResourceRefs', {
  // Automatic cleanup for simple objects
  simpleResource: {
    name: 'simpleResource',
    autoCleanup: true
  },
  
  // Custom cleanup for complex objects
  complexResource: {
    name: 'complexResource',
    autoCleanup: true,
    cleanup: async (resource) => {
      await resource.saveState();
      resource.dispose();
      resource.removeAllListeners();
    }
  }
});
```

## Error Handling

The refs system provides comprehensive error handling:

```typescript
function ErrorHandlingExample() {
  const canvas = useGameRefHandler('canvas');
  
  const safeOperation = async () => {
    try {
      // This will timeout after the configured mountTimeout
      const canvasEl = await canvas.waitForMount();
      console.log('Canvas ready:', canvasEl);
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.error('Canvas took too long to mount');
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };
  
  const protectedOperation = async () => {
    const result = await canvas.withTarget(
      (canvasEl) => {
        // This operation is protected
        return canvasEl.getBoundingClientRect();
      },
      { timeout: 3000, retries: 2 }
    );
    
    if (result.success) {
      console.log('Canvas bounds:', result.data);
    } else {
      console.error('Operation failed:', result.error);
    }
  };
  
  return (
    <div>
      <canvas ref={canvas.setRef} />
      <button onClick={safeOperation}>Safe Operation</button>
      <button onClick={protectedOperation}>Protected Operation</button>
    </div>
  );
}
```

## Integration with Context-Action Framework

The refs system integrates seamlessly with the Context-Action framework's other patterns:

```typescript
// ✅ Combine with Store Pattern for state management (Renaming Pattern)
const {
  Provider: AppStoresProvider,
  useStore: useAppStore
} = createDeclarativeStorePattern('App', {
  gameState: { level: 1, score: 0, playing: false }
});

// ✅ Combine with Action Pattern for game events (Renaming Pattern)  
const {
  Provider: GameActionsProvider,
  useActionDispatch: useGameAction,
  useActionHandler: useGameActionHandler
} = createActionContext<{
  startGame: void;
  updateScore: { points: number };
}>('GameActions');

function GameApp() {
  const gameStateStore = useAppStore('gameState');
  const gameState = useStoreValue(gameStateStore);
  const dispatch = useGameAction();
  
  const canvas = useGameRefHandler('canvas');
  const scene = useGameRefHandler('scene');
  
  // Action handler using refs
  useGameActionHandler('startGame', async () => {
    const result = await scene.withTarget(async (sceneRef) => {
      // Initialize game with ref
      return initializeGameScene(sceneRef);
    });
    
    if (result.success) {
      gameStateStore.update(state => ({ ...state, playing: true }));
    }
  });
  
  return (
    <AppStoresProvider>
      <GameActionsProvider>
        <GameRefsProvider>
          <canvas ref={canvas.setRef} />
          <div>Level: {gameState.level}</div>
          <button onClick={() => dispatch('startGame')}>
            Start Game
          </button>
        </GameRefsProvider>
      </GameActionsProvider>
    </AppStoresProvider>
  );
}
```

## Migration Guide

### From React.useRef

```typescript
// Before - React.useRef
function OldComponent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      // Manual null checking
      const context = canvasRef.current.getContext('2d');
    }
  }, []);
  
  return <canvas ref={canvasRef} />;
}

// After - Context-Action refs with renaming pattern
const {
  Provider: CanvasRefsProvider,
  useRefHandler: useCanvasRef
} = createRefContext<{
  canvas: HTMLCanvasElement;
}>('CanvasRefs');

function NewComponent() {
  const canvas = useCanvasRefHandler('canvas');
  
  useEffect(() => {
    canvas.waitForMount().then(canvasEl => {
      // Guaranteed to be available
      const context = canvasEl.getContext('2d');
    });
  }, []);
  
  return (
    <CanvasRefsProvider>
      <canvas ref={canvas.setRef} />
    </CanvasRefsProvider>
  );
}
```

The React Refs Management System provides a powerful, type-safe, and lifecycle-aware approach to managing references in React applications, with seamless integration into the Context-Action framework's architecture patterns.