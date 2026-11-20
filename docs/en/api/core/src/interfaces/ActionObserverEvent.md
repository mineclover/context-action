[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ActionObserverEvent

# Interface: ActionObserverEvent\<T, R\>

Defined in: [packages/core/src/types.ts:243](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L243)

Immutable terminal event delivered to observer handlers.

## Type Parameters

### Generic type T

`T` = `unknown`

### Generic type R

`R` = `void`

## Properties

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/types.ts:244](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L244)

***

### payload

> `readonly` **payload**: `Readonly`&lt;`T`&gt;

Defined in: [packages/core/src/types.ts:245](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L245)

***

### outcome

> `readonly` **outcome**: `"completed"` \| `"completed_with_errors"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"`

Defined in: [packages/core/src/types.ts:246](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L246)

***

### result

> `readonly` **result**: `R` \| readonly `R`[] \| `undefined`

Defined in: [packages/core/src/types.ts:247](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L247)

***

### errors

> `readonly` **errors**: readonly [`HandlerError`](HandlerError.md)[]

Defined in: [packages/core/src/types.ts:248](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L248)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:249](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L249)
