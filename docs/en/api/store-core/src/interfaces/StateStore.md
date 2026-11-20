[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/store-core/src](../README.md) / StateStore

# Interface: StateStore\<T, Patch\>

Defined in: [packages/store-core/src/contracts.ts:65](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L65)

## Extends

- [`StateBackend`](StateBackend.md)\<`T`, `Patch`\>

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

[`StateBackend`](StateBackend.md).[`getSnapshot`](StateBackend.md#getsnapshot)

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

[`StateBackend`](StateBackend.md).[`subscribe`](StateBackend.md#subscribe)

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

[`StateBackend`](StateBackend.md).[`setValue`](StateBackend.md#setvalue)

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

[`StateBackend`](StateBackend.md).[`update`](StateBackend.md#update)

***

### getLastPatches()?

> `optional` **getLastPatches**(): readonly `Patch`[] \| `null`

Defined in: [packages/store-core/src/contracts.ts:56](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L56)

#### Returns

readonly `Patch`[] \| `null`

#### Inherited from

[`StateBackend`](StateBackend.md).[`getLastPatches`](StateBackend.md#getlastpatches)

***

### getSafeValue()?

> `optional` **getSafeValue**(): `T`

Defined in: [packages/store-core/src/contracts.ts:58](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L58)

Optional defensive read. Its absence means reads are backend-owned references.

#### Returns

Type parameter **T**

#### Inherited from

[`StateBackend`](StateBackend.md).[`getSafeValue`](StateBackend.md#getsafevalue)

***

### dispose()?

> `optional` **dispose**(): `void`

Defined in: [packages/store-core/src/contracts.ts:60](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L60)

Optional lifecycle hook. Backends are shared by default.

#### Returns

`void`

#### Inherited from

[`StateBackend`](StateBackend.md).[`dispose`](StateBackend.md#dispose)

***

### isDisposed()?

> `optional` **isDisposed**(): `boolean`

Defined in: [packages/store-core/src/contracts.ts:61](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L61)

#### Returns

`boolean`

#### Inherited from

[`StateBackend`](StateBackend.md).[`isDisposed`](StateBackend.md#isdisposed)

***

### subscribeWithPatches()?

> `optional` **subscribeWithPatches**(`listener`): () => `void`

Defined in: [packages/store-core/src/contracts.ts:62](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L62)

#### Parameters

##### listener

(`patches`) => `void`

#### Returns

() => `void`

#### Inherited from

[`StateBackend`](StateBackend.md).[`subscribeWithPatches`](StateBackend.md#subscribewithpatches)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/store-core/src/contracts.ts:66](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L66)

#### Returns

Type parameter **T**

#### Overrides

[`StateBackend`](StateBackend.md).[`getValue`](StateBackend.md#getvalue)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/src/contracts.ts:37](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L37)

#### Inherited from

[`StateBackend`](StateBackend.md).[`name`](StateBackend.md#name)

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

#### Inherited from

[`StateBackend`](StateBackend.md).[`capabilities`](StateBackend.md#capabilities)
