[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IStoreRegistry

# Interface: IStoreRegistry

Defined in: [packages/react/src/stores/core/types.ts:148](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L148)

Store Registry interface for centralized store management

## Implements

store-registry

## Implements

registry-pattern

## Memberof

core-concepts

## Since

1.0.0

Central registry for managing multiple Store instances with dynamic access
and lifecycle management. Provides subscription capability for registry changes.

## Example

```typescript
const registry = new StoreRegistry('app-registry');

// Register stores
const userStore = createStore('user', { name: '', email: '' });
const settingsStore = createStore('settings', { theme: 'light' });

registry.register('user', userStore);
registry.register('settings', settingsStore);

// Access stores dynamically
const user = registry.getStore('user');
const settings = registry.getStore('settings');

// Subscribe to registry changes
registry.subscribe(() => {
  console.log('Registry changed, store count:', registry.getStoreCount());
});
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:150](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L150)

Unique identifier for the registry

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:153](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L153)

Subscribe to registry changes

***

### getSnapshot()

> **getSnapshot**: () => \[`string`, [`IStore`](IStore.md)&lt;`any`&gt;\][]

Defined in: [packages/react/src/stores/core/types.ts:156](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L156)

Get snapshot of all registered stores

#### Returns

\[`string`, [`IStore`](IStore.md)&lt;`any`&gt;\][]

***

### register()

> **register**: (`name`, `store`, `metadata?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:159](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L159)

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

Defined in: [packages/react/src/stores/core/types.ts:162](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L162)

Unregister a store by name

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### getStore()

> **getStore**: (`name`) => `undefined` \| [`IStore`](IStore.md)&lt;`any`&gt;

Defined in: [packages/react/src/stores/core/types.ts:165](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L165)

Get store by name

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`IStore`](IStore.md)&lt;`any`&gt;

***

### getAllStores()

> **getAllStores**: () => `Map`\<`string`, [`IStore`](IStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/core/types.ts:168](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L168)

Get all registered stores as Map

#### Returns

`Map`\<`string`, [`IStore`](IStore.md)&lt;`any`&gt;\>

***

### hasStore()

> **hasStore**: (`name`) => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:171](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L171)

Check if store exists by name

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### getStoreCount()

> **getStoreCount**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:174](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L174)

Get count of registered stores

#### Returns

`number`

***

### getStoreNames()

> **getStoreNames**: () => `string`[]

Defined in: [packages/react/src/stores/core/types.ts:177](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L177)

Get array of registered store names

#### Returns

`string`[]

***

### clear()

> **clear**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:180](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L180)

Clear all registered stores

#### Returns

`void`

***

### forEach()

> **forEach**: (`callback`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:183](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/types.ts#L183)

Iterate over all stores

#### Parameters

##### callback

(`store`, `name`) => `void`

#### Returns

`void`
