[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / ProduceOptions

# Interface: ProduceOptions\<F\>

Defined in: [packages/mutative/src/types.ts:172](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L172)

@context-action/mutative

Mutative-based immutability and time-travel utilities.
Drop-in replacement for Immer with undo/redo capabilities.

## Type Parameters

### Generic type F

`F` *extends* `boolean` = `false`

## Properties

### freeze?

> `optional` **freeze?**: `F`

Defined in: [packages/mutative/src/types.ts:174](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L174)

Freeze returned state

***

### enablePatches?

> `optional` **enablePatches?**: `boolean`

Defined in: [packages/mutative/src/types.ts:176](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L176)

Enable patches generation

***

### strict?

> `optional` **strict?**: `boolean`

Defined in: [packages/mutative/src/types.ts:178](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L178)

Reject non-draft replacement values
