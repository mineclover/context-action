[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ActionCommandHandler

# Type Alias: ActionCommandHandler\<T\>

> **ActionCommandHandler**&lt;`T`&gt; = (`payload`, `controller`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:279](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L279)

Void Phase 2 command handler that mutates stores or performs side effects
without publishing or arbitrating action results.

## Type Parameters

### Generic type T

`T` = `unknown`

## Parameters

### payload

Type parameter **T**

### controller

[`ActionCommandController`](../interfaces/ActionCommandController.md)&lt;`T`&gt;

## Returns

`void` \| `Promise`&lt;`void`&gt;
