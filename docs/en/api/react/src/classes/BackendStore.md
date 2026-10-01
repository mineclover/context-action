[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / BackendStore

# Class: BackendStore\<T\>

Defined in: [packages/react/src/stores/core/BackendStore.ts:10](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L10)

React-facing Store wrapper for a user-owned state backend.

The backend owns immutability, cloning, patches, and persistence semantics.
This wrapper only supplies the IStore/useSyncExternalStore boundary.

## Type Parameters

### Generic type T

`T` = `unknown`

## Implements

- [`IStore`](../interfaces/IStore.md)&lt;`T`&gt;

## Constructors

### Constructor

> **new BackendStore**&lt;`T`&gt;(`name`, `backend`): `BackendStore`&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/BackendStore.ts:18](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L18)

#### Parameters

##### name

`string`

##### backend

`StateBackend`&lt;`T`&gt;

#### Returns

`BackendStore`&lt;`T`&gt;

## Methods

### subscribe()

> **subscribe**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/BackendStore.ts:28](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L28)

Subscribe to store changes (React useSyncExternalStore compatible)

#### Parameters

##### listener

Type parameter **Listener**

#### Returns

Type parameter **Unsubscribe**

#### Implementation of

`IStore.subscribe`

***

### getSnapshot()

> **getSnapshot**(): [`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/BackendStore.ts:34](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L34)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSnapshot`](../interfaces/IStore.md#getsnapshot)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/core/BackendStore.ts:36](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L36)

Get current value directly (for action handlers)

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getValue`](../interfaces/IStore.md#getvalue)

***

### getSafeValue()

> **getSafeValue**(): `T`

Defined in: [packages/react/src/stores/core/BackendStore.ts:38](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L38)

Get a defensive copy for external integration boundaries

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSafeValue`](../interfaces/IStore.md#getsafevalue)

***

### setValue()

> **setValue**(`value`, `options?`): `void`

Defined in: [packages/react/src/stores/core/BackendStore.ts:40](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L40)

Set store value with enhanced options and validation

#### Parameters

##### value

Type parameter **T**

##### options?

`StoreSetValueOptions`&lt;`T`&gt;

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`setValue`](../interfaces/IStore.md#setvalue)

***

### update()

> **update**(`updater`): `void`

Defined in: [packages/react/src/stores/core/BackendStore.ts:45](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L45)

Update store value with function (for functional updates, supports draft mutations)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`update`](../interfaces/IStore.md#update)

***

### getListenerCount()

> **getListenerCount**(): `number`

Defined in: [packages/react/src/stores/core/BackendStore.ts:50](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L50)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getListenerCount`](../interfaces/IStore.md#getlistenercount)

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/react/src/stores/core/BackendStore.ts:52](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L52)

Check if store is disposed

#### Returns

`boolean`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`isStoreDisposed`](../interfaces/IStore.md#isstoredisposed)

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/core/BackendStore.ts:54](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L54)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`dispose`](../interfaces/IStore.md#dispose)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/BackendStore.ts:11](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L11)

Unique identifier for the store

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`name`](../interfaces/IStore.md#name)
