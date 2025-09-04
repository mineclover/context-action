# createActionHandler Function

## 1. Purpose

The `createActionHandler` function is a utility designed to simplify the registration and unregistration of action handlers within React components, especially when dealing with `useEffect` hooks. It provides a convenient way to manage the lifecycle of your action handlers, ensuring they are properly registered when a component mounts and unregistered when it unmounts.

## 2. Signature

```typescript
export function createActionHandler<T extends ActionPayloadMap, K extends keyof T>(
  registry: ActionRegister<T>,
  action: K,
  handler: ActionHandler<T[K]>,
  config?: HandlerConfig
): {
  register: () => UnregisterFunction;
  unregister: () => void;
  registerWithCleanup: () => () => void;
  config: Required<HandlerConfig>;
};
```

-   `registry`: The `ActionRegister` instance to which the handler will be registered.
-   `action`: The name of the action to register the handler for.
-   `handler`: The action handler function. It's recommended to memoize this function using `useCallback` to prevent unnecessary re-registrations.
-   `config` (optional): Configuration options for the handler, such as `priority`, `id`, `blocking`, etc.

The function returns an object with the following methods:
-   `register()`: Registers the handler and returns an `UnregisterFunction`.
-   `unregister()`: Unregisters the handler.
-   `registerWithCleanup()`: Registers the handler and returns a cleanup function suitable for `useEffect`.

## 3. Usage Patterns

`createActionHandler` is typically used inside a React `useEffect` hook to manage action handler subscriptions.

### Basic Usage with `useEffect`

```typescript
import { useCallback, useEffect } from 'react';
import { createActionHandler } from '@context-action/core/react-helpers';
import { useActionRegister } from '@context-action/react'; // Assuming you have this hook

function MyComponent() {
  const registry = useActionRegister(); // Get your ActionRegister instance

  const handleUserUpdate = useCallback(async (payload, controller) => {
    console.log('User updated:', payload);
  }, []);

  useEffect(() => {
    if (!registry) return;

    const { register, unregister } = createActionHandler(
      registry,
      'updateUser',
      handleUserUpdate,
      { priority: 10 }
    );

    const cleanup = register(); // Register the handler
    return () => {
      cleanup(); // Unregister when component unmounts
      unregister(); // Ensure unregistration if cleanup is called manually
    };
  }, [registry, handleUserUpdate]);

  return <div>My Component</div>;
}
```

### Simplified Cleanup with `registerWithCleanup`

For a more concise syntax within `useEffect`, you can use `registerWithCleanup`.

```typescript
import { useCallback, useEffect } from 'react';
import { createActionHandler } from '@context-action/core/react-helpers';
import { useActionRegister } from '@context-action/react';

function MyComponent() {
  const registry = useActionRegister();

  const handleItemAdded = useCallback(async (payload) => {
    console.log('Item added:', payload);
  }, []);

  useEffect(() => {
    if (!registry) return;
    // This directly returns a cleanup function for useEffect
    return createActionHandler(registry, 'itemAdded', handleItemAdded).registerWithCleanup();
  }, [registry, handleItemAdded]);

  return <div>My Component</div>;
}
```

## 4. TypeDoc Link

[createActionHandler in react-helpers.ts](../../../packages/core/src/react-helpers.ts)
