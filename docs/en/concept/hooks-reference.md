# Context-Action React Hooks Reference

This document categorizes all available React hooks in the Context-Action framework into **Essential Hooks** (core functionality) and **Utility Hooks** (convenience and optimization).

## 📋 Table of Contents

1. [Essential Hooks](#essential-hooks)
2. [Utility Hooks](#utility-hooks)
3. [Hook Categories](#hook-categories)
4. [Usage Guidelines](#usage-guidelines)

---

## Essential Hooks

These hooks are fundamental to using the Context-Action framework. Most applications will need these.

### 🔧 RefContext Hooks (Performance)

#### `createRefContext<T>()`
**Factory function** that creates all ref-related hooks for high-performance DOM manipulation.
- **Purpose**: Creates type-safe direct DOM manipulation system with zero React re-renders
- **Returns**: `{ Provider, useRefHandler, useWaitForRefs, useGetAllRefs }`
- **Essential for**: Performance-critical UI, animations, real-time interactions

```tsx
const {
  Provider: MouseRefsProvider,
  useRefHandler: useMouseRef
} = createRefContext<{
  cursor: HTMLDivElement;
  container: HTMLDivElement;
}>('MouseRefs');
```

#### `useRefHandler()`
**Primary hook** for accessing typed ref handlers with direct DOM manipulation.
- **Purpose**: Get ref handler for specific DOM element with type safety
- **Essential for**: Direct DOM updates without React re-renders
- **Pattern**: Performance layer bypassing React reconciliation

```tsx
function MouseTracker() {
  const cursor = useMouseRef('cursor');
  
  const updatePosition = useCallback((x: number, y: number) => {
    if (cursor.target) {
      // Direct DOM manipulation - zero re-renders
      cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, [cursor]);
  
  return <div ref={cursor.setRef} />;
}
```

#### `useWaitForRefs()`
**Utility hook** for waiting on multiple refs to mount before executing operations.
- **Purpose**: Coordinate operations requiring multiple DOM elements
- **Essential for**: Complex DOM initialization sequences
- **Pattern**: Async ref coordination

```tsx
function ComplexComponent() {
  const canvas = useMouseRef('canvas');
  const controls = useMouseRef('controls');
  const waitForRefs = useWaitForRefs();
  
  const initialize = useCallback(async () => {
    const refs = await waitForRefs('canvas', 'controls');
    // Both refs guaranteed to be available
    setupCanvasWithControls(refs.canvas, refs.controls);
  }, [waitForRefs]);
}
```

### 🎯 Action Hooks (Core)

#### `createActionContext<T>()`
**Factory function** that creates all action-related hooks for a specific action context.
- **Purpose**: Creates type-safe action dispatch and handler system
- **Returns**: `{ Provider, useActionDispatch, useActionHandler, useActionRegister }`
- **Essential for**: Any action-based logic

```tsx
const { 
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');
```

#### `useActionDispatch()`
**Primary hook** for dispatching actions to handlers.
- **Purpose**: Get dispatch function to trigger actions
- **Essential for**: Component interaction with business logic
- **Pattern**: ViewModel layer in MVVM architecture

#### `useActionHandler()`
**Primary hook** for registering action handlers.
- **Purpose**: Register business logic for specific actions
- **Essential for**: Implementing business logic
- **Best Practice**: Use with `useCallback` for optimization

### 🏪 Store Hooks (Core)

#### `createDeclarativeStorePattern<T>()`
**Factory function** that creates all store-related hooks with type safety.
- **Purpose**: Creates type-safe store management system
- **Returns**: `{ Provider, useStore, useStoreManager, withProvider }`
- **Essential for**: Any state management

```tsx
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {
  profile: { id: '', name: '' }
});
```

#### `useStoreValue<T>(store)`
**Primary hook** for subscribing to store changes.
- **Purpose**: Get reactive value from store
- **Essential for**: Reading state in components
- **Performance**: Only re-renders on actual value changes

```tsx
const userStore = useUserStore('profile');
const user = useStoreValue(userStore);
```

#### `useStore(name)` (from pattern)
**Primary hook** for accessing stores by name.
- **Purpose**: Get store instance from context
- **Essential for**: Accessing stores in components
- **Type-safe**: Returns properly typed store

---

## Utility Hooks

These hooks provide additional functionality, optimizations, and convenience features.

### 🎯 Action Utility Hooks

#### `useActionDispatchWithResult()`
**Utility hook** for actions that need to collect results.
- **Purpose**: Dispatch actions and collect handler results
- **Use Case**: When you need return values from handlers
- **Advanced**: For complex workflows requiring handler responses

```tsx
const { dispatchWithResult } = useActionDispatchWithResult();
const result = await dispatchWithResult('login', credentials);
```

#### `useActionRegister()`
**Utility hook** for direct access to ActionRegister instance.
- **Purpose**: Advanced control over action registry
- **Use Case**: Dynamic handler management, debugging
- **Advanced**: Rarely needed in typical applications

### 🏪 Store Utility Hooks

#### `useStoreSelector<T, R>(store, selector, equalityFn?)`
**Performance hook** for selective subscriptions.
- **Purpose**: Subscribe to specific parts of store
- **Optimization**: Prevents unnecessary re-renders
- **Use Case**: Large objects where only part changes

```tsx
const userName = useStoreSelector(userStore, user => user.name, shallowEqual);
```

#### `useComputedStore<T, R>(store, compute, config?)`
**Derived state hook** for computed values.
- **Purpose**: Create derived state from stores
- **Optimization**: Only recomputes when dependencies change
- **Use Case**: Calculated values, aggregations

```tsx
const fullName = useComputedStore(
  userStore,
  user => `${user.firstName} ${user.lastName}`
);
```

#### `useLocalStore<T>(initialValue, name?)`
**Component-local store** hook.
- **Purpose**: Create store scoped to component lifecycle
- **Use Case**: Complex component state
- **Benefit**: Store API without global state

```tsx
const { value, setValue, store } = useLocalStore({ count: 0 });
```

#### `usePersistedStore<T>(key, initialValue, options?)`
**Persistence hook** for browser storage.
- **Purpose**: Auto-sync store with localStorage/sessionStorage
- **Use Case**: Settings, user preferences, draft data
- **Feature**: Cross-tab synchronization

```tsx
const themeStore = usePersistedStore('theme', 'light', {
  storage: localStorage
});
```


#### `assertStoreValue<T>(value, storeName)`
**Type assertion utility** for store values.
- **Purpose**: Runtime assertion for non-undefined values
- **Type Safety**: Throws error if undefined
- **Use Case**: When store must have a value

```tsx
const user = useStoreValue(userStore);
const safeUser = assertStoreValue(user, 'userStore'); // never undefined
```


### 🔧 Performance Optimization Hooks

#### `useMultiStoreSelector(stores, selector, equalityFn?)`
**Multi-store selector** for combining stores.
- **Purpose**: Select from multiple stores efficiently
- **Optimization**: Single subscription for multiple stores
- **Use Case**: Cross-store computed values

#### `useStorePathSelector(store, path, equalityFn?)`
**Path-based selector** for nested objects.
- **Purpose**: Select nested values by path
- **Convenience**: Dot notation for deep selection
- **Use Case**: Complex nested state

#### `useAsyncComputedStore(asyncCompute, deps, config?)`
**Async computed values** hook.
- **Purpose**: Compute values asynchronously
- **Feature**: Loading states, error handling
- **Use Case**: API-derived state

---

## Hook Categories

### By Domain

#### State Management
- **Essential**: `useStoreValue`, `useStore` (from pattern)
- **Utility**: `useStoreSelector`, `useComputedStore`, `useLocalStore`

#### Action Handling
- **Essential**: `useActionDispatch`, `useActionHandler`
- **Utility**: `useActionDispatchWithResult`, `useActionRegister`

#### DOM Manipulation & Performance
- **Essential**: `useRefHandler` (from RefContext)
- **Utility**: `useWaitForRefs`, `useGetAllRefs`

#### Persistence
- **Utility**: `usePersistedStore`

#### Advanced/Meta
- **Utility**: `useActionRegister`

### By Usage Frequency

#### High Frequency (>80% of components)
- `useStoreValue`
- `useActionDispatch`
- `useStore` (from pattern)

#### Medium Frequency (20-80% of components)
- `useActionHandler`
- `useStoreSelector`
- `useLocalStore`

#### Low Frequency (<20% of components)
- `useComputedStore`
- `usePersistedStore`
- `useActionDispatchWithResult`

---

## Usage Guidelines

### When to Use Essential Hooks

1. **Starting a new feature**: Always start with essential hooks
2. **Basic CRUD operations**: Essential hooks are sufficient
3. **Simple state management**: `useStoreValue` + `useActionDispatch`
4. **Standard business logic**: `useActionHandler` for logic implementation

### When to Use Utility Hooks

1. **Performance issues**: Use selector hooks for optimization
2. **Complex state derivation**: Use `useComputedStore`
3. **Browser storage needs**: Use `usePersistedStore`
4. **Component-local complex state**: Use `useLocalStore`
5. **Advanced workflows**: Use result collection hooks
6. **Meta-programming**: Use registry hooks

### Best Practices

#### Essential Hook Patterns
```tsx
// Standard component pattern
function UserProfile() {
  // Essential: Get stores
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Essential: Get dispatch
  const dispatch = useUserAction();
  
  // Essential: Register handler
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Business logic here
  }, []));
  
  return <div>{profile.name}</div>;
}
```

#### Utility Hook Patterns
```tsx
// Optimized component with utilities
function OptimizedUserProfile() {
  // Utility: Selective subscription
  const userName = useStoreSelector(userStore, u => u.name);
  
  // Utility: Computed value
  const displayName = useComputedStore(userStore, u => 
    u.nickname || u.name || 'Anonymous'
  );
  
  // Utility: Persisted settings
  const settings = usePersistedStore('userSettings', {
    theme: 'light',
    notifications: true
  });
  
  // Utility: Result collection
  const { dispatchWithResult } = useActionDispatchWithResult();
  
  return <div>{displayName}</div>;
}
```

### Migration Path

For new projects:
1. Start with essential hooks only
2. Add utility hooks as needs arise
3. Refactor to utility hooks for optimization

For existing projects:
1. Keep existing patterns working
2. Gradually adopt utility hooks for new features
3. Refactor performance-critical areas with selector hooks

---

## Additional Hooks and Utilities

### 🔍 Context Hooks

#### `useStoreContext()`
**Low-level context hook** for accessing store context directly.
- **Purpose**: Direct access to store context internals
- **Use Case**: Custom store patterns, debugging
- **Advanced**: Rarely needed in applications

```tsx
const context = useStoreContext();
// Access to internal store context structure
```

### 📊 Multiple Store Hooks

#### `useStoreValues<T, S>(store, selectors)`
**Multiple selector hook** for extracting multiple values at once.
- **Purpose**: Extract multiple values with single subscription
- **Performance**: More efficient than multiple `useStoreValue` calls
- **Use Case**: Components needing multiple derived values

```tsx
const { name, age, email } = useStoreValues(userStore, {
  name: user => user.name,
  age: user => user.age,
  email: user => user.email
});
```

#### `useMultiStoreSelector<R>(stores, selector, equalityFn?)`
**Cross-store selector** for combining multiple stores.
- **Purpose**: Compute value from multiple stores
- **Performance**: Single subscription for all stores
- **Use Case**: Cross-store computed values

```tsx
const summary = useMultiStoreSelector(
  [userStore, settingsStore],
  ([user, settings]) => ({
    displayName: user.name,
    theme: settings.theme
  }),
  shallowEqual
);
```

#### `useMultiComputedStore<R>(stores, compute, config?)`
**Multi-store computed hook** for complex derivations.
- **Purpose**: Compute values from multiple store dependencies
- **Memoization**: Only recomputes when dependencies change
- **Use Case**: Complex cross-store calculations

```tsx
const dashboard = useMultiComputedStore(
  [salesStore, inventoryStore, userStore],
  ([sales, inventory, users]) => ({
    totalRevenue: sales.reduce((sum, s) => sum + s.amount, 0),
    lowStock: inventory.filter(i => i.quantity < 10),
    activeUsers: users.filter(u => u.isActive)
  })
);
```

### 🎯 Specialized Selector Hooks

#### `useStorePathSelector<T>(store, path, equalityFn?)`
**Path-based selector** for nested values.
- **Purpose**: Select deeply nested values by path
- **Convenience**: Array or dot notation for paths
- **Use Case**: Complex nested state structures

```tsx
// Using array path
const city = useStorePathSelector(userStore, ['address', 'city']);

// Would also support dot notation if implemented
const city = useStorePathSelector(userStore, 'address.city');
```

#### `useAsyncComputedStore<R>(dependencies, compute, config?)`
**Async computation hook** for asynchronous derived state.
- **Purpose**: Compute values asynchronously from stores
- **Features**: Loading states, error handling, caching
- **Use Case**: API calls based on store values

```tsx
const enrichedUser = useAsyncComputedStore(
  [userStore],
  async ([user]) => {
    const profile = await fetchUserProfile(user.id);
    return { ...user, ...profile };
  },
  {
    initialValue: null,
    onError: (err) => console.error('Failed to fetch profile:', err)
  }
);
```

#### `useComputedStoreInstance<R>(dependencies, compute, config?)`
**Store instance creator** for computed stores.
- **Purpose**: Create a Store instance from computed values
- **Returns**: Actual `Store<R>` instance (not just value)
- **Use Case**: When you need a store interface for computed values

```tsx
const computedStore = useComputedStoreInstance(
  [priceStore, quantityStore],
  ([price, quantity]) => price * quantity,
  { name: 'totalPriceStore' }
);

// Can now pass this to other components expecting a Store
<PriceDisplay store={computedStore} />
```

### 🔧 Higher-Order Components (HOCs)

#### `withProvider(Component, config?)`
**HOC for automatic provider wrapping**.
- **Purpose**: Wrap components with their required providers
- **Convenience**: Eliminates manual provider nesting
- **Configuration**: Optional display name and registry ID

```tsx
// Basic usage
const UserProfileWithProvider = UserStores.withProvider(UserProfile);

// With configuration
const UserProfileWithProvider = UserStores.withProvider(UserProfile, {
  displayName: 'UserProfileWithStores',
  registryId: 'user-profile-stores'
});

// Usage - no manual provider needed
<UserProfileWithProvider />
```

### 🔧 Utility Functions

#### `shallowEqual<T>(a, b)`
**Shallow equality comparison** function.
- **Purpose**: Compare objects at first level only
- **Performance**: Faster than deep comparison
- **Use Case**: Object/array comparison in selectors

```tsx
const user = useStoreSelector(
  userStore,
  state => ({ name: state.name, age: state.age }),
  shallowEqual // Only re-render if name or age changes
);
```

#### `deepEqual<T>(a, b)`
**Deep equality comparison** function.
- **Purpose**: Recursively compare nested structures
- **Caution**: Performance cost for large objects
- **Use Case**: Complex nested object comparison

```tsx
const settings = useStoreSelector(
  settingsStore,
  state => state.preferences,
  deepEqual // Deep comparison of preferences object
);
```

#### `defaultEqualityFn<T>(a, b)`
**Default equality function** (Object.is).
- **Purpose**: Default comparison using Object.is
- **Behavior**: Same as `===` except for NaN and +0/-0
- **Use Case**: Primitive values, reference equality

#### `assertStoreValue<T>(value, storeName)`
**Runtime assertion** helper for store values.
- **Purpose**: Assert value is not undefined at runtime
- **Safety**: Throws descriptive error if undefined
- **Use Case**: Critical values that must exist

```tsx
function CriticalComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore);
  
  // Ensure user exists before proceeding
  const safeUser = assertStoreValue(user, 'userProfile');
  
  return <div>Welcome {safeUser.name}</div>;
}
```

### 📦 Pattern-Specific Hooks

These hooks are created by factory functions:

#### From `createDeclarativeStorePattern()`
- `Provider` - Context provider component
- `useStore(name)` - Get store by name
- `useStoreManager()` - Get store manager instance
- `withProvider(Component, config?)` - HOC for auto-wrapping

#### From `createActionContext()`
- `Provider` - Action context provider
- `useActionContext()` - Get action context
- `useActionDispatch()` - Get dispatch function
- `useActionHandler(action, handler, config?)` - Register handler
- `useActionRegister()` - Get ActionRegister instance
- `useActionDispatchWithResult()` - Dispatch with result collection

---

## Complete Hook Categories

### By Functionality

#### Core State Management
- `useStoreValue` - Subscribe to store value
- `useStoreValues` - Subscribe to multiple values
- `useStore` - Get store instance

#### Performance Optimization
- `useStoreSelector` - Selective subscription
- `useMultiStoreSelector` - Multi-store selection
- `useStorePathSelector` - Path-based selection
- `useComputedStore` - Computed values
- `useMultiComputedStore` - Multi-store computation
- `useAsyncComputedStore` - Async computation

#### Store Creation & Management
- `useLocalStore` - Component-local store
- `usePersistedStore` - Persistent store
- `useComputedStoreInstance` - Computed store instance

#### Action System
- `useActionDispatch` - Dispatch actions
- `useActionHandler` - Register handlers
- `useActionDispatchWithResult` - Dispatch with results
- `useActionRegister` - Access register
- `useActionContext` - Access context

#### Utilities & Helpers
- `useStoreContext` - Store context access
- `assertStoreValue` - Value assertion
- `shallowEqual` - Shallow comparison
- `deepEqual` - Deep comparison
- `defaultEqualityFn` - Default comparison

#### HOCs & Patterns
- `withProvider` - Auto-provider HOC

---

## Summary

### Essential Hooks (Must Learn)
- **Factory Functions**: `createActionContext`, `createDeclarativeStorePattern`
- **Core Hooks**: `useStoreValue`, `useActionDispatch`, `useActionHandler`, `useStore`

### Utility Hooks (Learn As Needed)
- **Performance**: `useStoreSelector`, `useComputedStore`
- **Convenience**: `useLocalStore`, `usePersistedStore`
- **Advanced**: `useActionDispatchWithResult`

### Specialized Hooks (For Specific Cases)
- **Multi-Store**: `useMultiStoreSelector`, `useMultiComputedStore`, `useStoreValues`
- **Async**: `useAsyncComputedStore`
- **Path Selection**: `useStorePathSelector`
- **Type Safety**: `assertStoreValue`
- **Low-Level**: `useStoreContext`, `useActionContext`

### Helper Functions
- **Equality**: `shallowEqual`, `deepEqual`, `defaultEqualityFn`
- **HOCs**: `withProvider`

The framework provides **30+ hooks and utilities** total, but most applications only need the essential hooks. The focused utility hooks provide powerful optimizations and conveniences when specific needs arise.