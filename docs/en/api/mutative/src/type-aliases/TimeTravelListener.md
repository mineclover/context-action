[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / TimeTravelListener

# Type Alias: TimeTravelListener\<S, P\>

> **TimeTravelListener**\<`S`, `P`\> = (`state`, `patches`, `position`, `changedPatches?`, `metadata?`) => `void`

Defined in: [packages/mutative/src/types.ts:150](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L150)

@context-action/mutative

Mutative-based immutability and time-travel utilities.
Drop-in replacement for Immer with undo/redo capabilities.

## Type Parameters

### Generic type S

Type parameter **S**

### Generic type P

`P` *extends* [`PatchesOption`](PatchesOption.md) = `object`

## Parameters

### state

Type parameter **S**

### patches

[`TravelPatches`](TravelPatches.md)&lt;`P`&gt;

### position

`number`

### changedPatches?

[`Patches`](Patches.md)&lt;`P`&gt;

### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

## Returns

`void`
