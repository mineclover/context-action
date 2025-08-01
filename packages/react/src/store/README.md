# @context-action/react

A lightweight, TypeScript-first store system with subscription support for React applications.

## Features

- 🎯 **Type-safe**: Full TypeScript support with generics
- 🔄 **Reactive**: Built-in subscription system for React with `useSyncExternalStore`
- 📦 **Modular**: Separate stores with registry management
- 🚌 **Event-driven**: Built-in event bus for inter-store communication
- 🪝 **React Hooks**: Ready-to-use hooks for all store operations
- 🔧 **Utilities**: Helper functions for common store patterns

## Installation

```bash
npm install @context-action/react
# or
yarn add @context-action/react
```

## Core Concepts

### Context-based Store Management

The library uses React Context API to share a single `StoreRegistry` instance across your component tree. This design provides:

1. **Centralized Store Management**: One registry holds all application stores
2. **Component-level Store Mounting**: Individual components can subscribe to specific stores using hooks
3. **Automatic Cleanup**: Stores can be registered/unregistered as components mount/unmount
4. **Type-safe Access**: Full TypeScript support ensures type safety across the entire flow

```
┌─────────────────────────────────────────┐
│           StoreProvider                 │
│  ┌───────────────────────────────────┐  │
│  │      StoreRegistry Instance       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────┐ │  │
│  │  │ Store A │ │ Store B │ │ ... │ │  │
│  │  └─────────┘ └─────────┘ └─────┘ │  │
│  └───────────────────────────────────┘  │
│                    │                     │
│    ┌───────────────┼───────────────┐    │
│    │               │               │    │
│  ┌─▼──────┐  ┌────▼────┐  ┌──────▼──┐ │
│  │ Comp A │  │ Comp B  │  │ Comp C  │ │
│  │useStore │  │useStore │  │useStore │ │
│  │(Store A)│  │(Store B)│  │(Store A)│ │
│  └─────────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────────┘
```

### Hook-based Store Access

Components access stores through specialized hooks that handle:

1. **Subscription Management**: Automatically subscribe/unsubscribe using `useSyncExternalStore`
2. **Selective Updates**: Components only re-render when their subscribed stores change
3. **Memory Efficiency**: Hooks ensure proper cleanup and prevent memory leaks

## Design Philosophy

### Tree-shaking Support

This library is designed with tree-shaking in mind. All exports are modular and can be imported individually:

```typescript
// Import only what you need
import { Store, useStore } from '@context-action/react';

// Or use the Context API pattern
import { StoreProvider, useStoreRegistry } from '@context-action/react';
```

### Memory Management

- **WeakMap for Metadata**: Store metadata is managed using WeakMap to ensure automatic garbage collection when stores are no longer referenced
- **Explicit Cleanup**: Stores can implement a `destroy()` method that will be called during unregistration
- **Separation of Concerns**: Core store data is kept separate from metadata, improving memory efficiency

## Quick Start

### Basic Store Usage

```typescript
import { Store, useStore } from '@context-action/react';

// Create a store
const counterStore = new Store('counter', 0);

// React component
function Counter() {
  const { value } = useStore(counterStore);
  
  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => counterStore.setValue(value + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Using Store Registry with Context API

The recommended approach for managing stores in a React application is to use the Context API pattern. This pattern consists of three main steps:

#### 1. Wrap your app with StoreProvider

The `StoreProvider` creates a StoreRegistry instance and shares it via React Context:

```typescript
import { StoreProvider, useStoreRegistry, Store } from '@context-action/react';

// Wrap your app with StoreProvider
function App() {
  return (
    <StoreProvider>
      <MyComponent />
    </StoreProvider>
  );
}

// Use the registry in components
function MyComponent() {
  const registry = useStoreRegistry();
  
  useEffect(() => {
    // Register stores with metadata
    registry.register('user', new Store('user', { name: 'John' }), {
      description: 'User profile store',
      tags: ['profile', 'auth']
    });
    
    registry.register('theme', new Store('theme', 'dark'), {
      description: 'Application theme settings'
    });
    
    // Cleanup on unmount
    return () => {
      registry.unregister('user');
      registry.unregister('theme');
    };
  }, [registry]);
  
  return <div>Stores registered</div>;
}
```

#### 2. Register stores at appropriate component levels

Stores can be registered at different levels of your component tree:

```typescript
// App-level stores
function AppStores() {
  const registry = useStoreRegistry();
  
  useEffect(() => {
    // Global stores that persist throughout the app
    registry.register('auth', new Store('auth', { isLoggedIn: false }));
    registry.register('theme', new Store('theme', 'light'));
  }, [registry]);
  
  return null;
}

