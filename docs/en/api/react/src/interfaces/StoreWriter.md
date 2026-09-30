[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreWriter

# Interface: StoreWriter\<T\>

Defined in: [packages/react/src/stores/core/contracts.ts:30](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L30)

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### setValue()

> **setValue**(`value`, `meta?`): `void`

Defined in: [packages/react/src/stores/core/contracts.ts:31](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L31)

#### Parameters

##### value

Type parameter **T**

##### meta?

[`StateMutationMeta`](StateMutationMeta.md)

#### Returns

`void`

***

### update()

> **update**(`updater`, `meta?`): `void`

Defined in: [packages/react/src/stores/core/contracts.ts:32](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L32)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

##### meta?

[`StateMutationMeta`](StateMutationMeta.md)

#### Returns

`void`
