# InitialStores Type Alias

## 1. Purpose

The `InitialStores` type alias is used to define the initial state and configuration of stores when creating a store context with `createStoreContext`. It provides a flexible way to define stores, allowing you to provide either a full configuration object or just the initial value.

## 2. Structure

`InitialStores` is a mapped type that takes a record of store names to their value types. For each store, you can provide either a `StoreConfig` object or the initial value directly.

```typescript
export type InitialStores<T extends Record<string, any>> = {
  [K in keyof T]: StoreConfig<T[K]> | T[K];
};
```

## 3. Usage Patterns

You pass an `InitialStores` object to the `createStoreContext` function.

### Simple Initialization

You can define stores by providing just their initial values.

```typescript
import { createStoreContext } from '@context-action/react';

const { Provider, useStore } = createStoreContext('myContext', {
  user: { name: 'Guest', age: 0 },
  theme: 'light',
  counter: 0,
});
```

### Advanced Configuration

For more control, you can provide a `StoreConfig` object for any store. This allows you to set a comparison strategy, add a description, and more.

```typescript
import { createStoreContext } from '@context-action/react';

const { Provider, useStore } = createStoreContext('myContext', {
  user: {
    initialValue: { name: 'Guest', age: 0 },
    strategy: 'deep',
    description: 'The current user of the application.',
  },
  theme: 'light',
});
```

## 4. TypeDoc Link

[InitialStores in declarative-store-pattern-v2.tsx](../../../packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx)