// Feature-level stores
function FeatureStores() {
  const registry = useStoreRegistry();
  
  useEffect(() => {
    // Feature-specific stores
    const cartStore = new Store('cart', { items: [] });
    registry.register('cart', cartStore);
    
    return () => {
      // Clean up when feature unmounts
      registry.unregister('cart');
    };
  }, [registry]);
  
  return null;
}
```

#### 3. Access stores in components using hooks

Components can access stores from the registry using various hooks:

```typescript
// Direct store access
function UserProfile() {
  const registry = useStoreRegistry();
  const userStore = registry.getStore('user');
  const user = useStoreValue(userStore);
  
  return <div>Welcome, {user.name}!</div>;
}

// Dynamic store access
function DynamicComponent({ storeName }: { storeName: string }) {
  const registry = useStoreRegistry();
  const snapshot = useDynamicStore(registry, storeName);
  
  if (!snapshot) return <div>Store not found</div>;
  
  return <div>{JSON.stringify(snapshot.value)}</div>;
}

// Using registry hooks
function StoreList() {
  const registry = useStoreRegistry();
  const stores = useRegistry(registry);
  
  return (
    <ul>
      {stores.map(([name, store]) => (
        <li key={name}>
          {name}: {JSON.stringify(store.getSnapshot().value)}
        </li>
      ))}
    </ul>
  );
}
```

### Custom Store Context

You can create multiple isolated store contexts:

```typescript
import { createStoreContext } from '@context-action/react';

// Create a custom context for a specific feature
const { Provider: FeatureProvider, useStoreRegistry: useFeatureRegistry } = 
  createStoreContext('feature');

function FeatureModule() {
  return (
    <FeatureProvider>
      <FeatureComponent />
    </FeatureProvider>
  );
}
```

### Using Store Registry

```typescript
import { Store, StoreRegistry, useRegistry } from '@context-action/react';

// Create registry
const registry = new StoreRegistry('app');

// Register stores
registry.register('user', new Store('user', { name: 'John' }));
registry.register('theme', new Store('theme', 'dark'));

// React component
function StoreList() {
  const stores = useRegistry(registry);
  
  return (
    <ul>
      {stores.map(([name, store]) => (
        <li key={name}>{name}: {JSON.stringify(store.getSnapshot().value)}</li>
      ))}
    </ul>
  );
}
```

### Event Bus Communication

```typescript
import { EventBus, Store } from '@context-action/react';

const eventBus = new EventBus();
const storeA = new Store('A', 0);
const storeB = new Store('B', 0);

// Set up cross-store communication
eventBus.on('sync', (value: number) => {
  storeB.setValue(value);
});

// When storeA changes, emit event
storeA.subscribe(() => {
  eventBus.emit('sync', storeA.getSnapshot().value);
});
```

## Architecture Details

### StoreRegistry with WeakMap

The StoreRegistry uses a WeakMap to store metadata, providing several benefits:

1. **Automatic Garbage Collection**: When a store is removed from the registry and has no other references, its metadata is automatically cleaned up
2. **Memory Efficiency**: Metadata doesn't prevent stores from being garbage collected
3. **Separation of Concerns**: Core functionality is separated from auxiliary data

```typescript
class StoreRegistry {
  private stores = new Map<string, IStore>();
  private metadata = new WeakMap<IStore, StoreMetadata>();
  
  register(name: string, store: IStore, metadata?: Partial<StoreMetadata>) {
    this.stores.set(name, store);
    
    // Metadata stored separately in WeakMap
    this.metadata.set(store, {
      registeredAt: Date.now(),
      name,
      ...metadata
    });
  }
  
