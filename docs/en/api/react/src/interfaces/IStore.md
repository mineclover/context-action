[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / IStore

# Interface: IStore\<T\>

Defined in: [packages/react/src/stores/core/types.ts:126](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L126)

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

### Generic type T

`T` = `unknown`

The type of the stored value

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:128](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L128)

Unique identifier for the store

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:131](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L131)

Subscribe to store changes (React useSyncExternalStore compatible)

***

### getSnapshot

> **getSnapshot**: () => [`Snapshot`](Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/types.ts:134](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L134)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](Snapshot.md)&lt;`T`&gt;

***

### setValue

> **setValue**: (`value`, `options?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:137](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L137)

Set store value with enhanced options and validation

#### Parameters

##### value

Type parameter **T**

##### options?

`StoreSetValueOptions`&lt;`T`&gt;

#### Returns

`void`

***

### update

> **update**: (`updater`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:140](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L140)

Update store value with function (for functional updates, supports draft mutations)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

#### Returns

`void`

***

### getValue

> **getValue**: () => `T`

Defined in: [packages/react/src/stores/core/types.ts:143](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L143)

Get current value directly (for action handlers)

#### Returns

Type parameter **T**

***

### getSafeValue?

> `optional` **getSafeValue?**: () => `T`

Defined in: [packages/react/src/stores/core/types.ts:146](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L146)

Get a defensive copy for external integration boundaries

#### Returns

Type parameter **T**

***

### getListenerCount?

> `optional` **getListenerCount?**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:149](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L149)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

***

### dispose?

> `optional` **dispose?**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:152](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L152)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

***

### registerCleanup?

> `optional` **registerCleanup?**: (`task`) => () => `void`

Defined in: [packages/react/src/stores/core/types.ts:156](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L156)

Register cleanup task for automatic execution on disposal

#### Parameters

##### task

() => `void`

#### Returns

() => `void`

***

### isStoreDisposed?

> `optional` **isStoreDisposed?**: () => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:159](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L159)

Check if store is disposed

#### Returns

`boolean`

***

### getMetrics?

> `optional` **getMetrics?**: () => `StoreMetrics`

Defined in: [packages/react/src/stores/core/types.ts:163](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L163)

Get store performance metrics

#### Returns

`StoreMetrics`

***

### resetMetrics?

> `optional` **resetMetrics?**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:166](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L166)

Reset performance metrics

#### Returns

`void`

***

### setSecurityOptions?

> `optional` **setSecurityOptions?**: (`options`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:170](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L170)

Set security options

#### Parameters

##### options

`SecurityOptions`

#### Returns

`void`

***

### getSecurityOptions?

> `optional` **getSecurityOptions?**: () => `SecurityOptions` \| `undefined`

Defined in: [packages/react/src/stores/core/types.ts:173](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L173)

Get current security options

#### Returns

`SecurityOptions` \| `undefined`

***

### notifyPath?

> `optional` **notifyPath?**: (`path`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:181](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L181)

Manually notify path-based subscribers without changing state value
Useful for external systems (WebSocket, async operations) that need to
trigger UI updates for specific paths without actual state changes.

#### Parameters

##### path

(`string` \| `number`)[]

#### Returns

`void`

***

### notifyPaths?

> `optional` **notifyPaths?**: (`paths`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:186](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L186)

Manually notify multiple paths at once

#### Parameters

##### paths

(`string` \| `number`)[][]

#### Returns

`void`
