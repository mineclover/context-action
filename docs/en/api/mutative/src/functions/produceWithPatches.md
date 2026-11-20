[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / produceWithPatches

# Function: produceWithPatches()

> **produceWithPatches**\<`T`, `F`\>(`baseState`, `producer`, `options?`): \[`T`, [`Patches`](../type-aliases/Patches.md), [`Patches`](../type-aliases/Patches.md)\]

Defined in: [packages/mutative/src/immutable.ts:114](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/immutable.ts#L114)

Create immutable state updates with patches

## Type Parameters

### Generic type T

Type parameter **T**

### Generic type F

`F` *extends* `boolean` = `false`

## Parameters

### baseState

Type parameter **T**

### producer

(`draft`) => `T` \| `undefined`

### options?

`Omit`\<[`ProduceOptions`](../interfaces/ProduceOptions.md)&lt;`F`&gt;, `"enablePatches"`\>

## Returns

\[`T`, [`Patches`](../type-aliases/Patches.md), [`Patches`](../type-aliases/Patches.md)\]

[nextState, patches, inversePatches]
