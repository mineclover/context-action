[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / createActionHandler

# Function: createActionHandler()

> **createActionHandler**\<`T`, `K`\>(`registry`, `action`, `handler`, `config?`): `object`

Defined in: [packages/core/src/react-helpers.ts:88](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L88)

🔧 Create action handler registration configuration for React components

Creates a configuration object that can be used with React's useEffect to properly
register and unregister action handlers with lifecycle management and cleanup.
This is NOT a hook - it's a factory function for React hook integration.

## Type Parameters

### T

`T` *extends* [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md)

ActionPayloadMap type

### K

`K` *extends* `string` \| `number` \| `symbol`

Action key type

## Parameters

### registry

[`ActionRegister`](../classes/ActionRegister.md)\<`T`\>

ActionRegister instance

### action

`K`

Action name to register handler for

### handler

[`ActionHandler`](../type-aliases/ActionHandler.md)\<`T`\[`K`\]\>

Handler function (should be memoized with useCallback)

### config?

[`HandlerConfig`](../interfaces/HandlerConfig.md)

Handler configuration

## Returns

`object`

Configuration object with register/unregister functions

### register()

> **register**: () => [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

#### Returns

[`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

### unregister()

> **unregister**: () => `void`

#### Returns

`void`

### registerWithCleanup()

> **registerWithCleanup**: () => () => `void`

#### Returns

> (): `void`

##### Returns

`void`

### config

> **config**: `Required`\<[`HandlerConfig`](../interfaces/HandlerConfig.md)\>

## Examples

```tsx
import { useCallback, useEffect } from 'react';
import { createActionHandler } from '@context-action/core/react-helpers';

function MyComponent() {
  const registry = useActionRegister();
  
  const handleUserUpdate = useCallback(async (payload, controller) => {
    // Handler logic here
  }, []);
  
  useEffect(() => {
    const { register, unregister } = createActionHandler(
      registry,
      'updateUser',
      handleUserUpdate,
      { priority: 10 }
    );
    
    const cleanup = register();
    return () => {
      cleanup();
      unregister();
    };
  }, [registry, handleUserUpdate]);
}
```

```tsx
const [userId, setUserId] = useState('123');

const handleUserUpdate = useCallback(async (payload, controller) => {
  console.log('Updating user:', userId, payload);
}, [userId]);

useEffect(() => {
  const handlerManager = createActionHandler(
    registry,
    'updateUser',
    handleUserUpdate,
    { priority: 10 }
  );
  
  // Simplified registration with automatic cleanup
  return handlerManager.registerWithCleanup();
}, [registry, handleUserUpdate, userId]);
```
