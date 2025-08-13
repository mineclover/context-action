# @context-action/react Pattern Guide

Complete guide to the three main patterns available in @context-action/react framework.

## 📋 Quick Start Guide

Choose the right pattern for your use case:

| Pattern | Use Case | Import | Best For |
|---------|----------|--------|----------|
| **🚀 Action Context** | Unified action + store management | `createActionContextPattern` | Most applications, full-stack state management |
| **🎯 Action Only** | Action dispatching without stores | `createActionContext` | Event systems, command patterns |
| **🏪 Store Only** | State management without actions | `createDeclarativeStorePattern` | Pure state management, data layers |

---

## 🚀 Action Context Pattern (Recommended)

**When to use**: Most applications that need both actions and state management.

### Import
```typescript
import { createActionContextPattern } from '@context-action/react';
```

### Features
- ✅ Unified action + store management
- ✅ Type-safe action handlers
- ✅ Automatic computed values
- ✅ Provider-based isolation
- ✅ HOC patterns support

### Basic Usage
```tsx
// 1. Define Actions and State
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  fetchData: { endpoint: string };
  reset: void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

// 2. Create Pattern with Renaming Convention
const {
  Provider: AppContextProvider,
  useStore: useAppStore,
  useAction: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContextPattern<AppActions>('App', {
  debug: process.env.NODE_ENV === 'development'
});

// 3. Provider Setup
function App() {
  return (
    <AppContextProvider registryId="app-main">
      <UserProfile />
    </AppContextProvider>
  );
}

// 4. Component Usage with Renamed Hooks
function UserProfile() {
  const userStore = useAppStore('user', { id: '', name: '', email: '' });
  const user = useStoreValue(userStore);
  const dispatch = useAppAction();
  
  // Action handler registration with renamed hook
  useAppActionHandler('updateUser', async (payload) => {
    userStore.setValue({ ...user, ...payload });
  });
  
  const handleUpdate = () => {
    dispatch('updateUser', { id: '1', name: 'John' });
  };
  
  return (
    <div>
      <div>User: {user.name}</div>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
```

### HOC Pattern (Advanced)
```tsx
// Get withProvider from the same context
const { withProvider: withAppProvider } = createActionContextPattern<AppActions>('App');

// Simple Provider wrapping
const AppWithProviders = withAppProvider(App, 'app-main');

// Or manual composition for custom providers
const withAppCustomProviders = (Component: React.ComponentType) => {
  return (props: any) => (
    <AppContextProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Component {...props} />
        </ErrorBoundary>
      </ThemeProvider>
    </AppContextProvider>
  );
};

const AppWithCustomProviders = withAppCustomProviders(App);
```

