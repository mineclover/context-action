[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionGuardHandler

# Type Alias: ActionGuardHandler\<T\>

> **ActionGuardHandler**&lt;`T`&gt; = (`payload`, `controller`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:499](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L499)

A preflight validator/authorizer.

## Type Parameters

### Generic type T

`T` = `unknown`

## Parameters

### payload

Type parameter **T**

### controller

[`ActionGuardController`](../interfaces/ActionGuardController.md)&lt;`T`&gt;

## Returns

`void` \| `Promise`&lt;`void`&gt;
