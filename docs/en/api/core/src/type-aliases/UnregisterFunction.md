[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / UnregisterFunction

# Type Alias: UnregisterFunction

> **UnregisterFunction** = () => `void`

Defined in: [packages/core/src/types.ts:954](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/types.ts#L954)

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
