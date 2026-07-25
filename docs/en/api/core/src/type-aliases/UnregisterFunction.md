[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / UnregisterFunction

# Type Alias: UnregisterFunction

> **UnregisterFunction** = () => `void`

Defined in: [packages/core/src/types.ts:954](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/types.ts#L954)

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
