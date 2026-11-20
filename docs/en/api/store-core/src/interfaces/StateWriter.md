[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/store-core/src](../README.md) / StateWriter

# Interface: StateWriter\<T\>

Defined in: [packages/store-core/src/contracts.ts:43](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L43)

## Extended by

- [`StateBackend`](StateBackend.md)

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### setValue()

> **setValue**(`value`, `meta?`): `void`

Defined in: [packages/store-core/src/contracts.ts:45](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L45)

The backend owns mutation safety; values are passed through unchanged.

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

Defined in: [packages/store-core/src/contracts.ts:47](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L47)

Returning undefined is a no-op. In-place mutation is backend-specific.

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

##### meta?

[`StateMutationMeta`](StateMutationMeta.md)

#### Returns

`void`
