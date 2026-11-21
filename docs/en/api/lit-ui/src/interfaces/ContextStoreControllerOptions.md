[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / ContextStoreControllerOptions

# Interface: ContextStoreControllerOptions\<T, Selected\>

Defined in: [packages/lit-ui/src/context.ts:193](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L193)

Options for `ContextStoreController`.

## Type Parameters

### Generic type T

Type parameter **T**

Source store state type.

### Selected

`Selected` = `T`

Projected output type.

## Properties

### context

> **context**: `object`

Defined in: [packages/lit-ui/src/context.ts:195](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L195)

The W3C Context token created via `createStoreContext`.

***

### selector?

> `optional` **selector?**: `Selector`\<`T`, `Selected`\>

Defined in: [packages/lit-ui/src/context.ts:197](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L197)

Optional projection selector to derive a slice of state.

***

### equalityFn?

> `optional` **equalityFn?**: `EqualityFn`&lt;`Selected`&gt;

Defined in: [packages/lit-ui/src/context.ts:199](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L199)

Optional equality comparator to prevent redundant rerenders. Defaults to Object.is.
