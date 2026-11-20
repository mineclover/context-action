[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionObserverEvent

# Interface: ActionObserverEvent\<T, R\>

Defined in: [packages/core/src/types.ts:394](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L394)

Immutable terminal event delivered to observer handlers.

## Type Parameters

### Generic type T

`T` = `unknown`

### Generic type R

`R` = `void`

## Properties

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/types.ts:395](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L395)

***

### payload

> `readonly` **payload**: `Readonly`&lt;`T`&gt;

Defined in: [packages/core/src/types.ts:396](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L396)

***

### outcome

> `readonly` **outcome**: `"completed"` \| `"completed_with_errors"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"`

Defined in: [packages/core/src/types.ts:397](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L397)

***

### result

> `readonly` **result**: `R` \| readonly `R`[] \| `undefined`

Defined in: [packages/core/src/types.ts:398](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L398)

***

### errors

> `readonly` **errors**: readonly [`HandlerError`](HandlerError.md)[]

Defined in: [packages/core/src/types.ts:399](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L399)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:400](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L400)
