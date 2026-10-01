[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreWriter

# Interface: StoreWriter\<T\>

Defined in: [packages/react/src/stores/core/contracts.ts:19](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L19)

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### setValue()

> **setValue**(`value`, `meta?`): `void`

Defined in: [packages/react/src/stores/core/contracts.ts:20](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L20)

#### Parameters

##### value

Type parameter **T**

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

***

### update()

> **update**(`updater`, `meta?`): `void`

Defined in: [packages/react/src/stores/core/contracts.ts:21](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L21)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`
