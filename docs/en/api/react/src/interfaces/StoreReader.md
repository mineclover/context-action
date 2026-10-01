[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreReader

# Interface: StoreReader\<T\>

Defined in: [packages/react/src/stores/core/contracts.ts:14](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L14)

## Extended by

- [`TimelineReader`](TimelineReader.md)

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### getSnapshot()

> **getSnapshot**(): `ReadonlyStateSnapshot`&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/contracts.ts:16](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L16)

#### Returns

`ReadonlyStateSnapshot`&lt;`T`&gt;

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/core/contracts.ts:17](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L17)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/contracts.ts:15](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L15)
