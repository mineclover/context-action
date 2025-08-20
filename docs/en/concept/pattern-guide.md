# @context-action/react Pattern Guide

Complete guide to the three main patterns available in @context-action/react framework.

## 📋 Quick Start Guide

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createDeclarativeStorePattern` | Pure state management, data layers |
| **🔧 Ref Context** | Direct DOM manipulation with zero re-renders | `createRefContext` | High-performance UI, animations, real-time interactions |

**Note**: For complex applications, compose patterns together for maximum flexibility and separation of concerns.

---

## 🎯 Action Only Pattern

**When to use**: Pure action dispatching without state management (event systems, command patterns).

### Import
```typescript
import { createActionContext } from '@context-action/react';
```

### Features
- ✅ Type-safe action dispatching
- ✅ Action handler registration
- ✅ Abort support
- ✅ Result handling
- ✅ Lightweight (no store overhead)

### Basic Usage
```tsx
// 1. Define Actions (ActionPayloadMap optional)
interface EventActions {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
}

// 2. Create Context with Renaming Pattern
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

// 4. Component Usage with Renamed Hooks  
function InteractiveComponent() {
  const dispatch = useEventAction();
  
  // Register action handlers with renamed hook
  useEventActionHandler('userClick', (payload, controller) => {
    console.log('User clicked at:', payload.x, payload.y);
    // Pure side effects, no state management
  });
  
  useEventActionHandler('analytics', async (payload) => {
    await fetch('/analytics', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  });
  
  const handleClick = (e: MouseEvent) => {
    dispatch('userClick', { x: e.clientX, y: e.clientY });
    dispatch('analytics', { event: 'click', data: { timestamp: Date.now() } });
  };
  
  return <button onClick={handleClick}>Click Me</button>;
}
```

### Advanced Features
```tsx
// Use the renamed context hooks for advanced features
const { useActionDispatchWithResult: useEventActionWithResult } = createActionContext<EventActions>('Events');

function AdvancedComponent() {
  const { 
    dispatch, 
    dispatchWithResult, 
    abortAll 
  } = useEventActionWithResult();
  
  const handleAsyncAction = async () => {
    try {
      const result = await dispatchWithResult('analytics', {
        event: 'complex-operation',
        data: { userId: 123 }
      });
      console.log('Action result:', result);
    } catch (error) {
      console.error('Action failed:', error);
    }
  };
  
  const handleAbortAll = () => {
    abortAll(); // Abort all pending actions
  };
  
  return (
    <div>
      <button onClick={handleAsyncAction}>Async Action</button>
      <button onClick={handleAbortAll}>Abort All</button>
    </div>
  );
}
```

### Available Hooks
- `useActionDispatch()` - Basic action dispatcher
- `useActionHandler(action, handler, config?)` - Register action handlers
- `useActionDispatchWithResult()` - Advanced dispatcher with results/abort
- `useActionRegister()` - Access raw ActionRegister
- `useActionContext()` - Access raw context

---

## 🏪 Store Only Pattern (Recommended)

**When to use**: Pure state management without action dispatching (data layers, simple state).

**Key Features**: 
- ✅ Excellent type inference without manual type annotations
- ✅ Simplified API focused on store management
- ✅ Direct value or configuration object support
- ✅ No need for separate `createStore` calls

### Import
```typescript
import { createDeclarativeStorePattern } from '@context-action/react';
```

### Basic Usage

#### Option 1: Type Inference (Current)
```tsx
// 1. Define stores with renaming pattern for type-safe access
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  // Simple direct values - cleanest syntax
  counter: 0,
  userName: '',
  isLoggedIn: false,
  
  // With configuration for complex types
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow',
    description: 'User profile data'
  },
  
  // Nested structures with type safety
  settings: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      language: 'en',
      notifications: true
    },
    strategy: 'shallow'
  }
});
```

#### Option 2: Explicit Generic Types (New)
```tsx
// 1. Define store types explicitly
interface AppStoreTypes {
  counter: number;
  userName: string;
  isLoggedIn: boolean;
  user: { id: string; name: string; email: string };
  settings: { theme: 'light' | 'dark'; language: string; notifications: boolean };
}

// 2. Create stores with explicit types - still requires InitialStores<T> structure
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern<AppStoreTypes>('App', {
  // Types validated against AppStoreTypes interface
  counter: 0,  // Must match AppStoreTypes['counter'] = number
  userName: '', // Must match AppStoreTypes['userName'] = string
  isLoggedIn: false,
  
  // Complex types with configuration
  user: { id: '', name: '', email: '' },
  settings: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    strategy: 'shallow'
  }
});

// 2. Provider Setup (minimal boilerplate)
function App() {
  return (
    <AppStoreProvider>
      <UserProfile />
      <Settings />
    </AppStoreProvider>
  );
}

