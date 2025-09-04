# StoreManager (StoreRegistry) Guide

**Note:** The `StoreManager` class has been renamed to `StoreRegistry`. This guide refers to `StoreRegistry`.

## 1. Purpose

The `StoreRegistry` is a centralized container for managing all `Store` instances in an application. It provides methods to register, unregister, and retrieve stores, making it a key component for state management at a global or component level.

## 2. Structure

The `StoreRegistry` class implements the `IStoreRegistry` interface and provides the following core methods:

```typescript
export class StoreRegistry implements IStoreRegistry {
  // Registers a new store.
  register(name: string, store: IStore<any>, metadata?: Partial<StoreMetadata>): void;

  // Unregisters a store.
  unregister(name: string): boolean;

  // Retrieves a store by its name.
  getStore(name: string): IStore<any> | undefined;

  // Retrieves all stores as a Map.
  getAllStores(): Map<string, IStore<any>>;

  // Clears all stores from the registry.
  clear(): void;

  // Subscribes to changes in the registry.
  subscribe(listener: Listener): Unsubscribe;

  // ... other utility methods
}
```

## 3. Usage Patterns

A `StoreRegistry` is typically used to manage the lifecycle of stores, especially in larger applications.

### Global Registry

The library exports a `globalStoreRegistry` instance that can be used to manage stores that are accessible throughout the application.

```typescript
import { globalStoreRegistry, Store } from '@context-action/react';

const userStore = new Store({ initialValue: { name: 'Guest' } });
const themeStore = new Store({ initialValue: 'light' });

// Register stores to the global registry
globalStoreRegistry.register('user', userStore);
globalStoreRegistry.register('theme', themeStore);

// Retrieve a store later
const retrievedUserStore = globalStoreRegistry.getStore('user');
```

### Custom Registry

You can create your own `StoreRegistry` instance to manage a specific collection of stores, for example, within a particular feature or component tree.

```typescript
import { StoreRegistry, Store } from '@context-action/react';

const featureRegistry = new StoreRegistry('my-feature');

const productStore = new Store({ initialValue: [] });
featureRegistry.register('products', productStore);

// Now `productStore` is managed separately from the global registry.
```

### Subscribing to Changes

You can subscribe to the registry to be notified whenever stores are added or removed.

```typescript
const unsubscribe = globalStoreRegistry.subscribe(() => {
  console.log('The store registry has changed!');
  console.log('Current store names:', globalStoreRegistry.getStoreNames());
});

// Later, to stop listening
unsubscribe();
```

## 4. TypeDoc Link

[StoreRegistry in StoreRegistry.ts](../../../packages/react/src/stores/core/StoreRegistry.ts)
