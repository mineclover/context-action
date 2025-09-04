# StoreConfig Interface

## 1. Purpose

The `StoreConfig` interface is used to provide configuration options when creating a `ManagedStore` instance, typically within Higher-Order Component (HOC) patterns or when using the `createManagedStore` factory function. It defines the essential properties for a store's identity and its relationship with a `StoreRegistry`.

## 2. Structure

The `StoreConfig` interface has the following properties:

```typescript
export interface StoreConfig<T = unknown> {
  // The unique name for the store.
  name: string;

  // The initial value of the store.
  initialValue: T;

  // The StoreRegistry instance to register the store with.
  registry?: StoreRegistry;

  // Whether to automatically register the store upon creation. Defaults to true.
  autoRegister?: boolean;
}
```

## 3. Usage Patterns

`StoreConfig` is primarily used with `createManagedStore` to create stores that can automatically register themselves with a registry.

### Creating a Managed Store

This pattern is useful when you want to encapsulate store creation and registration logic.

```typescript
import { createManagedStore, StoreConfig, globalStoreRegistry } from '@context-action/react';

const userStoreConfig: StoreConfig<{ name: string }> = {
  name: 'user',
  initialValue: { name: 'Guest' },
  registry: globalStoreRegistry,
  autoRegister: true,
};

const userStore = createManagedStore(userStoreConfig);

// The userStore is now automatically registered with the globalStoreRegistry.
```

### Usage in HOCs

While not shown in detail here, `StoreConfig` is designed to be used in HOCs that provide stores to components, allowing for flexible and configurable state management.

## 4. TypeDoc Link

[StoreConfig in Store.ts](../../../packages/react/src/stores/core/Store.ts)
