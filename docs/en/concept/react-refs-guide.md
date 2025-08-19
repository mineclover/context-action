# React Refs Management Guide

This guide covers the **React Refs Management System** in the Context-Action framework - a simple and safe reference management system designed for managing DOM elements, custom objects, and complex component references with type safety and lifecycle management.

## Overview

The React Refs system provides declarative ref management with automatic cleanup, type safety, and advanced lifecycle features. It's particularly useful for:

- **DOM Element Management**: Safe access to DOM elements with proper lifecycle handling
- **Custom Object References**: Managing Three.js objects, game engines, or other complex instances  
- **Async Ref Operations**: Waiting for refs to mount and performing safe operations
- **Memory Management**: Automatic cleanup and leak prevention

## Core Concepts

### RefContext System

The refs system is built around `createRefContext()`, which provides:

- **Type Safety**: Full TypeScript support with proper type inference
- **Lifecycle Management**: Automatic mounting/unmounting detection
- **Safe Operations**: Protected ref access with error handling
- **Flexible Configuration**: Both simple and advanced configuration options

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
    objectType: 'dom' as const,
    autoCleanup: true
  },
  scene: {
    name: 'scene', 
    objectType: 'custom' as const,
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
const canvas = GameRefs.useRef('canvas'); // Domain unclear

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
    objectType: 'dom',
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
    objectType: 'dom',
    autoCleanup: true,
    mountTimeout: 2000,
    validator: (el): el is HTMLInputElement => 
      el instanceof HTMLInputElement && el.type === 'email'
  },
  
  // Loose management for general elements
  infoDiv: {
    name: 'infoDiv', 
    objectType: 'dom',
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
    objectType: 'custom',
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
    objectType: 'three',
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
    objectType: 'custom',
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
| `objectType` | Object classification | `'dom'`, `'custom'`, `'three'`, etc. |

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
    objectType: 'dom',
    autoCleanup: true,
    validator: (el): el is HTMLCanvasElement => 
      el instanceof HTMLCanvasElement
  },
  
  scene: {
    name: 'scene',
    objectType: 'three',
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
    objectType: 'three',
    autoCleanup: true,
    cleanup: (renderer) => {
      renderer.dispose();
    }
  },
  
  gameState: {
    name: 'gameState',
    objectType: 'custom',
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
    objectType: 'custom',
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
    objectType: 'dom',
    mountTimeout: 1000
  },
  
  // Longer timeout for complex initialization
  gameEngine: {
    name: 'gameEngine', 
    objectType: 'custom',
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
    objectType: 'custom',
    autoCleanup: true
  },
  
  // Custom cleanup for complex objects
  complexResource: {
    name: 'complexResource',
    objectType: 'custom', 
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