  unregister(name: string) {
    const store = this.stores.get(name);
    if (store) {
      store.destroy?.(); // Call cleanup if available
      this.stores.delete(name);
      // Metadata is automatically GC'd
    }
  }
}
```

### Context API Integration

The library follows React's Context API pattern similar to other context-based state management solutions:

1. **Provider Pattern**: StoreProvider wraps your component tree
2. **Hook-based Access**: useStoreRegistry provides access to the registry
3. **Isolation**: Multiple contexts can coexist without interference
4. **Type Safety**: Full TypeScript support throughout

## Store Sync Utilities

### Advanced Store Synchronization

The library provides powerful abstractions over `useSyncExternalStore` to simplify store integration:

#### useStoreSelector - Selective Store Hook

```typescript
import { useStoreSelector } from '@context-action/react';

// Basic usage (equivalent to useStore)
function MyComponent({ store }: { store?: IStore<User> }) {
  // Before: Complex useSyncExternalStore setup
  const snapshot = useSyncExternalStore(
    store ? store.subscribe : () => () => {},
    store ? () => store.getSnapshot() : () => ({ value: undefined, name: '', lastUpdate: 0 })
  );

  // After: Simplified with useStoreSelector
  const snapshot = useStoreSelector(store);
  
  // With selector for specific data (main use case)
  const userName = useStoreSelector(store, {
    selector: s => s.value?.name
  });
  
  // With default value
  const userWithDefault = useStoreSelector(store, {
    defaultValue: { name: 'Guest', age: 0 }
  });
}
```

#### Typed Store Hooks Factory

```typescript
import { createTypedStoreHooks } from '@context-action/react';

// Create typed hooks for specific data types
const userStoreHooks = createTypedStoreHooks<User>();
const cartStoreHooks = createTypedStoreHooks<CartState>();

function UserProfile({ userStore }: { userStore?: IStore<User> }) {
  // All methods are fully typed
  const snapshot = userStoreHooks.useStore(userStore);
  const user = userStoreHooks.useStoreValue(userStore);
  const userName = userStoreHooks.useStoreSelector(userStore, s => s.value?.name);
  const userWithDefault = userStoreHooks.useStoreWithDefault(userStore, DEFAULT_USER);
  
  // State-like API
  const [userData, { setValue, update }] = userStoreHooks.useStoreState(userStore);
  
  return (
    <div>
      <h1>{userName || 'No user'}</h1>
      <button onClick={() => update(u => ({ ...u, age: u.age + 1 }))}>  
        Increase Age
      </button>
    </div>
  );
}
```

#### Batch Store Synchronization

```typescript
import { useBatchStoreSync } from '@context-action/react';

function Dashboard() {
  // Subscribe to multiple stores at once
  const stores = useBatchStoreSync({
    user: userStore,
    cart: cartStore,
    settings: settingsStore
  });
  
  return (
    <div>
      <p>User: {stores.user?.name}</p>
      <p>Cart items: {stores.cart?.items.length}</p>
      <p>Theme: {stores.settings?.theme}</p>
    </div>
  );
}
```

### Registry Sync Utilities

#### Dynamic Store Access

```typescript
import { createRegistrySync, useDynamicStore } from '@context-action/react';

// Create registry-specific hooks
const registrySync = createRegistrySync<any>();

function DynamicComponent({ registry, storeName }: Props) {
  // Get store value by name
  const value = useDynamicStore(registry, storeName);
  
  // With default value
  const valueWithDefault = registrySync.useDynamicStoreWithDefault(
    registry,
    storeName,
    { fallback: true }
  );
  
  // Get full snapshot
  const snapshot = registrySync.useDynamicStoreSnapshot(registry, storeName);
  
  // Multiple stores at once
  const multipleStores = registrySync.useDynamicStores(
    registry,
    ['user', 'cart', 'settings']
  );
  
  return <div>{JSON.stringify(value)}</div>;
}
```

#### Registry Utilities

```typescript
import { RegistryUtils } from '@context-action/react';

