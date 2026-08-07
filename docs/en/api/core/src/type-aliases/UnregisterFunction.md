[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / UnregisterFunction

# Type Alias: UnregisterFunction

> **UnregisterFunction** = () => `void`

Defined in: [packages/core/src/types.ts:1014](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1014)

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
