[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IStoreRegistry

# Interface: IStoreRegistry

Defined in: [packages/react/src/stores/core/types.ts:144](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L144)

Store Registry interface for centralized store management

## Implements

store-registry

## Implements

registry-pattern

## Memberof

core-concepts

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

Defined in: [packages/react/src/stores/core/types.ts:146](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L146)

Unique identifier for the registry

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:149](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L149)

Subscribe to registry changes

***

### getSnapshot()

> **getSnapshot**: () => \[`string`, [`IStore`](IStore.md)&lt;`any`&gt;\][]

Defined in: [packages/react/src/stores/core/types.ts:152](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L152)

Get snapshot of all registered stores

#### Returns

\[`string`, [`IStore`](IStore.md)&lt;`any`&gt;\][]

***

### register()

> **register**: (`name`, `store`, `metadata?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:155](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L155)

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

Defined in: [packages/react/src/stores/core/types.ts:158](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L158)

Unregister a store by name

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### getStore()

> **getStore**: (`name`) => `undefined` \| [`IStore`](IStore.md)&lt;`any`&gt;

Defined in: [packages/react/src/stores/core/types.ts:161](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L161)

Get store by name

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`IStore`](IStore.md)&lt;`any`&gt;

***

### getAllStores()

> **getAllStores**: () => `Map`\<`string`, [`IStore`](IStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/core/types.ts:164](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L164)

Get all registered stores as Map

#### Returns

`Map`\<`string`, [`IStore`](IStore.md)&lt;`any`&gt;\>

***

### hasStore()

> **hasStore**: (`name`) => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:167](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L167)

Check if store exists by name

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### getStoreCount()

> **getStoreCount**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:170](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L170)

Get count of registered stores

#### Returns

`number`

***

### getStoreNames()

> **getStoreNames**: () => `string`[]

Defined in: [packages/react/src/stores/core/types.ts:173](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L173)

Get array of registered store names

#### Returns

`string`[]

***

### clear()

> **clear**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:176](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L176)

Clear all registered stores

#### Returns

`void`

***

### forEach()

> **forEach**: (`callback`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:179](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L179)

Iterate over all stores

#### Parameters

##### callback

(`store`, `name`) => `void`

#### Returns

`void`