// 3. Component Usage with Excellent Type Inference
function UserProfile() {
  // Perfect type inference - no manual type annotations needed!
  const counterStore = useAppStore('counter');      // Store<number>
  const userStore = useAppStore('user');           // Store<{id: string, name: string, email: string}>
  const settingsStore = useAppStore('settings');   // Store<{theme: 'light' | 'dark', language: string, notifications: boolean}>
  
  // Subscribe to values
  const counter = useStoreValue(counterStore);
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  const incrementCounter = () => {
    counterStore.setValue(counter + 1);
  };
  
  const updateUser = () => {
    userStore.setValue({
      ...user,
      name: 'John Doe',
      email: 'john@example.com'
    });
  };
  
  const toggleTheme = () => {
    settingsStore.setValue({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light'
    });
  };
  
  return (
    <div data-theme={settings.theme}>
      <div>Counter: {counter}</div>
      <div>User: {user.name} ({user.email})</div>
      <div>Theme: {settings.theme}</div>
      
      <button onClick={incrementCounter}>+1</button>
      <button onClick={updateUser}>Update User</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### HOC Pattern (Advanced)
```tsx
// Get withProvider from the renamed context
const { withProvider: withAppStoreProvider } = createDeclarativeStorePattern('App', {...});

// Automatic Provider wrapping with HOC
const AppWithStores = withAppStoreProvider(App);

// With custom registry ID
const AppWithCustomStores = withAppStoreProvider(App, {
  registryId: 'custom-app-stores'
});

// Use anywhere without manual Provider wrapping
function Root() {
  return <AppWithStores />;
}
```

### Advanced Configuration
```tsx
// Advanced store configuration with renaming pattern
const {
  Provider: AdvancedStoreProvider,
  useStore: useAdvancedStore,
  useStoreManager: useAdvancedStoreManager
} = createDeclarativeStorePattern('Advanced', {
  // Performance-optimized store
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference',  // Reference equality for performance
    debug: true,           // Enable debug logging
    tags: ['performance', 'data'],
    version: '1.0.0',
    description: 'Large dataset with reference equality'
  },
  
  // Deep comparison store
  complexObject: {
    initialValue: { nested: { deep: { value: 0 } } },
    strategy: 'deep',      // Deep comparison for nested changes
    comparisonOptions: {
      ignoreKeys: ['timestamp'],  // Ignore specific keys
      maxDepth: 5                 // Limit comparison depth
    }
  },
  
  // Custom comparison
  customStore: {
    initialValue: new Map(),
    comparisonOptions: {
      customComparator: (oldValue, newValue) => {
        // Custom comparison logic
        return oldValue.size === newValue.size;
      }
    }
  }
});
```

### Available Hooks
- `useStore(name)` - Get typed store by name (primary API)
- `useStoreManager()` - Access store manager (advanced use)
- `useStoreInfo()` - Get registry information
- `useStoreClear()` - Clear all stores

---

## 🔧 Ref Context Pattern

**When to use**: Direct DOM manipulation with zero React re-renders (high-performance UI, animations, real-time interactions).

### Import
```typescript
import { createRefContext } from '@context-action/react';
```

### Features
- ✅ Zero React re-renders for DOM manipulation
- ✅ Hardware-accelerated transforms
- ✅ Type-safe ref management
- ✅ Automatic lifecycle management
- ✅ Perfect separation of concerns
- ✅ Memory efficient with automatic cleanup

### Basic Usage
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

### Advanced RefContext with Custom Hooks
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

### Multi-RefContext Architecture
```tsx
// Separate concerns with multiple RefContexts
const {
  Provider: VisualEffectsProvider,
  useRefHandler: useVisualEffectsRef
} = createRefContext<{
  clickEffects: HTMLDivElement;
  pathSvg: SVGSVGElement;
}>('VisualEffects');

const {
  Provider: PerformanceProvider,
  useRefHandler: usePerformanceRef
} = createRefContext<{
  fpsDisplay: HTMLDivElement;
  metricsPanel: HTMLDivElement;
}>('Performance');

// Compose multiple RefContexts
function ComplexMouseApp() {
  return (
    <MouseProvider>
      <VisualEffectsProvider>
        <PerformanceProvider>
          <MouseTracker />
          <VisualEffects />
          <PerformanceMetrics />
        </PerformanceProvider>
      </VisualEffectsProvider>
    </MouseProvider>
  );
}
```

### Available Hooks
- `useRefHandler(name)` - Get typed ref handler by name
- `useWaitForRefs()` - Wait for multiple refs to mount
- `useGetAllRefs()` - Access all mounted refs
- `refHandler.setRef` - Set ref callback
- `refHandler.target` - Access current ref value
- `refHandler.isMounted` - Check mount status
- `refHandler.waitForMount()` - Async ref waiting
- `refHandler.withTarget()` - Safe operations

---

## 🔧 Pattern Composition

For complex applications, compose all three patterns for maximum flexibility:

```tsx
// 1. Create separate contexts with renaming patterns
const { 
  Provider: EventActionProvider, 
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { id: '', name: '' },
  counter: 0
});

const {
  Provider: UIRefsProvider,
  useRefHandler: useUIRef
} = createRefContext<{
  cursor: HTMLDivElement;
  notification: HTMLDivElement;
  modal: HTMLDivElement;
}>('UIRefs');

// 2. Compose all three patterns
function App() {
  return (
    <EventActionProvider>
      <AppStoreProvider>
        <UIRefsProvider>
          <ComplexComponent />
        </UIRefsProvider>
      </AppStoreProvider>
    </EventActionProvider>
  );
}

// 3. Use all three patterns in components
function ComplexComponent() {
  // Actions from Action Only pattern
  const dispatch = useEventAction();
  
  // State from Store Only pattern
  const userStore = useAppStore('user');
  const counterStore = useAppStore('counter');
  
  // Refs from RefContext pattern
  const cursor = useUIRef('cursor');
  const notification = useUIRef('notification');
  
  const user = useStoreValue(userStore);
  const counter = useStoreValue(counterStore);
  
  // Action handlers that update state and manipulate DOM
  useEventActionHandler('updateUser', (payload) => {
    // Update store
    userStore.setValue(payload);
    
    // Show notification with direct DOM manipulation
    if (notification.target) {
      notification.target.textContent = `User ${payload.name} updated!`;
      notification.target.style.display = 'block';
      notification.target.style.opacity = '1';
      
      setTimeout(() => {
        if (notification.target) {
          notification.target.style.opacity = '0';
          setTimeout(() => {
            if (notification.target) {
              notification.target.style.display = 'none';
            }
          }, 300);
        }
      }, 2000);
    }
    
    // Dispatch analytics
    dispatch('analytics', { event: 'user-updated' });
  });
  
  // Mouse events with direct DOM manipulation
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (cursor.target) {
      cursor.target.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }
  }, [cursor]);
  
  return (
    <div onMouseMove={handleMouseMove}>
      <div>User: {user.name}</div>
      <div>Counter: {counter}</div>
      
      {/* Direct DOM manipulation elements */}
      <div
        ref={cursor.setRef}
        className="fixed w-4 h-4 bg-blue-500 rounded-full pointer-events-none z-50"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      
      <div
        ref={notification.setRef}
        className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg"
        style={{ display: 'none', opacity: 0, transition: 'opacity 300ms' }}
      />
    </div>
  );
}
```

---

## 🎯 Migration Guide

### From Legacy Action Context Pattern

If you were using the removed `createActionContextPattern`, migrate to pattern composition:

```tsx
// ❌ Old (removed)
// const UserContext = createActionContextPattern<UserActions>('User');

// ✅ New (compose patterns with renaming)
const { 
  Provider: UserActionProvider, 
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('UserStores', {
  profile: { id: '', name: '', email: '' },
  preferences: { theme: 'light' as const }
});

// Compose providers
function App() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserComponent />
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

---

## 📚 Best Practices

### 1. Pattern Selection
- **Start with Store Only** for simple state management
- **Add Action Only** when you need side effects or complex workflows
- **Add RefContext** when you need high-performance DOM manipulation
- **Compose all three patterns** for full-featured applications

### 2. Naming Conventions
- Use descriptive context names: `UserActions`, `AppStores`, `MouseRefs`
- Rename exported hooks for clarity: `useUserAction`, `useAppStore`, `useMouseRef`
- Keep store names simple: `user`, `counter`, `settings`
- Use domain-specific ref names: `cursor`, `modal`, `canvas`

### 3. Performance
- **Store Pattern**: Use `strategy: 'reference'` for large datasets, `'shallow'` for objects, `'deep'` only when necessary
- **RefContext Pattern**: Use `translate3d()` for hardware acceleration, batch DOM updates, avoid React re-renders
- **Action Pattern**: Keep handlers lightweight, use async for heavy operations

### 4. Type Safety
- **Actions**: Use explicit interfaces for actions (ActionPayloadMap optional)
- **Stores**: Let TypeScript infer store types or use explicit generics
- **Refs**: Define clear ref type interfaces with proper HTML element types
- Use `as const` for literal types in all patterns

### 5. Separation of Concerns
- **Actions**: Handle side effects, business logic, and coordination
- **Stores**: Manage application state and data
- **RefContext**: Handle DOM manipulation and performance-critical UI
- Keep each pattern focused on its specific responsibility

---

## 🔍 Examples

See the `examples/` directory for complete working examples of each pattern.