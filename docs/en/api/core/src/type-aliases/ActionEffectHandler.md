[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionEffectHandler

# Type Alias: ActionEffectHandler\<T\>

> **ActionEffectHandler**&lt;`T`&gt; = (`payload`, `controller`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:492](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L492)

A side-effect observer. Its return value and result APIs are intentionally unavailable.

## Type Parameters

### Generic type T

`T` = `unknown`

## Parameters

### payload

Type parameter **T**

### controller

[`ActionEffectController`](../interfaces/ActionEffectController.md)&lt;`T`&gt;

## Returns

`void` \| `Promise`&lt;`void`&gt;
