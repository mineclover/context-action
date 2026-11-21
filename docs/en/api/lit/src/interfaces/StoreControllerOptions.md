[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit/src](../README.md) / StoreControllerOptions

# Interface: StoreControllerOptions\<T, Selected\>

Defined in: [packages/lit/src/types.ts:77](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L77)

Configuration options for `StoreController`.

## Implements

store-integration-pattern

## Memberof

api-terms

## Type Parameters

### Generic type T

Type parameter **T**

Source state type.

### Selected

`Selected` = `T`

Projected output type.

## Properties

### selector?

> `optional` **selector?**: [`Selector`](../type-aliases/Selector.md)\<`T`, `Selected`\>

Defined in: [packages/lit/src/types.ts:82](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L82)

Optional projection function to select a slice of the store state.
Defaults to identity function `(state) => state`.

***

### equalityFn?

> `optional` **equalityFn?**: [`EqualityFn`](../type-aliases/EqualityFn.md)&lt;`Selected`&gt;

Defined in: [packages/lit/src/types.ts:88](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L88)

Optional equality comparator used to prevent unnecessary re-renders.
Defaults to `Object.is`.