### Available Hooks
- `useStore(name, initialValue, config?)` - Create/access stores
- `useAction()` - Get action dispatcher
- `useActionHandler(action, handler, config?)` - Register action handlers
- `useActionRegister()` - Access raw ActionRegister
- `useStoreRegistry()` - Access raw StoreRegistry
- `useRegistryInfo()` - Get registry information
- `useRegistryActions()` - Registry management actions

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
// 1. Define Actions
interface EventActions extends ActionPayloadMap {
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
// Use the same renamed context from above
const { useActionDispatchWithResult: useEventActionWithResult } = createActionContext<EventActions>('Events');

function AdvancedComponent() {
  // Use renamed hooks for advanced features
  const useAdvancedDispatch = useEventActionWithResult;
  
  const { 
    dispatch, 
    dispatchWithResult, 
    abortAll 
  } = useAdvancedDispatch();
  
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

## 🏪 Store Only Pattern (Simplified)

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
```tsx
// 1. Define stores with automatic type inference
const AppStores = createDeclarativeStorePattern('App', {
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

// 2. Provider Setup (minimal boilerplate)
function App() {
  return (
    <AppStores.Provider>
      <UserComponent />
    </AppStores.Provider>
  );
}

// 3. Component Usage - Clean and Simple
function UserComponent() {
  // Direct store access with full type inference
  const counterStore = AppStores.useStore('counter');        // Store<number>
  const userStore = AppStores.useStore('user');             // Store<{id: string, name: string, email: string}>
  const settingsStore = AppStores.useStore('settings');     // Store<{theme: 'light' | 'dark', ...}>
  
  // Get reactive values
  const counter = useStoreValue(counterStore);
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  // Update stores
  const updateUser = () => {
    userStore.setValue({ ...user, name: 'John' });
  };
  
  const incrementCounter = () => {
    counterStore.setValue(counter + 1);
  };
  
  const toggleTheme = () => {
    settingsStore.update(s => ({
      ...s,
      theme: s.theme === 'light' ? 'dark' : 'light'
    }));
  };
  
  return (
    <div>
      <div>User: {user.name}</div>
      <div>Counter: {counter}</div>
      <div>Theme: {settings.theme}</div>
      <button onClick={updateUser}>Update User</button>
      <button onClick={incrementCounter}>Increment</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Available Hooks
- `useStore(storeName)` - Primary API for type-safe store access
- `useStoreManager()` - Advanced: Access the store manager
- `useStoreInfo()` - Get registry information
- `useStoreClear()` - Clear all stores

---

## 🎨 Alternative Usage Patterns

### Pattern 1: Semantic Destructuring

```tsx
// Clean, readable component with semantic names
function TodoApp() {
  const { 
    useStore: useTodoStore,
    useAction: dispatchTodoAction,
    useActionHandler: registerTodoHandler 
  } = createActionContextPattern<TodoActions>('Todo');
  
  const todoStore = useTodoStore('todos', []);
  const todos = useStoreValue(todoStore);
  const dispatch = dispatchTodoAction();
  
  registerTodoHandler('addTodo', (payload) => {
    const newTodos = [...todos, { id: Date.now(), ...payload }];
    todoStore.setValue(newTodos);
  });
  
  return (
    <div>
      {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
      <AddTodoForm onSubmit={(text) => dispatch('addTodo', { text })} />
    </div>
  );
}
```

### Pattern 2: Domain-Specific Hooks

```tsx
// Custom hooks for domain-specific logic
function useUserActions() {
  const { useAction, useActionHandler, useStore } = createActionContextPattern<UserActions>('User');
  
  const dispatch = useAction();
  const userStore = useStore('profile', { name: '', email: '' });
  const user = useStoreValue(userStore);
  
  useActionHandler('updateProfile', (payload) => {
    userStore.setValue({ ...user, ...payload });
  });
  
  const updateProfile = useCallback((updates: Partial<typeof user>) => {
    dispatch('updateProfile', updates);
  }, [dispatch]);
  
  return { user, updateProfile };
}

function UserProfile() {
  const { user, updateProfile } = useUserActions();
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateProfile({ name: 'Updated Name' });
    }}>
      <input value={user.name} onChange={...} />
      <button type="submit">Update</button>
    </form>
  );
}
```

### Pattern 3: Module-Style Exports

```tsx
// Export specific hooks for clean imports
export const { 
  useStore: useShoppingStore,
  useAction: useShoppingAction,
  useActionHandler: useShoppingHandler,
  Provider: ShoppingProvider 
} = createActionContextPattern<ShoppingActions>('Shopping');

// Clean usage in components
function ShoppingCart() {
  const cartStore = useShoppingStore('cart', { items: [], total: 0 });
  const cart = useStoreValue(cartStore);
  const dispatch = useShoppingAction();
  
  useShoppingHandler('addItem', (payload) => {
    const newItems = [...cart.items, payload.item];
    const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
    cartStore.setValue({ items: newItems, total: newTotal });
  });
  
  return (
    <div>
      <h2>Cart Total: ${cart.total}</h2>
      {cart.items.map(item => <CartItem key={item.id} item={item} />)}
    </div>
  );
}
```

### Pattern 4: Factory Pattern

```tsx
// Create reusable pattern factories
function createFeatureContext<T extends ActionPayloadMap>(
  name: string,
  initialStores: Record<string, any>
) {
  const {
    Provider: FeatureProvider,
    useStore: useFeatureStore,
    useAction: useFeatureAction,
    useActionHandler: useFeatureHandler,
    withProvider: withFeatureProvider
  } = createActionContextPattern<T>(name);
  
  return {
    // Renamed exports for clarity
    Provider: FeatureProvider,
    useFeatureStore,
    useFeatureAction,
    useFeatureHandler,
    // Utility functions
    createFeatureStore: (storeName: string, initial: any) => 
      useFeatureStore(storeName, initial),
    withFeatureProviders: withFeatureProvider,
  };
}

// Usage
const UserFeature = createFeatureContext<UserActions>('user', {
  profile: { name: '', email: '' },
  preferences: { theme: 'light' }
});

