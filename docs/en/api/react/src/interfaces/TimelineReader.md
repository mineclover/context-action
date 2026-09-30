[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimelineReader

# Interface: TimelineReader\<T\>

Defined in: [packages/react/src/stores/core/contracts.ts:35](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L35)

## Extends

- [`StoreReader`](StoreReader.md)&lt;`T`&gt;

## Type Parameters

### Generic type T

Type parameter **T**

## Methods

### getSnapshot()

> **getSnapshot**(): [`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/contracts.ts:26](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L26)

#### Returns

[`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)&lt;`T`&gt;

#### Inherited from

[`StoreReader`](StoreReader.md).[`getSnapshot`](StoreReader.md#getsnapshot)

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/core/contracts.ts:27](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L27)

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

Defined in: [packages/react/src/stores/core/contracts.ts:36](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L36)

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/contracts.ts:37](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L37)

#### Returns

`boolean`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/contracts.ts:38](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L38)

#### Returns

`number`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/react/src/stores/core/contracts.ts:39](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L39)

#### Returns

`number`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/contracts.ts:25](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/contracts.ts#L25)

#### Inherited from

[`StoreReader`](StoreReader.md).[`name`](StoreReader.md#name)
