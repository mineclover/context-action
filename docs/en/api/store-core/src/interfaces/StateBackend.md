[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/store-core/src](../README.md) / StateBackend

# Interface: StateBackend\<T, Patch\>

Defined in: [packages/store-core/src/contracts.ts:50](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L50)

## Extends

- [`StateReader`](StateReader.md)&lt;`T`&gt;.[`StateWriter`](StateWriter.md)&lt;`T`&gt;

## Extended by

- [`StateStore`](StateStore.md)
- [`TimelineBackend`](TimelineBackend.md)

## Type Parameters

### Generic type T

Type parameter **T**

### Patch

`Patch` = [`StatePatch`](StatePatch.md)

## Methods

### getSnapshot()

> **getSnapshot**(): [`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)

Defined in: [packages/store-core/src/contracts.ts:38](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L38)

#### Returns

[`ReadonlyStateSnapshot`](ReadonlyStateSnapshot.md)

#### Inherited from

[`StateReader`](StateReader.md).[`getSnapshot`](StateReader.md#getsnapshot)

***

### getValue()?

> `optional` **getValue**(): `T`

Defined in: [packages/store-core/src/contracts.ts:39](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L39)

#### Returns

Type parameter **T**

#### Inherited from

[`StateReader`](StateReader.md).[`getValue`](StateReader.md#getvalue)

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/store-core/src/contracts.ts:40](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L40)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

#### Inherited from

[`StateReader`](StateReader.md).[`subscribe`](StateReader.md#subscribe)

***

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

#### Inherited from

[`StateWriter`](StateWriter.md).[`setValue`](StateWriter.md#setvalue)

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

#### Inherited from

[`StateWriter`](StateWriter.md).[`update`](StateWriter.md#update)

***

### getLastPatches()?

> `optional` **getLastPatches**(): readonly `Patch`[] \| `null`

Defined in: [packages/store-core/src/contracts.ts:56](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L56)

#### Returns

readonly `Patch`[] \| `null`

***

### getSafeValue()?

> `optional` **getSafeValue**(): `T`

Defined in: [packages/store-core/src/contracts.ts:58](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L58)

Optional defensive read. Its absence means reads are backend-owned references.

#### Returns

Type parameter **T**

***

### dispose()?

> `optional` **dispose**(): `void`

Defined in: [packages/store-core/src/contracts.ts:60](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L60)

Optional lifecycle hook. Backends are shared by default.

#### Returns

`void`

***

### isDisposed()?

> `optional` **isDisposed**(): `boolean`

Defined in: [packages/store-core/src/contracts.ts:61](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L61)

#### Returns

`boolean`

***

### subscribeWithPatches()?

> `optional` **subscribeWithPatches**(`listener`): () => `void`

Defined in: [packages/store-core/src/contracts.ts:62](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L62)

#### Parameters

##### listener

(`patches`) => `void`

#### Returns

() => `void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/src/contracts.ts:37](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L37)

#### Inherited from

[`StateReader`](StateReader.md).[`name`](StateReader.md#name)

***

### capabilities?

> `readonly` `optional` **capabilities?**: `object`

Defined in: [packages/store-core/src/contracts.ts:51](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L51)

#### patches?

> `readonly` `optional` **patches?**: `boolean`

#### timeline?

> `readonly` `optional` **timeline?**: `boolean`

#### immutableSnapshots?

> `readonly` `optional` **immutableSnapshots?**: `boolean`
