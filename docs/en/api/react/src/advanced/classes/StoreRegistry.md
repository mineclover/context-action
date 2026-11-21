[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / StoreRegistry

# Class: StoreRegistry

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:24](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L24)

Centralized non-owning registry for tracking multiple Store instances.

The registry stores references and metadata only; callers that create stores
remain responsible for disposing them. This prevents a registry replacement
or clear operation from unexpectedly disposing stores owned by a manager.

## Implements

- `IStoreRegistry`

## Constructors

### Constructor

> **new StoreRegistry**(`name?`): `StoreRegistry`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:36](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L36)

#### Parameters

##### name?

`string` = `'default'`

#### Returns

`StoreRegistry`

## Methods

### subscribe()

> **subscribe**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:43](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L43)

Subscribe to registry changes for reactive updates

#### Parameters

##### listener

`Listener`

#### Returns

`Unsubscribe`

#### Implementation of

`IStoreRegistry.subscribe`

***

### register()

> **register**(`name`, `store`, `metadata?`): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:54](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L54)

Register a new store in the registry

#### Parameters

##### name

`string`

##### store

[`IStore`](../../interfaces/IStore.md)&lt;`any`&gt;

##### metadata?

`Partial`&lt;`StoreMetadata`&gt;

#### Returns

`void`

#### Implementation of

`IStoreRegistry.register`

***

### unregister()

> **unregister**(`name`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:76](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L76)

Unregister a store from the registry

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Implementation of

`IStoreRegistry.unregister`

***

### getStore()

> **getStore**(`name`): [`IStore`](../../interfaces/IStore.md)&lt;`any`&gt; \| `undefined`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:97](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L97)

Get a store by name

#### Parameters

##### name

`string`

#### Returns

[`IStore`](../../interfaces/IStore.md)&lt;`any`&gt; \| `undefined`

#### Implementation of

`IStoreRegistry.getStore`

***

### hasStore()

> **hasStore**(`name`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:104](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L104)

Check if a store exists

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Implementation of

`IStoreRegistry.hasStore`

***

### getStoreNames()

> **getStoreNames**(): `string`[]

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:111](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L111)

Get all registered store names

#### Returns

`string`[]

#### Implementation of

`IStoreRegistry.getStoreNames`

***

### getAllStores()

> **getAllStores**(): `Map`\<`string`, [`IStore`](../../interfaces/IStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:118](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L118)

Get all stores as entries

#### Returns

`Map`\<`string`, [`IStore`](../../interfaces/IStore.md)&lt;`any`&gt;\>

#### Implementation of

`IStoreRegistry.getAllStores`

***

### getStoreMetadata()

> **getStoreMetadata**(`nameOrStore`): `StoreMetadata` \| `undefined`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:125](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L125)

Get store metadata

#### Parameters

##### nameOrStore

`string` \| [`IStore`](../../interfaces/IStore.md)&lt;`any`&gt;

#### Returns

`StoreMetadata` \| `undefined`

***

### updateStoreMetadata()

> **updateStoreMetadata**(`nameOrStore`, `metadata`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:133](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L133)

Update store metadata

#### Parameters

##### nameOrStore

`string` \| [`IStore`](../../interfaces/IStore.md)&lt;`any`&gt;

##### metadata

`Partial`&lt;`StoreMetadata`&gt;

#### Returns

`boolean`

***

### getSnapshot()

> **getSnapshot**(): \[`string`, [`IStore`](../../interfaces/IStore.md)&lt;`any`&gt;\][]

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:153](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L153)

Get registry snapshot for React integration

#### Returns

\[`string`, [`IStore`](../../interfaces/IStore.md)&lt;`any`&gt;\][]

#### Implementation of

`IStoreRegistry.getSnapshot`

***

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:160](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L160)

Clear all stores from registry

#### Returns

`void`

#### Implementation of

`IStoreRegistry.clear`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:169](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L169)

Dispose registry and cleanup resources

#### Returns

`void`

#### Implementation of

`IStoreRegistry.dispose`

***

### getStoreCount()

> **getStoreCount**(): `number`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:177](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L177)

Get count of registered stores

#### Returns

`number`

#### Implementation of

`IStoreRegistry.getStoreCount`

***

### forEach()

> **forEach**(`callback`): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:184](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L184)

Iterate over all stores

#### Parameters

##### callback

(`store`, `name`) => `void`

#### Returns

`void`

#### Implementation of

`IStoreRegistry.forEach`

***

### getStats()

> **getStats**(): `object`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:193](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L193)

Get registry statistics

#### Returns

`object`

##### totalStores

> **totalStores**: `number`

##### storeNames

> **storeNames**: `string`[]

##### registryName

> **registryName**: `string`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:34](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreRegistry.ts#L34)

Unique identifier for the registry

#### Implementation of

`IStoreRegistry.name`
