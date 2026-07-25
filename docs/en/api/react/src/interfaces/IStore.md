[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IStore

# Interface: IStore\<T\>

Defined in: [packages/react/src/stores/core/types.ts:149](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L149)

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

Defined in: [packages/react/src/stores/core/types.ts:151](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L151)

Unique identifier for the store

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:154](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L154)

Subscribe to store changes (React useSyncExternalStore compatible)

***

### getSnapshot

> **getSnapshot**: () => [`Snapshot`](Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/types.ts:157](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L157)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](Snapshot.md)&lt;`T`&gt;

***

### setValue

> **setValue**: (`value`, `options?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:160](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L160)

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

Defined in: [packages/react/src/stores/core/types.ts:163](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L163)

Update store value with function (for functional updates, supports draft mutations)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

#### Returns

`void`

***

### getValue

> **getValue**: () => `T`

Defined in: [packages/react/src/stores/core/types.ts:166](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L166)

Get current value directly (for action handlers)

#### Returns

Type parameter **T**

***

### getListenerCount?

> `optional` **getListenerCount?**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:169](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L169)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

***

### dispose?

> `optional` **dispose?**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:172](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L172)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

***

### registerCleanup?

> `optional` **registerCleanup?**: (`task`) => () => `void`

Defined in: [packages/react/src/stores/core/types.ts:176](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L176)

Register cleanup task for automatic execution on disposal

#### Parameters

##### task

() => `void`

#### Returns

() => `void`

***

### isStoreDisposed?

> `optional` **isStoreDisposed?**: () => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:179](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L179)

Check if store is disposed

#### Returns

`boolean`

***

### getMetrics?

> `optional` **getMetrics?**: () => `StoreMetrics`

Defined in: [packages/react/src/stores/core/types.ts:183](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L183)

Get store performance metrics

#### Returns

Type parameter **StoreMetrics**

***

### resetMetrics?

> `optional` **resetMetrics?**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:186](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L186)

Reset performance metrics

#### Returns

`void`

***

### setSecurityOptions?

> `optional` **setSecurityOptions?**: (`options`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:190](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L190)

Set security options

#### Parameters

##### options

Type parameter **SecurityOptions**

#### Returns

`void`

***

### getSecurityOptions?

> `optional` **getSecurityOptions?**: () => `SecurityOptions` \| `undefined`

Defined in: [packages/react/src/stores/core/types.ts:193](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L193)

Get current security options

#### Returns

`SecurityOptions` \| `undefined`

***

### notifyPath?

> `optional` **notifyPath?**: (`path`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:201](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L201)

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

Defined in: [packages/react/src/stores/core/types.ts:206](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L206)

Manually notify multiple paths at once

#### Parameters

##### paths

(`string` \| `number`)[][]

#### Returns

`void`
