[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / createReactDispatcher

# Function: createReactDispatcher()

> **createReactDispatcher**\<`T`\>(`registry`, `errorHandler?`): \<`K`\>(`action`, `payload?`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/core/src/react-helpers.ts:229](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/react-helpers.ts#L229)

🆕 React action dispatcher factory

Creates a dispatcher function optimized for React component usage
with proper error boundaries and async handling.

## Type Parameters

### T

`T` *extends* [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md)

ActionPayloadMap type

## Parameters

### registry

[`ActionRegister`](../classes/ActionRegister.md)\<`T`\>

ActionRegister instance

### errorHandler?

(`error`, `action`, `payload?`) => `void`

Optional error handler for unhandled dispatch errors

## Returns

Optimized dispatch function for React components

> \<`K`\>(`action`, `payload?`, `options?`): `Promise`\<`void`\>

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

`K`

#### payload?

`T`\[`K`\]

#### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

### Returns

`Promise`\<`void`\>

## Example

```tsx
function MyComponent() {
  const registry = useActionRegister();
  
  const dispatch = createReactDispatcher(registry, (error, action, payload) => {
    console.error(`Failed to dispatch ${action}:`, error);
  });
  
  const handleClick = useCallback(() => {
    dispatch('userClick', { buttonId: 'submit' });
  }, [dispatch]);
}
```
