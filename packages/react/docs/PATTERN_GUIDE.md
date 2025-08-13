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
```typescript
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

// 2. Create Pattern
const AppContext = createActionContextPattern<AppActions>('App', {
  debug: process.env.NODE_ENV === 'development'
});

// 3. Provider Setup
function App() {
  return (
    <AppContext.Provider registryId="app-main">
      <UserProfile />
    </AppContext.Provider>
  );
}

// 3. Declarative Hook Exports (Recommended)
const useUserStore = AppContext.useStore;
const useActionDispatch = AppContext.useAction;
const useActionHandler = AppContext.useActionHandler;

// 4. Component Usage with Exported Hooks
function UserProfile() {
  const userStore = useUserStore('user', { id: '', name: '', email: '' });
  const user = useStoreValue(userStore);
  const dispatch = useActionDispatch();
  
  // Action handler registration with exported hook
  useActionHandler('updateUser', async (payload) => {
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
```typescript
// Automatic Provider wrapping
const withAppProviders = AppContext.withCustomProvider(
  ({ children }) => (
    <ThemeProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  ),
  'app-with-theme'
);

const AppWithProviders = withAppProviders(App);
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
```typescript
// 1. Define Actions
interface EventActions extends ActionPayloadMap {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
}

// 2. Create Context
const EventContext = createActionContext<EventActions>('Events');

// 3. Provider Setup
function App() {
  return (
    <EventContext.Provider>
      <InteractiveComponent />
    </EventContext.Provider>
  );
}

// 4. Component Usage with Clean Destructuring  
function InteractiveComponent() {
  // Destructure with semantic naming
  const { useActionDispatch, useActionHandler } = EventContext;
  
  const dispatch = useActionDispatch();
  
  // Register action handlers with renamed hook
  useActionHandler('userClick', (payload, controller) => {
    console.log('User clicked at:', payload.x, payload.y);
    // Pure side effects, no state management
  });
  
  useActionHandler('analytics', async (payload) => {
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
```typescript
function AdvancedComponent() {
  // Clean destructuring for advanced features
  const useAdvancedDispatch = EventContext.useActionDispatchWithResult;
  
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
```typescript
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

```typescript
// Clean, readable component with semantic names
function TodoApp() {
  const { 
    useStore: useTodoStore,
    useAction: dispatchTodoAction,
    useActionHandler: registerTodoHandler 
  } = TodoContext;
  
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

```typescript
// Custom hooks for domain-specific logic
function useUserActions() {
  const { useAction, useActionHandler, useStore } = UserContext;
  
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

```typescript
// Export specific hooks for clean imports
export const { 
  useStore: useShoppingStore,
  useAction: useShoppingAction,
  useActionHandler: useShoppingHandler,
  Provider: ShoppingProvider 
} = ShoppingContext;

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

```typescript
// Create reusable pattern factories
function createFeatureContext<T extends ActionPayloadMap>(
  name: string,
  initialStores: Record<string, any>
) {
  const context = createActionContextPattern<T>(name);
  
  return {
    // Renamed exports for clarity
    Provider: context.Provider,
    useFeatureStore: context.useStore,
    useFeatureAction: context.useAction,
    useFeatureHandler: context.useActionHandler,
    // Utility functions
    createFeatureStore: (storeName: string, initial: any) => 
      context.useStore(storeName, initial),
    withFeatureProviders: context.withProvider,
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
const store = AppContext.useStore('user', initialValue, {
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
AppContext.useActionHandler('updateUser', handler, {
  id: 'user-updater',        // Unique handler ID
  priority: 10,              // Execution priority (higher = first)
  blocking: true            // Block subsequent handlers if this fails
});
```

### Provider Configuration
```typescript
const AppContext = createActionContextPattern<Actions>('App', {
  debug: true,               // Enable debug mode
  name: 'custom-register'    // Custom ActionRegister name
});
```

---

## 📚 Migration Guide

### From Basic Patterns to Action Context

```typescript
// Before: Separate patterns
const ActionCtx = createActionContext<Actions>('actions');
const StoreCtx = createStoreContext('stores');

// After: Unified pattern
const AppCtx = createActionContextPattern<Actions>('app');
```

### From Legacy Context to Declarative Store

```typescript
// Before: Manual store management
const StoreCtx = createStoreContext('stores');
const userStore = registry.getOrCreateStore('user', initialValue);

// After: Schema-based stores
const AppStores = createDeclarativeStorePattern('app', {
  user: { initialValue: { name: '', email: '' } }
});
const userStore = AppStores.useStore('user');
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
const AppContext = createActionContextPattern<Actions>('App', {
  debug: process.env.NODE_ENV === 'development'
});
```

---

## 📖 API Reference

See individual pattern documentation for complete API references:
- [Action Context Pattern API](./action-context-pattern.md)
- [Action Only Pattern API](./action-only-pattern.md) 
- [Store Patterns API](./store-patterns.md)