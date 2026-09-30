[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreReader

# Interface: StoreReader\<T\>

Defined in: [packages/react/src/stores/core/contracts.ts:24](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L24)

## Extended by

- [`TimelineReader`](TimelineReader.md)

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### getSnapshot()

> **getSnapshot**(): [`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/contracts.ts:26](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L26)

#### Returns

[`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)&lt;`T`&gt;

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/core/contracts.ts:27](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L27)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/contracts.ts:25](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L25)
