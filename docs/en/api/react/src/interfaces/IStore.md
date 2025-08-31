[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IStore

# Interface: IStore\<T\>

Defined in: [packages/react/src/stores/core/types.ts:149](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L149)

Enhanced Store interface with advanced memory management and error recovery

## Implements

store-interface

## Implements

usesyncexternalstore-compatible

## Implements

observer-pattern

## Memberof

core-concepts

Enhanced Store interface with comprehensive resource management, automatic cleanup,
error recovery strategies, and advanced security features.

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Type Parameters

### T

`T` = `unknown`

The type of the stored value

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:151](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L151)

Unique identifier for the store

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:154](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L154)

Subscribe to store changes (React useSyncExternalStore compatible)

***

### getSnapshot()

> **getSnapshot**: () => [`Snapshot`](Snapshot.md)\<`T`\>

Defined in: [packages/react/src/stores/core/types.ts:157](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L157)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](Snapshot.md)\<`T`\>

***

### setValue()

> **setValue**: (`value`, `options?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:160](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L160)

Set store value with enhanced options and validation

#### Parameters

##### value

`T`

##### options?

`StoreSetValueOptions`\<`T`\>

#### Returns

`void`

***

### update()

> **update**: (`updater`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:163](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L163)

Update store value with function (for functional updates)

#### Parameters

##### updater

(`current`) => `T`

#### Returns

`void`

***

### getValue()

> **getValue**: () => `T`

Defined in: [packages/react/src/stores/core/types.ts:166](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L166)

Get current value directly (for action handlers)

#### Returns

`T`

***

### getListenerCount()?

> `optional` **getListenerCount**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:169](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L169)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

***

### dispose()?

> `optional` **dispose**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:172](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L172)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

***

### registerCleanup()?

> `optional` **registerCleanup**: (`task`) => () => `void`

Defined in: [packages/react/src/stores/core/types.ts:176](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L176)

Register cleanup task for automatic execution on disposal

#### Parameters

##### task

() => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### isStoreDisposed()?

> `optional` **isStoreDisposed**: () => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:179](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L179)

Check if store is disposed

#### Returns

`boolean`

***

### getMetrics()?

> `optional` **getMetrics**: () => `StoreMetrics`

Defined in: [packages/react/src/stores/core/types.ts:183](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L183)

Get store performance metrics

#### Returns

`StoreMetrics`

***

### resetMetrics()?

> `optional` **resetMetrics**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:186](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L186)

Reset performance metrics

#### Returns

`void`

***

### setSecurityOptions()?

> `optional` **setSecurityOptions**: (`options`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:190](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L190)

Set security options

#### Parameters

##### options

`SecurityOptions`

#### Returns

`void`

***

### getSecurityOptions()?

> `optional` **getSecurityOptions**: () => `undefined` \| `SecurityOptions`

Defined in: [packages/react/src/stores/core/types.ts:193](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/types.ts#L193)

Get current security options

#### Returns

`undefined` \| `SecurityOptions`
