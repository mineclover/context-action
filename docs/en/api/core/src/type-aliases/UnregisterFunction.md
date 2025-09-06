[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / UnregisterFunction

# Type Alias: UnregisterFunction()

> **UnregisterFunction** = () => `void`

Defined in: [packages/core/src/types.ts:685](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/types.ts#L685)

Function type for unregistering action handlers

Returned by the register method to allow removal of specific handlers.
Calling this function removes the handler from the action pipeline.

## Returns

`void`

## Example

```typescript
const unregister = register.register('updateUser', userHandler)

// Later, remove the handler
unregister()
```