function UserComponent() {
  const profile = UserFeature.createFeatureStore('profile', { name: '', email: '' });
  const user = useStoreValue(profile);
  const dispatch = UserFeature.useFeatureAction();
  
  return <div>User: {user.name}</div>;
}
```

---

## 🤔 Which Pattern Should I Choose?

### Decision Tree

```
Do you need both actions AND state management?
├─ YES → 🚀 Action Context Pattern (createActionContextPattern)
│
└─ NO → Do you need actions without state?
    ├─ YES → 🎯 Action Only (createActionContext)
    │
    └─ NO → 🏪 Store Only (createDeclarativeStorePattern)
```

### Use Case Examples

**🚀 Action Context Pattern:**
- Full-featured applications
- E-commerce sites
- Dashboard applications
- Complex forms with validation
- Real-time collaborative apps

**🎯 Action Only:**
- Analytics systems
- Event tracking
- Command systems
- Pure side effect management
- Microinteraction handling

**🏪 Store Only:**
- Configuration management
- Theme/settings storage  
- Data caching layers
- Read-only data displays
- Schema-driven state management

---

## 🔧 Advanced Configuration

### Store Configuration Options
```typescript
// Using renamed hooks from created context
const { useStore: useAppStore } = createActionContextPattern<AppActions>('App');

const store = useAppStore('user', initialValue, {
  strategy: 'shallow',        // 'reference' | 'shallow' | 'deep'
  debug: true,               // Enable debug logging
  description: 'User data',  // Documentation
  tags: ['user', 'profile'], // Categorization
  version: '1.0.0',          // Version tracking
  comparisonOptions: {       // Custom comparison logic
    ignoreKeys: ['timestamp']
  }
});
```

### Action Handler Configuration
```typescript
// Using renamed hooks from created context
const { useActionHandler: useAppActionHandler } = createActionContextPattern<AppActions>('App');

useAppActionHandler('updateUser', handler, {
  id: 'user-updater',        // Unique handler ID
  priority: 10,              // Execution priority (higher = first)
  blocking: true            // Block subsequent handlers if this fails
});
```

### Provider Configuration
```typescript
const {
  Provider: AppContextProvider,
  useStore: useAppStore,
  useAction: useAppAction
} = createActionContextPattern<Actions>('App', {
  debug: true,               // Enable debug mode
  name: 'custom-register'    // Custom ActionRegister name
});
```

---

## 📚 Migration Guide

### From Basic Patterns to Action Context

```typescript
// Before: Separate patterns with direct context usage
const {
  Provider: ActionProvider,
  useActionDispatch: useAction
} = createActionContext<Actions>('actions');
const {
  Provider: StoreProvider,
  useStore
} = createStoreContext('stores');

// After: Unified pattern with renaming convention
const {
  Provider: AppProvider,
  useStore: useAppStore,
  useAction: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContextPattern<Actions>('app');
```

### From Legacy Context to Declarative Store

```typescript
// Before: Manual store management
const {
  Provider: StoreProvider,
  useStore
} = createStoreContext('stores');
const userStore = registry.getOrCreateStore('user', initialValue);

// After: Schema-based stores with renaming convention
const {
  Provider: AppStoreProvider,
  useStore: useAppStore
} = createDeclarativeStorePattern('app', {
  user: { initialValue: { name: '', email: '' } }
});
const userStore = useAppStore('user');
```

---

## 🛠️ Troubleshooting

### Common Issues

**"Provider not found" errors:**
- Ensure components are wrapped with the correct Provider
- Check Provider hierarchy and nesting

**Type errors with stores:**
- Verify store schema definitions match usage
- Check generic type parameters in createActionContextPattern

**Action handlers not firing:**
- Confirm handlers are registered before actions are dispatched
- Check action payload types match interface definitions

**Performance issues:**
- Use appropriate comparison strategies ('reference' vs 'shallow' vs 'deep')
- Consider store granularity (many small stores vs few large stores)

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const {
  Provider: AppProvider,
  useStore: useAppStore,
  useAction: useAppAction
} = createActionContextPattern<Actions>('App', {
  debug: process.env.NODE_ENV === 'development'
});
```

---

## 📖 API Reference

See individual pattern documentation for complete API references:
- [Action Context Pattern API](./action-context-pattern.md)
- [Action Only Pattern API](./action-only-pattern.md) 
- [Store Patterns API](./store-patterns.md)