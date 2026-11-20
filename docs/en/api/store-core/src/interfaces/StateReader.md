[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/store-core/src](../README.md) / StateReader

# Interface: StateReader\<T, Snapshot\>

Defined in: [packages/store-core/src/contracts.ts:36](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L36)

## Extended by

- [`StateBackend`](StateBackend.md)
- [`TransactionParticipantBackend`](TransactionParticipantBackend.md)

## Type Parameters

### Generic type T

Type parameter **T**

### Snapshot

`Snapshot` *extends* [`StateSnapshot`](StateSnapshot.md)&lt;`T`&gt; = [`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)&lt;`T`&gt;

## Methods

### getSnapshot()

> **getSnapshot**(): `Snapshot`

Defined in: [packages/store-core/src/contracts.ts:38](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L38)

#### Returns

`Snapshot`

***

### getValue()?

> `optional` **getValue**(): `T`

Defined in: [packages/store-core/src/contracts.ts:39](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L39)

#### Returns

Type parameter **T**

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/store-core/src/contracts.ts:40](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L40)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/src/contracts.ts:37](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L37)
