[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcher

# Type Alias: ActionDispatcher\<T\>

> **ActionDispatcher**&lt;`T`&gt; = &lt;`K`&gt;(`action`, ...`args`) => `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:1143](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1143)

Dispatch an action with the payload contract defined by its action key.

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)

## Type Parameters

### Generic type K

`K` *extends* keyof `T`

## Parameters

### action

Type parameter **K**

### args

...[`DispatchArgs`](DispatchArgs.md)\<`T`\[`K`\]\>

## Returns

`Promise`&lt;`void`&gt;
