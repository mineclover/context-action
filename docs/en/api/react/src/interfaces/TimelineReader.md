[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimelineReader

# Interface: TimelineReader\<T\>

Defined in: [packages/react/src/stores/core/contracts.ts:23](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L23)

## Extends

- [`StoreReader`](StoreReader.md)&lt;`T`&gt;

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### getSnapshot()

> **getSnapshot**(): `ReadonlyStateSnapshot`&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/contracts.ts:16](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L16)

#### Returns

`ReadonlyStateSnapshot`&lt;`T`&gt;

#### Inherited from

[`StoreReader`](StoreReader.md).[`getSnapshot`](StoreReader.md#getsnapshot)

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/core/contracts.ts:17](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L17)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

#### Inherited from

[`StoreReader`](StoreReader.md).[`subscribe`](StoreReader.md#subscribe)

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/react/src/stores/core/contracts.ts:24](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L24)

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/contracts.ts:25](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L25)

#### Returns

`boolean`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/contracts.ts:26](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L26)

#### Returns

`number`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/react/src/stores/core/contracts.ts:27](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L27)

#### Returns

`number`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/contracts.ts:15](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L15)

#### Inherited from

[`StoreReader`](StoreReader.md).[`name`](StoreReader.md#name)
