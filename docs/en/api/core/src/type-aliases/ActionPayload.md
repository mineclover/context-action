[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionPayload

# Type Alias: ActionPayload\<T, K\>

> **ActionPayload**\<`T`, `K`\> = `T`\[`K`\]

Defined in: [packages/core/src/types.ts:215](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L215)

Utility type to extract payload type for a specific action

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)

The ActionPayloadMap interface

### Generic type K

`K` *extends* keyof `T`

The action name

## Example

```typescript
type UpdateUserPayload = ActionPayload<AppActions, 'updateUser'>
// { id: string; name: string; email: string }
```
