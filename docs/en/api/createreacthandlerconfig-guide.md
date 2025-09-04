# createReactHandlerConfig Function

## 1. Purpose

The `createReactHandlerConfig` function is a factory for creating optimized handler configurations tailored for React environments. It simplifies the process of generating unique handler IDs and ensuring proper cleanup, which is crucial for preventing memory leaks in component-based architectures.

## 2. Signature

```typescript
export function createReactHandlerConfig<T>(
  action: keyof T,
  componentId?: string,
  config: HandlerConfig<T> = {}
): Required<HandlerConfig<T>>;
```

-   `action`: The name of the action the handler will respond to.
-   `componentId` (optional): A string identifier for the component, used for debugging purposes.
-   `config` (optional): A base `HandlerConfig` object to which the React-specific optimizations will be added.

## 3. Usage Patterns

This function is most useful within React components, especially inside a `useEffect` hook, to ensure that handlers are registered when the component mounts and unregistered when it unmounts.

### Creating a React-Optimized Handler

Here is an example of how to use `createReactHandlerConfig` within a React component to register a handler.

```typescript
import { useEffect } from 'react';
import { useActionRegister, createReactHandlerConfig } from '@context-action/react';
import { ActionPayloadMap } from '../types'; // Your action payload map

function UserProfile({ userId }: { userId: string }) {
  const registry = useActionRegister<ActionPayloadMap>();

  const handleUserUpdate = (payload) => {
    console.log('User updated:', payload);
  };

  useEffect(() => {
    // Create a React-optimized handler configuration
    const config = createReactHandlerConfig('updateUser', 'UserProfile', {
      priority: 5,
    });

    // Register the handler with the created config
    const unregister = registry.register('updateUser', handleUserUpdate, config);

    // Return the unregister function for cleanup
    return unregister;
  }, [registry, handleUserUpdate]);

  return (
    <div>
      {/* Component UI */}
    </div>
  );
}
```

In this pattern, `createReactHandlerConfig` generates a unique ID for the handler instance and sets up the necessary cleanup logic. The returned `unregister` function from `registry.register` is then used in the `useEffect` cleanup phase to properly remove the handler.

## 4. TypeDoc Link

[createReactHandlerConfig in react-helpers.ts](../../../packages/core/src/react-helpers.ts)