function RegistryInspector({ registry }: { registry: IStoreRegistry }) {
  // Type-safe store access
  const userStore = RegistryUtils.getTypedStore<User>(registry, 'user');
  
  // Check store existence
  const hasCart = RegistryUtils.hasStore(registry, 'cart');
  
  // Get all store names
  const storeNames = RegistryUtils.getStoreNames(registry);
  
  // Find stores by pattern
  const featureStores = RegistryUtils.getStoresByPattern(
    registry,
    /^feature-/
  );
  
  return (
    <div>
      <h3>Registered Stores:</h3>
      <ul>
        {storeNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## API Reference

### Store

```typescript
class Store<T> {
  constructor(name: string, initialValue: T);
  subscribe(listener: () => void): () => void;
  getSnapshot(): Snapshot<T>;
  getValue(): T;
  setValue(value: T): void;
  update(updater: (current: T) => T): void;
}
```

### StoreRegistry

```typescript
class StoreRegistry {
  constructor(name?: string);
  subscribe(listener: () => void): () => void;
  getSnapshot(): Array<[string, IStore]>;
  register(name: string, store: IStore, metadata?: Partial<StoreMetadata>): void;
  unregister(name: string): boolean;
  getStore(name: string): IStore | undefined;
  getAllStores(): Map<string, IStore>;
  getStoreMetadata(name: string): StoreMetadata | undefined;
  updateStoreMetadata(name: string, updates: Partial<StoreMetadata>): boolean;
}

interface StoreMetadata {
  registeredAt: number;
  name: string;
  tags?: string[];
  description?: string;
}
```

### Context API

- `createStoreContext(name?)` - Create a new store context
- `StoreProvider` - Default provider component
- `useStoreContext()` - Access the store context
- `useStoreRegistry()` - Get the registry instance

### Store Sync API

```typescript
// Selective sync hook
function useStoreSelector<T, R = Snapshot<T>>(
  store: IStore<T> | undefined | null,
  options?: {
    defaultValue?: T;
    selector?: (snapshot: Snapshot<T>) => R;
  }
): R;

// Typed hooks factory
function createTypedStoreHooks<T>(): {
  useStore: (store: IStore<T> | undefined | null) => Snapshot<T>;
  useStoreValue: (store: IStore<T> | undefined | null) => T | undefined;
  useStoreSelector: <R>(store: IStore<T> | undefined | null, selector: (snapshot: Snapshot<T>) => R) => R;
  useStoreWithDefault: (store: IStore<T> | undefined | null, defaultValue: T) => T;
  useStoreState: (store: IStore<T> | undefined | null) => [T | undefined, { setValue: (value: T) => void; update: (updater: (current: T) => T) => void; }];
};

// Batch sync
function useBatchStoreSync<T extends Record<string, IStore | undefined | null>>(
  stores: T
): { [K in keyof T]: T[K] extends IStore<infer U> ? U : undefined };
```

### Registry Sync API

```typescript
// Registry sync factory
function createRegistrySync<T = any>(): {
  useDynamicStore: (registry: IStoreRegistry | undefined | null, storeName: string) => T | undefined;
  useDynamicStoreWithDefault: <U extends T>(registry: IStoreRegistry | undefined | null, storeName: string, defaultValue: U) => U;
  useDynamicStoreSnapshot: <U = T>(registry: IStoreRegistry | undefined | null, storeName: string) => Snapshot<U>;
  useDynamicStores: <K extends string>(registry: IStoreRegistry | undefined | null, storeNames: K[]) => Record<K, any>;
};

// Registry utilities
class RegistryUtils {
  static getTypedStore<T>(registry: IStoreRegistry | undefined | null, name: string): IStore<T> | undefined;
  static hasStore(registry: IStoreRegistry | undefined | null, name: string): boolean;
  static getStoreNames(registry: IStoreRegistry | undefined | null): string[];
  static getStoresByPattern(registry: IStoreRegistry | undefined | null, pattern: RegExp): Array<[string, IStore]>;
}
```

### React Hooks

- `useStore(store)` - Subscribe to a store
- `useStoreValue(store)` - Subscribe to store value only
- `useRegistry(registry)` - Subscribe to registry changes
- `useDynamicStore(registry, name)` - Use store by name from registry
- `useLocalStore(name, initial)` - Create component-local store
- `useComputedStore(name, deps, compute)` - Create computed store
- `usePersistedStore(name, initial, options)` - Create persisted store

### Utilities

- `StoreUtils.copyStore(source, target)` - Copy store values
- `StoreUtils.syncRegistries(source, target)` - Sync registries
- `StoreUtils.createAutoSync(source, target)` - Auto-sync stores
- `StoreUtils.createComputedStore(name, deps, compute)` - Computed store

## Examples

### Numeric Store

```typescript
import { NumericStore } from '@context-action/react';

const counter = new NumericStore('counter', 0);
counter.increment();    // 1
counter.increment(5);   // 6
counter.decrement(2);   // 4
counter.multiply(3);    // 12
counter.reset();        // 0
```

### Persisted Store

```typescript
import { usePersistedStore } from '@context-action/react';

function Settings() {
  const settingsStore = usePersistedStore('settings', {
    theme: 'light',
    language: 'en'
  });
  
  const { value: settings } = useStore(settingsStore);
  
  // Changes are automatically saved to localStorage
  return (
    <select 
      value={settings.theme}
      onChange={(e) => settingsStore.update(s => ({
        ...s,
        theme: e.target.value
      }))}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

### Computed Store

```typescript
import { Store, useComputedStore } from '@context-action/react';

const priceStore = new Store('price', 100);
const taxStore = new Store('tax', 0.08);

function Checkout() {
  const totalStore = useComputedStore(
    'total',
    [priceStore, taxStore],
    (price, tax) => price * (1 + tax)
  );
  
  const total = useStoreValue(totalStore);
  
  return <div>Total: ${total.toFixed(2)}</div>;
}
```

## Best Practices

### 1. Use Context API for Store Management

```typescript
// ✅ Recommended: Use StoreProvider
function App() {
  return (
    <StoreProvider>
      <Application />
    </StoreProvider>
  );
}

// ❌ Avoid: Creating registry instances outside of React
const registry = new StoreRegistry('app'); // Not recommended
```

### 2. Use Store Selector for Optimized Subscriptions

```typescript
// ✅ Recommended: Use useStoreSelector for selective subscriptions
function UserComponent({ userStore }: Props) {
  // Clean, type-safe, handles null/undefined
  const user = useStoreSelector(userStore, {
    selector: s => s.value,
    defaultValue: { name: 'Guest' }
  });
  
  return <div>Hello, {user.name}!</div>;
}

// ❌ Avoid: Direct useSyncExternalStore usage
function BadUserComponent({ userStore }: Props) {
  const snapshot = useSyncExternalStore(
    userStore ? userStore.subscribe : () => () => {},
    userStore ? () => userStore.getSnapshot() : () => ({ value: null, name: '', lastUpdate: 0 })
  );
  // Verbose and error-prone
}
```

### 3. Create Typed Hooks for Domain-Specific Stores

```typescript
// ✅ Good: Create typed hooks for better DX
const userHooks = createTypedStoreHooks<User>();
const cartHooks = createTypedStoreHooks<CartState>();

function ProductPage() {
  const [user, userActions] = userHooks.useStoreState(userStore);
  const cartItems = cartHooks.useStoreValue(cartStore);
  
  // Type-safe operations
  const addToCart = () => {
    cartHooks.update(cart => ({
      ...cart,
      items: [...cart.items, product]
    }));
  };
}

// ❌ Avoid: Generic hooks without typing
function BadProductPage() {
  const user = useStore(userStore as any); // Lost type safety
}
```

### 4. Register Stores with Metadata

```typescript
// ✅ Good: Include metadata for better debugging
registry.register('user', userStore, {
  description: 'User authentication and profile',
  tags: ['auth', 'profile']
});

// ❌ Minimal: Works but less informative
registry.register('user', userStore);
```

### 5. Clean Up on Unmount

```typescript
// ✅ Always clean up stores in useEffect
useEffect(() => {
  registry.register('temp', tempStore);
  
  return () => {
    registry.unregister('temp');
  };
}, [registry]);
```

### 6. Implement destroy() for Complex Stores

```typescript
// ✅ Good: Implement cleanup logic
class ComplexStore extends Store<Data> {
  private subscription?: Unsubscribe;
  
  constructor() {
    super('complex', initialData);
    this.subscription = externalService.subscribe(...);
  }
  
  destroy() {
    this.subscription?.();
    // Clean up resources
  }
}
```

## License

MIT
