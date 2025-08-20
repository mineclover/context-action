# Getting Started

Context-Action provides three main patterns for building scalable React applications with perfect separation of concerns.

## Quick Start

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createDeclarativeStorePattern` | Pure state management, data layers |
| **🔧 Ref Context** | Direct DOM manipulation with zero re-renders | `createRefContext` | High-performance UI, animations, real-time interactions |

## 🎯 Action Only Pattern

Pure action dispatching without state management.

### Basic Usage
```tsx
import { createActionContext } from '@context-action/react';

// 1. Define Actions
interface EventActions {
  userClick: { x: number; y: number };
  analytics: { event: string; data: any };
}

// 2. Create Context
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

// 3. Provider Setup
function App() {
  return (
    <EventActionProvider>
      <InteractiveComponent />
    </EventActionProvider>
  );
}

// 4. Component Usage
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  useEventActionHandler('userClick', (payload) => {
    console.log('User clicked at:', payload.x, payload.y);
  });
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}
```

## 🏪 Store Only Pattern

Type-safe state management without action dispatching.

### Basic Usage
```tsx
import { createDeclarativeStorePattern } from '@context-action/react';

// 1. Create Pattern
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light' } }
});

// 2. Provider Setup
function App() {
  return (
    <AppStoreProvider>
      <UserComponent />
    </AppStoreProvider>
  );
}

// 3. Component Usage
function UserComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  const { updateStore } = useAppStoreManager();
  
  const updateUser = (newUser: any) => {
    updateStore('user', newUser);
  };
  
  return (
    <div>
      <p>User: {user.name}</p>
      <button onClick={() => updateUser({ name: 'John', email: 'john@example.com' })}>
        Update User
      </button>
    </div>
  );
}
```

## 🔧 Ref Context Pattern

High-performance direct DOM manipulation with zero React re-renders.

### Basic Usage
```tsx
import React, { useCallback } from 'react';
import { createRefContext } from '@context-action/react';

// 1. Define Ref Structure
type MouseRefs = {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  container: HTMLDivElement;
};

// 2. Create RefContext
const {
  Provider: MouseProvider,
  useRefHandler: useMouseRef
} = createRefContext<MouseRefs>('Mouse');

// 3. Provider Setup
function App() {
  return (
    <MouseProvider>
      <MouseTracker />
    </MouseProvider>
  );
}

// 4. Component with Direct DOM Manipulation
function MouseTracker() {
  const cursor = useMouseRef('cursor');
  const trail = useMouseRef('trail');
  const container = useMouseRef('container');
  
  // Direct DOM manipulation - zero React re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !container.target) return;
    
    const rect = container.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Hardware accelerated transforms
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    
    // Add trail effect with DOM manipulation
    if (trail.target) {
      trail.target.style.transform = `translate3d(${x-5}px, ${y-5}px, 0)`;
      trail.target.style.opacity = '0.7';
    }
  }, [cursor, trail, container]);
  
  return (
    <div 
      ref={container.setRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-96 bg-gray-100"
    >
      {/* Cursor element */}
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      
      {/* Trail element */}
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)', opacity: 0 }}
      />
    </div>
  );
}
```

### Advanced RefContext with Business Logic
```tsx
// Custom hook for mouse position management
function useMousePositionUpdater() {
  const cursor = useMouseRef('cursor');
  const positionHistory = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);
  
  const updatePosition = useCallback((x: number, y: number) => {
    // Direct DOM manipulation
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    
    // Business logic - track position history
    positionHistory.current.push({ x, y, timestamp: Date.now() });
    
    // Keep only last 50 positions
    if (positionHistory.current.length > 50) {
      positionHistory.current.shift();
    }
  }, [cursor]);
  
  const getVelocity = useCallback(() => {
    const history = positionHistory.current;
    if (history.length < 2) return 0;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const distance = Math.sqrt(
      (latest.x - previous.x) ** 2 + (latest.y - previous.y) ** 2
    );
    const timeDiff = latest.timestamp - previous.timestamp;
    
    return distance / timeDiff;
  }, []);
  
  return { updatePosition, getVelocity };
}
```

## Pattern Composition

For complex applications, combine all three patterns:

```tsx
function ComplexApp() {
  return (
    <AppStoreProvider>
      <EventActionProvider>
        <MouseProvider>
          <MyComponent />
        </MouseProvider>
      </EventActionProvider>
    </AppStoreProvider>
  );
}
```

## Next Steps

- [React Refs Guide](../concept/react-refs-guide.md) - Deep dive into RefContext patterns
- [Pattern Guide](../concept/pattern-guide.md) - Compare all three patterns with examples
- [Action Pipeline](./action-pipeline.md) - Learn about action processing
- [Architecture](./architecture.md) - Understand the overall architecture
- [Hooks](./hooks.md) - Explore available React hooks
- [Best Practices](./best-practices.md) - Follow recommended patterns

## Real-World Examples

- **Mouse Events with RefContext**: See the RefContext mouse events demo in our example app
- **Store Integration**: Learn how to combine stores with action handlers
- **Performance Optimization**: Discover zero re-render patterns with direct DOM manipulation