[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionResultMap

# Type Alias: ActionResultMap\<T\>

> **ActionResultMap**&lt;`T`&gt; = `Partial`\<`Record`\<keyof `T`, `unknown`\>\>

Defined in: [packages/core/src/types.ts:223](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L223)

Optional action-keyed result contract for `dispatchWithResult`.

The legacy API allows callers to provide an explicit result generic. New
code can instead associate result types with action keys at the register
level so the result type is inferred from the dispatched action.

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)
