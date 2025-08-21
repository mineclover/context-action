# Ref Basic Usage

Fundamental RefContext pattern with type-safe ref management and zero re-renders.

## Import
```typescript
import { createRefContext } from '@context-action/react';
```

## Features
- ✅ Zero React re-renders for DOM manipulation
- ✅ Hardware-accelerated transforms
- ✅ Type-safe ref management
- ✅ Automatic lifecycle management
- ✅ Perfect separation of concerns
- ✅ Memory efficient with automatic cleanup

## Setup Pattern

### Basic Setup

```typescript
import { createRefContext } from '@context-action/react';

type AppRefs = {
  targetElement: HTMLDivElement;
  inputElement: HTMLInputElement;
  modalElement: HTMLDialogElement;
};

const {
  Provider: RefProvider,
  useRefHandler: useAppRef,
  useWaitForRefs
} = createRefContext<AppRefs>('App');
```

### Provider Integration

```typescript
function App() {
  return (
    <RefProvider>
      <YourComponents />
    </RefProvider>
  );
}
```

### Ref Registration

```typescript
function MyComponent() {
  const targetRef = useAppRef('targetElement');
  
  return <div ref={targetRef.setRef}>Target Element</div>;
}
```

## Basic Usage Example

```tsx
// 1. Define ref types
type MouseRefs = {
  cursor: HTMLDivElement;
  container: HTMLDivElement;
  trail: HTMLDivElement;
};

// 2. Create RefContext with renaming pattern
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');

// 3. Provider setup
function App() {
  return (
    <MouseProvider>
      <MouseTracker />
    </MouseProvider>
  );
}

// 4. Component with direct DOM manipulation
function MouseTracker() {
  const cursor = useMouseRef('cursor');
  const container = useMouseRef('container');
  const trail = useMouseRef('trail');
  
  // Direct DOM manipulation - zero React re-renders!
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Hardware accelerated transforms
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
  }, [cursor, container, trail]);
  
  return (
    <div
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-96 bg-gray-100 overflow-hidden"
    >
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

## Custom Hooks Pattern

```tsx
// Custom hook for business logic separation
function useMouseUpdater() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const positionHistory = useRef<Array<{x: number, y: number}>>([]);
  
  const updatePosition = useCallback((x: number, y: number) => {
    // Direct DOM manipulation
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
    
    // Business logic - track position history
    positionHistory.current.push({ x, y });
    if (positionHistory.current.length > 100) {
      positionHistory.current.shift();
    }
  }, [cursor, trail]);
  
  const getVelocity = useCallback(() => {
    const history = positionHistory.current;
    if (history.length < 2) return 0;
    
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    return Math.sqrt((current.x - previous.x) ** 2 + (current.y - previous.y) ** 2);
  }, []);
  
  return { updatePosition, getVelocity };
}

// Usage in component
function AdvancedMouseTracker() {
  const { updatePosition, getVelocity } = useMouseUpdater();
  const container = useMouseRef('container');
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updatePosition(x, y);
    
    // Log velocity without triggering re-renders
    console.log('Mouse velocity:', getVelocity());
  }, [container, updatePosition, getVelocity]);
  
  return (
    <div
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50"
    />
  );
}
```

## Available Hooks
- `useRefHandler(name)` - Get typed ref handler by name
- `useWaitForRefs()` - Wait for multiple refs to mount
- `useGetAllRefs()` - Access all mounted refs
- `refHandler.setRef` - Set ref callback
- `refHandler.target` - Access current ref value
- `refHandler.isMounted` - Check mount status
- `refHandler.waitForMount()` - Async ref waiting
- `refHandler.withTarget()` - Safe operations

## Real-World Examples

### Live Examples in Codebase
- **[RefContext Mouse Events Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/RefContextMouseEventsPage.tsx)** - Complete mouse tracking with RefContext
- **[Canvas Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/CanvasRefDemoPage.tsx)** - Canvas drawing with direct DOM manipulation
- **[Form Builder Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/FormBuilderRefDemoPage.tsx)** - Dynamic form builder with refs
- **[Element Management Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/ElementManagementPage.tsx)** - Complex element management
- **[Visual Effects Context](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/VisualEffectsRefContext.tsx)** - Visual effects with RefContext
- **[Performance Context](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/PerformanceRefContext.tsx)** - Performance monitoring with refs

## Best Practices

1. **Hardware Acceleration**: Use `translate3d()` for GPU-accelerated animations
2. **Avoid React Re-renders**: Keep DOM manipulation outside React's render cycle
3. **Separation of Concerns**: Use custom hooks for business logic
4. **Type Safety**: Define clear ref type interfaces with proper HTML element types
5. **Performance First**: Prioritize 60fps performance over convenience