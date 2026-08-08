[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionObserverHandler

# Type Alias: ActionObserverHandler\<T, R\>

> **ActionObserverHandler**\<`T`, `R`\> = (`event`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:398](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L398)

A post-result side effect. Observer return values are deliberately ignored.

## Type Parameters

### Generic type T

`T` = `unknown`

### Generic type R

`R` = `void`

## Parameters

### event

[`ActionObserverEvent`](../interfaces/ActionObserverEvent.md)\<`T`, `R`\>

## Returns

`void` \| `Promise`&lt;`void`&gt;
