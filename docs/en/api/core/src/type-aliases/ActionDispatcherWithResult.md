[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcherWithResult

# Type Alias: ActionDispatcherWithResult\<T, TResultMap\>

> **ActionDispatcherWithResult**\<`T`, `TResultMap`\> = \<`K`, `R`\>(`action`, ...`args`) => `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/core/src/types.ts:1296](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1296)

Dispatch an action with the payload contract defined by its action key.

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)

### TResultMap

`TResultMap` *extends* [`ActionResultMap`](ActionResultMap.md)&lt;`T`&gt; = \{ \}

## Type Parameters

### Generic type K

`K` *extends* [`ActionNames`](ActionNames.md)&lt;`T`&gt;

### Generic type R

`R` = [`ActionResult`](ActionResult.md)\<`TResultMap`, `K`\>

## Parameters

### action

Type parameter **K**

### args

...[`DispatchArgs`](DispatchArgs.md)\<`T`\[`K`\]\>

## Returns

`Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>
