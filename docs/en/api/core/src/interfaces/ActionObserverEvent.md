[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionObserverEvent

# Interface: ActionObserverEvent\<T, R\>

Defined in: [packages/core/src/types.ts:388](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L388)

Immutable terminal event delivered to observer handlers.

## Type Parameters

### Generic type T

`T` = `unknown`

### Generic type R

`R` = `void`

## Properties

### action

> `readonly` **action**: `string`

Defined in: [packages/core/src/types.ts:389](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L389)

***

### payload

> `readonly` **payload**: `Readonly`&lt;`T`&gt;

Defined in: [packages/core/src/types.ts:390](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L390)

***

### outcome

> `readonly` **outcome**: `"completed"` \| `"completed_with_errors"` \| `"failed"` \| `"cancelled"` \| `"debounced"` \| `"throttled"`

Defined in: [packages/core/src/types.ts:391](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L391)

***

### result

> `readonly` **result**: `R` \| readonly `R`[] \| `undefined`

Defined in: [packages/core/src/types.ts:392](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L392)

***

### errors

> `readonly` **errors**: readonly [`HandlerError`](HandlerError.md)[]

Defined in: [packages/core/src/types.ts:393](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L393)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:394](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L394)
