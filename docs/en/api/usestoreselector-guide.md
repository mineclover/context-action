# useStoreSelector Hook

## 1. Purpose

The `useStoreSelector` hook allows you to subscribe to a specific part of a store's data. It takes a `selector` function that extracts the desired data from the store's value, and it will only re-render the component if the selected value changes. This is a powerful tool for performance optimization, as it prevents unnecessary re-renders when other parts of the store's data change.

## 2. Signature

```typescript
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R;
```

-   `store`: The store instance to subscribe to.
-   `selector`: A function that takes the store's value and returns the specific data that you want to subscribe to.
-   `equalityFn` (optional): A function to compare the previous and new selected values. Defaults to a smart equality check.

## 3. Usage Patterns

You use `useStoreSelector` to subscribe to a slice of a store's state.

### Subscribing to a Single Field

```typescript
import { useStoreSelector } from '@context-action/react';
import { userStore } from './stores';

const UserName = () => {
  const userName = useStoreSelector(userStore, (user) => user.name);

  return <div>{userName}</div>;
};
```
In this example, the `UserName` component will only re-render when the `name` property of the `userStore` changes.

### Using a Custom Equality Function

You can provide a custom equality function to control when the component re-renders.

```typescript
import { useStoreSelector, shallowEqual } from '@context-action/react';
import { userStore } from './stores';

const UserProfile = () => {
  const user = useStoreSelector(
    userStore,
    (user) => ({ name: user.name, age: user.age }),
    shallowEqual // Use shallow equality check
  );

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
    </div>
  );
};
```

## 4. TypeDoc Link

[useStoreSelector in useStoreSelector.ts](../../../packages/react/src/stores/hooks/useStoreSelector.ts)
