# React Refs Management Guide

This guide covers the **React Refs Management System** in the Context-Action framework - a simple and safe reference management system designed for managing DOM elements, custom objects, and complex component references with type safety and lifecycle management.

> **⚠️ Important**: Always use `createRefContext()` for ref management. Direct `RefStore` instantiation is discouraged and only intended for internal framework use.

## Overview

The React Refs system provides declarative ref management with automatic cleanup, type safety, and advanced lifecycle features through the **`createRefContext()` API**. It's particularly useful for:

- **DOM Element Management**: Safe access to DOM elements with proper lifecycle handling
- **Custom Object References**: Managing Three.js objects, game engines, or other complex instances  
- **Async Ref Operations**: Waiting for refs to mount and performing safe operations
- **Memory Management**: Automatic cleanup and leak prevention
- **High-Performance UI**: Direct DOM manipulation for animations and real-time updates

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
  
  // Wait for single ref with default timeout (1 second)
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
  
  // Wait for multiple refs with default timeout (1 second each)
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
  
  // Wait with custom timeout (5 seconds)
  const initGameWithLongerTimeout = async () => {
    try {
      const refs = await waitForRefs(5000, 'canvas', 'scene');
      console.log('All refs ready with 5s timeout:', refs);
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.error('Refs took too long to mount (>5s)');
      } else {
        console.error('Unexpected error:', error);
      }
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
      <button onClick={initCanvas}>Initialize Canvas (1s timeout)</button>
      <button onClick={initGame}>Initialize Game (1s timeout)</button>
      <button onClick={initGameWithLongerTimeout}>Initialize Game (5s timeout)</button>
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
| `mountTimeout` | Maximum time to wait for ref mounting | Adjust based on complexity (default: 1000ms) |
| `validator` | Type and validity checking | Critical for type safety |
| `cleanup` | Custom cleanup function | Complex objects needing disposal |
| `initialMetadata` | Additional ref metadata | Debugging and tracking |

### Timeout Configuration

The refs system now includes automatic timeout protection for all `waitForRefs` operations:

- **Default Timeout**: 1000ms (1 second) when no timeout is specified
- **Custom Timeout**: First parameter when using `waitForRefs(timeout, ...refNames)`
- **Per-Ref Timeout**: Configure individual timeouts in RefDefinitions

```typescript
// Example timeout configurations
const refs = createRefContext('AppRefs', {
  quickButton: {
    name: 'quickButton',
    mountTimeout: 500  // Fast mounting expected
  },
  complexEngine: {
    name: 'complexEngine', 
    mountTimeout: 10000  // Allow longer initialization
  }
});

// Usage examples
await waitForRefs('quickButton');           // Uses 1s default timeout
await waitForRefs(3000, 'complexEngine');   // Uses 3s custom timeout
await waitForRefs('quickButton', 'complexEngine'); // Both use 1s default
```

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

RefContext enables high-performance mouse tracking with zero React re-renders through direct DOM manipulation.

### Key Concept

```typescript
import { createRefContext } from '@context-action/react';

// 1. Create RefContext for DOM elements
const {
  Provider: MouseRefsProvider,
  useRefHandler: useMouseRef
} = createRefContext<{
  cursor: HTMLDivElement;
  container: HTMLDivElement;
}>('MouseRefs');

// 2. Custom hook for direct DOM updates
function useMouseTracking() {
  const cursor = useMouseRef('cursor');
  
  const updatePosition = useCallback((x: number, y: number) => {
    // ✅ Direct DOM manipulation - zero React re-renders
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [cursor]);
  
  return { updatePosition };
}

// 3. Component with mouse tracking
function MouseTracker() {
  const { updatePosition } = useMouseTracking();
  const cursor = useMouseRef('cursor');
  const container = useMouseRef('container');
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.target?.getBoundingClientRect();
      if (rect) {
        updatePosition(e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    
    container.target?.addEventListener('mousemove', handleMouseMove);
    return () => container.target?.removeEventListener('mousemove', handleMouseMove);
  }, [container, updatePosition]);
  
  return (
    <div ref={container.ref} style={{ position: 'relative', width: '100%', height: '400px' }}>
      <div 
        ref={cursor.ref}
        style={{
          position: 'absolute',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'red',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}

// 4. App with provider
function App() {
  return (
    <MouseRefsProvider>
      <MouseTracker />
    </MouseRefsProvider>
  );
}
```

### Performance Benefits

- **Zero re-renders**: Direct DOM updates bypass React reconciliation
- **60fps tracking**: Smooth mouse movement without frame drops
- **Memory efficient**: No state updates, no component re-renders

### Use Cases

- Mouse/touch tracking interfaces
- Canvas/WebGL interactions
- High-frequency animation controls
- Real-time visual feedback

> **💡 Tip:** For more complex examples with visual effects, animations, and advanced patterns, see the [example application](../../../example/src/pages/performance/mouse-events/).

---

## Complete Example: Game Component

RefContext simplifies complex object lifecycle management in games and 3D applications.

### Key Pattern

```typescript
import { createRefContext } from '@context-action/react/refs';
import * as THREE from 'three';

// 1. Create RefContext with cleanup configuration
const {
  Provider: GameRefsProvider,
  useRefHandler: useGameRef,
  waitForRefs: waitForGameRefs
} = createRefContext('GameRefs', {
  canvas: {
    name: 'canvas',
    validator: (el): el is HTMLCanvasElement => el instanceof HTMLCanvasElement
  },
  
  renderer: {
    name: 'renderer',
    autoCleanup: true,
    cleanup: (renderer) => renderer.dispose()
  },
  
  scene: {
    name: 'scene',
    autoCleanup: true,
    cleanup: (scene) => {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      scene.clear();
    }
  }
});

// 2. Game initialization hook
function useGameSetup() {
  const canvas = useGameRef('canvas');
  const renderer = useGameRef('renderer');
  const scene = useGameRef('scene');
  
  useEffect(() => {
    (async () => {
      // Wait for canvas to be ready
      await waitForGameRefs('canvas');
      
      // Initialize Three.js
      const threeRenderer = new THREE.WebGLRenderer({ canvas: canvas.target! });
      const threeScene = new THREE.Scene();
      
      // Add objects to scene
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      threeScene.add(cube);
      
      // Store in refs
      renderer.setTarget(threeRenderer);
      scene.setTarget(threeScene);
      
      // Start render loop
      const animate = () => {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        threeRenderer.render(threeScene, camera);
      };
      animate();
    })();
  }, [canvas, renderer, scene]);
}

// 3. Game component
function GameComponent() {
  const canvas = useGameRef('canvas');
  useGameSetup();
  
  return <canvas ref={canvas.ref} width={800} height={600} />;
}

// 4. App with provider
function App() {
  return (
    <GameRefsProvider>
      <GameComponent />
    </GameRefsProvider>
  );
}
```

### Cleanup Benefits

- **Automatic disposal**: `autoCleanup: true` handles Three.js cleanup
- **Memory leak prevention**: Custom cleanup functions for complex objects
- **Predictable lifecycle**: Cleanup runs on unmount or ref change

### Advanced Patterns

```typescript
// Multiple game objects with cleanup
const gameRefs = createRefContext('GameRefs', {
  enemies: {
    name: 'enemies',
    autoCleanup: true,
    cleanup: (enemies) => enemies.forEach(e => e.destroy())
  },
  
  particles: {
    name: 'particles',
    autoCleanup: true,
    cleanup: (system) => system.dispose()
  }
});
```

> **💡 Tip:** For complete game implementations with physics, audio, and advanced rendering, see the [Canvas Integration example](../../../example/src/pages/integrations/advanced/CanvasPage.tsx).



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
} = createStoreContext('App', {
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

## waitForRefs Blocking vs Non-blocking Patterns

`waitForRefs` itself is Promise-based and asynchronous, so when used correctly it doesn't block the UI. Problems arise when developers incorrectly try to handle it synchronously.

### ❌ Incorrect Usage (UI Blocking)

```typescript
// Anti-pattern: busy waiting blocks UI
const handleClick = () => {
  let isComplete = false;
  let result = null;
  
  waitForRefs(5000, 'element').then(refs => {
    isComplete = true;
    result = refs;
  });
  
  // DON'T DO THIS: CPU-intensive loop blocks UI
  const startTime = Date.now();
  while (!isComplete && Date.now() - startTime < 6000) {
    // Empty loop - UI freezes!
  }
};
```

### ✅ Correct Usage (Non-blocking)

```typescript
// Recommended: async/await for asynchronous handling
const handleClick = async () => {
  try {
    const refs = await waitForRefs(10000, 'element');
    // Maintains UI responsiveness during processing
    refs.element.style.backgroundColor = '#10b981';
  } catch (error) {
    console.error('Timeout:', error);
  }
};
```

**Key Points:**
- `waitForRefs` internally uses `Promise.race` and asynchronous processing
- Proper `async/await` patterns maintain UI responsiveness
- Only avoid synchronous handling attempts (`while` loops, etc.)
- Promise-based design doesn't block the event loop

## Memoization and Lazy Evaluation

RefContext properties (`isMounted`, `isWaitingForMount`, `target`) use **lazy evaluation** to always return the latest state. This works correctly even when used with React's memoization patterns.

```tsx
function MemoizationTestComponent() {
  const element = useDemoRef('element');
  
  // Empty deps array but always returns latest values
  const memoizedCheck = useCallback(() => {
    return {
      isMounted: element.isMounted,       // Always latest state
      isWaiting: element.isWaitingForMount, // Always latest state  
      hasTarget: !!element.target         // Always latest state
    };
  }, []); // Empty deps - function itself never recreated
  
  // useMemo captured object vs direct access test
  const capturedElement = useMemo(() => element, []); // Captured at first render
  
  const testCapturedVsDirect = useCallback(() => {
    console.log('Direct access:', element.isMounted);
    console.log('Captured object:', capturedElement.isMounted); // Same value!
    // Both return the same value (thanks to lazy evaluation)
  }, [element, capturedElement]);
  
  return (
    <div>
      <div ref={element.setRef}>Test Element</div>
      <button onClick={testCapturedVsDirect}>
        Test Memoization
      </button>
    </div>
  );
}
```

**Key Principles:**
- RefContext properties are implemented as **getter functions**
- Values are computed at access time, not storage time
- Memoized functions always receive the latest values  
- No need to include ref objects in React dependency arrays

```tsx
// ✅ Correct usage - empty deps array still guarantees latest values
const checkMount = useCallback(() => {
  return element.isMounted; // Always latest state
}, []);

// ❌ Unnecessary pattern - no need to include element in deps
const checkMount = useCallback(() => {
  return element.isMounted;
}, [element]); // element object never changes, so unnecessary
```

**Practical Usage Example:**
```tsx
function OptimizedInteraction() {
  const button = useMouseRef('button');
  
  // Performance-optimized event handler (memoization + lazy evaluation)
  const handleClick = useCallback(() => {
    // Check mount status at click time (always latest)
    if (button.isMounted && button.target) {
      button.target.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        // Check mount status at timer execution time (always latest)
        if (button.isMounted && button.target) {
          button.target.style.transform = '';
        }
      }, 150);
    }
  }, []); // Empty deps array for performance optimization
  
  return <button ref={button.setRef} onClick={handleClick}>
    Click Me
  </button>;
}
```

## Related Patterns

### High-Performance UI with RefContext

For applications requiring high-frequency updates (animations, real-time graphics), RefContext can be combined with selective subscription patterns to achieve zero React re-renders:

```tsx
// High-performance canvas control with RefContext
function useCanvasControl() {
  const canvasRef = useGameRef('canvas');
  
  // Direct DOM manipulation (60fps, no React re-renders)
  const updateCanvas = useCallback((x: number, y: number) => {
    if (canvasRef.isMounted && canvasRef.target) {
      // Direct style updates bypass React
      canvasRef.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, []);
  
  return { updateCanvas, canvasRef };
}
```

For detailed performance optimization strategies, see [Selective Subscription Patterns](./selective-subscription-patterns.md).

### RefContext with Store Integration

RefContext works seamlessly with Context-Action stores for hybrid reactive/non-reactive architectures:

```tsx
// Store for data persistence, RefContext for visual updates
function useHybridPattern() {
  const storeData = useStoreDataAccess(); // Non-reactive store access
  const elementRef = useGameRef('element');
  
  const handleUpdate = useCallback((newValue: number) => {
    // Store update (data persistence)
    storeData.updateValue(newValue);
    
    // RefContext update (visual feedback)
    if (elementRef.isMounted && elementRef.target) {
      elementRef.target.style.opacity = String(newValue / 100);
    }
  }, [storeData, elementRef]);
  
  return { handleUpdate };
}
```

## Further Reading

- [Selective Subscription Patterns](./selective-subscription-patterns.md) - Performance optimization strategies
- [Pattern Guide](./pattern-guide.md) - Context-Action architectural patterns
- [Performance Issues Troubleshooting](../troubleshooting/performance-issues.md#selective-subscription-patterns) - Debugging performance problems
- [MVVM Architecture](./mvvm-core-architecture.md) - Overall architectural context

The React Refs Management System provides a powerful, type-safe, and lifecycle-aware approach to managing references in React applications, with seamless integration into the Context-Action framework's architecture patterns.