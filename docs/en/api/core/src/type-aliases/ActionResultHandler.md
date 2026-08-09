[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionResultHandler

# Type Alias: ActionResultHandler\<T, R\>

> **ActionResultHandler**\<`T`, `R`\> = (`payload`, `controller`) => `R` \| `Promise`&lt;`R`&gt;

Defined in: [packages/core/src/types.ts:509](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L509)

Strict handler contract used when an action result map declares a result.
Unlike the legacy ActionHandler type, a mapped handler must return the
declared result (or a promise of it).

## Type Parameters

### Generic type T

`T` = `unknown`

### Generic type R

`R` = `void`

## Parameters

### payload

Type parameter **T**

### controller

[`ActionResultController`](../interfaces/ActionResultController.md)\<`T`, `R`\>

## Returns

`R` \| `Promise`&lt;`R`&gt;
