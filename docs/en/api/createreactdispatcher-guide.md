# createReactDispatcher Function

## 1. Purpose

The `createReactDispatcher` function is a factory that produces a dispatch function optimized for use in React components. It provides a stable, memoized dispatcher that can be safely used in `useEffect` dependency arrays and component event handlers. It also includes built-in error handling to catch and manage exceptions that occur during the action dispatch process.

## 2. Signature

```typescript
export function createReactDispatcher<T extends ActionPayloadMap>(
  registry: ActionRegister<T>,
  errorHandler?: (error: any, action: keyof T, payload?: T[keyof T]) => void
): <K extends keyof T>(action: K, payload?: T[K], options?: DispatchOptions) => Promise<void>;
```

-   `registry`: An instance of `ActionRegister` that the dispatcher will use to send actions.
-   `errorHandler` (optional): A callback function that is invoked if an error is thrown during the dispatch process and is not caught by a handler.

## 3. Usage Patterns

This function is designed to be used within a React component or a custom hook to create a reliable dispatch function.

### Creating a Dispatcher in a Component

Here’s how to create and use a dispatcher within a React component.

```typescript
import { useMemo } from 'react';
import { useActionRegister, createReactDispatcher } from '@context-action/react';
import { ActionPayloadMap } from '../types'; // Your action payload map

function UserActions() {
  const registry = useActionRegister<ActionPayloadMap>();

  // Create a dispatcher with error handling
  const dispatch = useMemo(() => createReactDispatcher(registry, (error, action) => {
    console.error(`Error during action [${String(action)}]:`, error);
  }), [registry]);

  const handleLogin = () => {
    dispatch('login', { username: 'testuser' });
  };

  return (
    <button onClick={handleLogin}>Login</button>
  );
}
```

By wrapping `createReactDispatcher` in `useMemo`, you ensure that the `dispatch` function has a stable identity across re-renders, preventing unnecessary re-executions of effects and callbacks that depend on it.

### Usage with `useCallback`

The stable `dispatch` function can be safely included in the dependency array of `useCallback` to memoize event handlers.

```typescript
const handleLogout = useCallback(() => {
  dispatch('logout');
}, [dispatch]); // Safe to include dispatch here
```

## 4. TypeDoc Link

[createReactDispatcher in react-helpers.ts](../../../packages/core/src/react-helpers.ts)
