# IStore Interface

## 1. Purpose

The `IStore` interface defines the contract for a store in the `@context-action/react` library. It provides a standard set of methods for managing state, including getting and setting values, subscribing to changes, and managing the store's lifecycle. It is designed to be compatible with React's `useSyncExternalStore` hook.

## 2. Structure

The `IStore` interface has the following properties and methods:

```typescript
export interface IStore<T = unknown> {
  // The unique name of the store.
  readonly name: string;

  // Subscribes to changes in the store.
  subscribe: (listener: Listener) => Unsubscribe;

  // Gets an immutable snapshot of the store's state.
  getSnapshot: () => Snapshot<T>;

  // Sets the value of the store.
  setValue: (value: T, options?: StoreSetValueOptions<T>) => void;

  // Updates the value of the store using an updater function.
  update: (updater: (current: T) => T) => void;

  // Gets the current value of the store.
  getValue: () => T;

  // Gets the number of active listeners.
  getListenerCount?: () => number;

  // Disposes of the store and its resources.
  dispose?: () => void;

  // ... and other advanced methods for cleanup, metrics, and security.
}
```

## 3. Usage Patterns

You typically don't implement the `IStore` interface yourself. Instead, you create instances of the `Store` class, which implements `IStore`.

### Creating a Store

```typescript
import { Store } from '@context-action/react';

const myStore: IStore<number> = new Store('myStore', 0);
```

### Interacting with a Store

Once you have a store instance, you can use its methods to manage its state.

```typescript
// Set the value
myStore.setValue(10);

// Update the value
myStore.update(currentValue => currentValue + 1);

// Get the value
const currentValue = myStore.getValue(); // 11

// Subscribe to changes
const unsubscribe = myStore.subscribe(() => {
  console.log('The store has changed!');
});
```

## 4. TypeDoc Link

[IStore in types.ts](../../../packages/react/src/stores/core/types.ts)
