# Snapshot Interface

## 1. Purpose

The `Snapshot` interface represents an immutable snapshot of a store's state at a specific point in time. It is designed to be compatible with React's `useSyncExternalStore` hook and provides not only the store's value but also metadata for debugging, validation, and performance monitoring.

## 2. Structure

The `Snapshot` interface has the following properties:

```typescript
export interface Snapshot<T = unknown> {
  // The value of the store at the time of the snapshot.
  value: T;

  // The name of the store.
  name: string;

  // The timestamp of when the snapshot was created.
  lastUpdate: number;

  // The version of the snapshot, for optimistic updates.
  version?: number;

  // The validation status of the value.
  isValid?: boolean;

  // The error message if validation failed.
  validationError?: string;

  // Performance metrics for the snapshot.
  metrics?: {
    creationTime: number;
    sizeEstimate?: number;
    notificationCount?: number;
  };

  // Security metadata for the snapshot.
  security?: {
    validated: boolean;
    sanitized?: boolean;
    trustLevel?: number;
  };
}
```

## 3. Usage Patterns

You typically don't create `Snapshot` objects yourself. They are returned by the `store.getSnapshot()` method, which is used internally by hooks like `useStoreValue`.

### Accessing a Snapshot

You can get the current snapshot of a store by calling `getSnapshot()`.

```typescript
import { myStore } from './stores';

const snapshot = myStore.getSnapshot();

console.log('Current value:', snapshot.value);
console.log('Last updated:', new Date(snapshot.lastUpdate));
```

### Using with `useSyncExternalStore`

The `getSnapshot` method is designed to be used with `useSyncExternalStore` for custom hooks or advanced integrations.

```typescript
import { useSyncExternalStore } from 'react';
import { myStore } from './stores';

const useMyCustomStoreHook = () => {
  const snapshot = useSyncExternalStore(
    myStore.subscribe,
    myStore.getSnapshot
  );

  return snapshot.value;
};
```

## 4. TypeDoc Link

[Snapshot in types.ts](../../../packages/react/src/stores/core/types.ts)
