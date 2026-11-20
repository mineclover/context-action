[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / applyPatches

# Function: applyPatches()

## Call Signature

> **applyPatches**&lt;`T`&gt;(`state`, `patches`, `options`): `void`

Defined in: [packages/mutative/src/immutable.ts:246](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/immutable.ts#L246)

Apply patches to a state

### Type Parameters

#### T

Type parameter **T**

### Parameters

#### state

Type parameter **T**

The state to apply patches to

#### patches

[`Patches`](../type-aliases/Patches.md)

The patches to apply

#### options

Optional configuration

##### mutable

`true`

### Returns

`void`

The new state with patches applied, or `undefined` when
  `mutable: true` mutates the provided state in place

## Call Signature

> **applyPatches**&lt;`T`&gt;(`state`, `patches`, `options?`): `T`

Defined in: [packages/mutative/src/immutable.ts:251](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/immutable.ts#L251)

Apply patches to a state

### Type Parameters

#### T

Type parameter **T**

### Parameters

#### state

Type parameter **T**

The state to apply patches to

#### patches

[`Patches`](../type-aliases/Patches.md)

The patches to apply

#### options?

Optional configuration

##### mutable?

`false`

### Returns

Type parameter **T**

The new state with patches applied, or `undefined` when
  `mutable: true` mutates the provided state in place
