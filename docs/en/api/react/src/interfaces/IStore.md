[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IStore

# Interface: IStore\<T\>

Defined in: [packages/react/src/stores/core/types.ts:76](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L76)

Core Store interface for reactive state management

## Implements

store-interface

## Implements

usesyncexternalstore-compatible

## Implements

observer-pattern

## Memberof

core-concepts

Primary interface for Store instances, compatible with React's useSyncExternalStore
and implementing the Observer pattern for reactive state management.

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Type Parameters

### Generic type T

`T` = `any`

The type of the stored value

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:78](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L78)

Unique identifier for the store

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:81](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L81)

Subscribe to store changes (React useSyncExternalStore compatible)

***

### getSnapshot()

> **getSnapshot**: () => [`Snapshot`](Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/types.ts:84](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L84)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](Snapshot.md)&lt;`T`&gt;

***

### setValue()

> **setValue**: (`value`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:87](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L87)

Set store value with change notification

#### Parameters

##### value

Type parameter **T**

#### Returns

`void`

***

### getValue()

> **getValue**: () => `T`

Defined in: [packages/react/src/stores/core/types.ts:90](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L90)

Get current value directly (for action handlers)

#### Returns

Type parameter **T**

***

### getListenerCount()?

> `optional` **getListenerCount**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:93](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L93)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`
