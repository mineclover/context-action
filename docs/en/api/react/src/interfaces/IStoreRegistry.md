[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IStoreRegistry

# Interface: IStoreRegistry

Defined in: [packages/react/src/stores/core/types.ts:107](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L107)

Store Registry interface for centralized store management

## Implements

store-registry

## Implements

registry-pattern

## Memberof

core-concepts

Central registry for managing multiple Store instances with dynamic access
and lifecycle management. Provides subscription capability for registry changes.

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:109](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L109)

Unique identifier for the registry

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:112](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L112)

Subscribe to registry changes

***

### getSnapshot()

> **getSnapshot**: () => \[`string`, [`IStore`](IStore.md)&lt;`any`&gt;\][]

Defined in: [packages/react/src/stores/core/types.ts:115](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L115)

Get snapshot of all registered stores

#### Returns

\[`string`, [`IStore`](IStore.md)&lt;`any`&gt;\][]

***

### register()

> **register**: (`name`, `store`, `metadata?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:118](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L118)

Register a store with optional metadata

#### Parameters

##### name

`string`

##### store

[`IStore`](IStore.md)

##### metadata?

`any`

#### Returns

`void`

***

### unregister()

> **unregister**: (`name`) => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:121](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L121)

Unregister a store by name

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### getStore()

> **getStore**: (`name`) => `undefined` \| [`IStore`](IStore.md)&lt;`any`&gt;

Defined in: [packages/react/src/stores/core/types.ts:124](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L124)

Get store by name

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`IStore`](IStore.md)&lt;`any`&gt;

***

### getAllStores()

> **getAllStores**: () => `Map`\<`string`, [`IStore`](IStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/core/types.ts:127](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L127)

Get all registered stores as Map

#### Returns

`Map`\<`string`, [`IStore`](IStore.md)&lt;`any`&gt;\>

***

### hasStore()

> **hasStore**: (`name`) => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:130](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L130)

Check if store exists by name

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### getStoreCount()

> **getStoreCount**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:133](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L133)

Get count of registered stores

#### Returns

`number`

***

### getStoreNames()

> **getStoreNames**: () => `string`[]

Defined in: [packages/react/src/stores/core/types.ts:136](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L136)

Get array of registered store names

#### Returns

`string`[]

***

### clear()

> **clear**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:139](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L139)

Clear all registered stores

#### Returns

`void`

***

### forEach()

> **forEach**: (`callback`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:142](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L142)

Iterate over all stores

#### Parameters

##### callback

(`store`, `name`) => `void`

#### Returns

`void`
