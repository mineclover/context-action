# @context-action/react Pattern Guide

Complete guide to the two main patterns available in @context-action/react framework.

## 📋 Quick Start Guide

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createDeclarativeStorePattern` | Pure state management, data layers |

**Note**: For complex applications needing both actions and state, compose Action Only + Store Only patterns together.

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

// 2. Create stores with explicit types and simplified initialValue
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern<AppStoreTypes>('App', {
  // Types inferred from AppStoreTypes interface
  counter: 0,
  userName: '',
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

## 🔧 Pattern Composition

For complex applications that need both actions and state management, compose the patterns:

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

// 2. Compose providers
function App() {
  return (
    <EventActionProvider>
      <AppStoreProvider>
        <ComplexComponent />
      </AppStoreProvider>
    </EventActionProvider>
  );
}

// 3. Use both patterns in components
function ComplexComponent() {
  // Actions from Action Only pattern (renamed hooks)
  const dispatch = useEventAction();
  
  // State from Store Only pattern (renamed hooks)
  const userStore = useAppStore('user');
  const counterStore = useAppStore('counter');
  
  const user = useStoreValue(userStore);
  const counter = useStoreValue(counterStore);
  
  // Action handlers that update state (renamed hook)
  useEventActionHandler('updateUser', (payload) => {
    userStore.setValue(payload);
    dispatch('analytics', { event: 'user-updated' });
  });
  
  return (
    <div>
      <div>User: {user.name}</div>
      <div>Counter: {counter}</div>
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
- **Compose patterns** for full-featured applications

### 2. Naming Conventions
- Use descriptive context names: `UserActions`, `AppStores`
- Rename exported hooks for clarity: `useUserAction`, `useAppStore`
- Keep store names simple: `user`, `counter`, `settings`

### 3. Performance
- Use `strategy: 'reference'` for large datasets
- Use `strategy: 'shallow'` for objects that change properties
- Use `strategy: 'deep'` only when necessary

### 4. Type Safety
- Use explicit interfaces for actions (ActionPayloadMap optional)
- Consider explicit generic types for better type safety
- Let TypeScript infer store types from initial values or use explicit generics
- Use `as const` for literal types in store definitions

---

## 🔍 Examples

See the `examples/` directory for complete working examples of each pattern.