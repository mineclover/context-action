[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/backend](../README.md) / BackendStore

# Class: BackendStore\<T, Patch\>

Defined in: [packages/react/src/stores/core/BackendStore.ts:32](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L32)

React-facing Store wrapper for a user-owned state backend.

The backend owns immutability, cloning, patches, and persistence semantics.
This wrapper only supplies the IStore/useSyncExternalStore boundary.

## Type Parameters

### Generic type T

`T` = `unknown`

### Patch

`Patch` = `StatePatch`

## Implements

- [`IStore`](../../interfaces/IStore.md)&lt;`T`&gt;

## Constructors

### Constructor

> **new BackendStore**\<`T`, `Patch`\>(`name`, `backend`, `options?`): `BackendStore`\<`T`, `Patch`\>

Defined in: [packages/react/src/stores/core/BackendStore.ts:59](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L59)

#### Parameters

##### name

`string`

##### backend

`StateBackend`\<`T`, `Patch`\>

##### options?

[`BackendStoreOptions`](../interfaces/BackendStoreOptions.md) = `{}`

#### Returns

`BackendStore`\<`T`, `Patch`\>

## Methods

### subscribe()

> **subscribe**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/BackendStore.ts:172](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L172)

Subscribe to store changes (React useSyncExternalStore compatible)

#### Parameters

##### listener

`Listener`

#### Returns

`Unsubscribe`

#### Implementation of

`IStore.subscribe`

***

### subscribeWithPatches()

> **subscribeWithPatches**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/BackendStore.ts:181](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L181)

#### Parameters

##### listener

[`BackendPatchListener`](../type-aliases/BackendPatchListener.md)&lt;`Patch`&gt;

#### Returns

`Unsubscribe`

***

### getSnapshot()

> **getSnapshot**(): [`Snapshot`](../../interfaces/Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/BackendStore.ts:190](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L190)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](../../interfaces/Snapshot.md)&lt;`T`&gt;

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`getSnapshot`](../../interfaces/IStore.md#getsnapshot)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/core/BackendStore.ts:192](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L192)

Get current value directly (for action handlers)

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`getValue`](../../interfaces/IStore.md#getvalue)

***

### getSafeValue()

> **getSafeValue**(): `T`

Defined in: [packages/react/src/stores/core/BackendStore.ts:194](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L194)

Get a defensive copy for external integration boundaries

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`getSafeValue`](../../interfaces/IStore.md#getsafevalue)

***

### getLastPatches()

> **getLastPatches**(): readonly `Patch`[] \| `null`

Defined in: [packages/react/src/stores/core/BackendStore.ts:202](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L202)

#### Returns

readonly `Patch`[] \| `null`

***

### setValue()

> **setValue**(`value`, `options?`): `void`

Defined in: [packages/react/src/stores/core/BackendStore.ts:204](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L204)

Set store value with enhanced options and validation

#### Parameters

##### value

Type parameter **T**

##### options?

[`BackendStoreSetValueOptions`](../type-aliases/BackendStoreSetValueOptions.md)&lt;`T`&gt;

#### Returns

`void`

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`setValue`](../../interfaces/IStore.md#setvalue)

***

### update()

> **update**(`updater`, `meta?`): `void`

Defined in: [packages/react/src/stores/core/BackendStore.ts:210](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L210)

Update store value with function (for functional updates, supports draft mutations)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`update`](../../interfaces/IStore.md#update)

***

### getListenerCount()

> **getListenerCount**(): `number`

Defined in: [packages/react/src/stores/core/BackendStore.ts:215](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L215)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`getListenerCount`](../../interfaces/IStore.md#getlistenercount)

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/react/src/stores/core/BackendStore.ts:217](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L217)

Check if store is disposed

#### Returns

`boolean`

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`isStoreDisposed`](../../interfaces/IStore.md#isstoredisposed)

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/core/BackendStore.ts:219](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L219)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`dispose`](../../interfaces/IStore.md#dispose)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/BackendStore.ts:33](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/BackendStore.ts#L33)

Unique identifier for the store

#### Implementation of

[`IStore`](../../interfaces/IStore.md).[`name`](../../interfaces/IStore.md#name)
