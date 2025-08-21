[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreRegistry

# Class: StoreRegistry

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:57](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L57)

Centralized store registry for managing multiple Store instances

Provides comprehensive store management capabilities including registration,
unregistration, retrieval, metadata management, and subscription to registry changes.
Essential for complex applications requiring multiple stores with organized lifecycle management.

Core Features:
- Store registration/unregistration with unique names
- Store retrieval by name with type safety
- Registry change subscriptions for reactive updates
- Metadata management for enhanced store information
- Filtering and organization capabilities
- Memory-safe cleanup with automatic garbage collection

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Implements

- [`IStoreRegistry`](../interfaces/IStoreRegistry.md)

## Constructors

### Constructor

> **new StoreRegistry**(`name`): `StoreRegistry`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:67](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L67)

#### Parameters

##### name

`string` = `'default'`

#### Returns

Type parameter **StoreRegistry**

## Methods

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:99](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L99)

Subscribe to registry changes for reactive updates

Registers a listener function that will be called whenever stores are
added to or removed from the registry. Essential for building reactive
UI components that need to respond to registry changes.

#### Parameters

##### listener

[`Listener`](../type-aliases/Listener.md)

Function to call when registry changes occur

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function to remove the listener

#### Example

```typescript
const registry = new StoreRegistry('MyRegistry')

const unsubscribe = registry.subscribe(() => {
  console.log('Registry changed! Current stores:', registry.getStoreNames())
})

// This will trigger the listener
registry.register('newStore', createStore('data', {}))

// Cleanup when done
unsubscribe()
```

#### Implementation of

`IStoreRegistry.subscribe`

***

### getSnapshot()

> **getSnapshot**(): \[`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\][]

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:126](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L126)

Get current snapshot of all registered stores

Returns an immutable snapshot of all currently registered stores as
an array of name-store pairs. Compatible with React's useSyncExternalStore
for reactive UI updates.

#### Returns

\[`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\][]

Array of [name, store] tuples representing current registry state

#### Example

```typescript
const snapshot = registry.getSnapshot()
snapshot.forEach(([name, store]) => {
  console.log(`Store ${name}:`, store.getValue())
})
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getSnapshot`](../interfaces/IStoreRegistry.md#getsnapshot)

***

### register()

> **register**(`name`, `store`, `metadata?`): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:159](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L159)

Register a store with optional metadata

Adds a store to the registry with the given name and optional metadata.
If a store with the same name already exists, it will be replaced.
Triggers registry change notifications for subscribers.

#### Parameters

##### name

`string`

Unique identifier for the store

##### store

[`IStore`](../interfaces/IStore.md)

Store instance to register

##### metadata?

`Partial`&lt;`StoreMetadata`&gt;

Optional metadata for enhanced store management

#### Returns

`void`

#### Examples

```typescript
const userStore = createStore('user', { id: '', name: '' })
registry.register('user', userStore)
```

```typescript
registry.register('userProfile', userStore, {
  tags: ['user', 'profile'],
  description: 'User profile data management',
  version: '1.0.0',
  debug: true
})
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`register`](../interfaces/IStoreRegistry.md#register)

***

### unregister()

> **unregister**(`name`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:201](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L201)

Unregister a store from the registry

Removes a store from the registry and calls its destroy method if available.
Triggers registry change notifications for subscribers. Metadata is automatically
garbage collected when the store is no longer referenced.

#### Parameters

##### name

`string`

Name of the store to unregister

#### Returns

`boolean`

True if store was found and removed, false if store didn't exist

#### Example

```typescript
const wasRemoved = registry.unregister('oldStore')
if (wasRemoved) {
  console.log('Store successfully removed')
} else {
  console.log('Store not found')
}
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`unregister`](../interfaces/IStoreRegistry.md#unregister)

***

### getStore()

> **getStore**(`name`): `undefined` \| [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:256](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L256)

Get a specific store by name

Retrieves a store from the registry by its registered name.
Returns undefined if no store with the given name exists.
Commonly used in action handlers for lazy evaluation of store values.

#### Parameters

##### name

`string`

Name of the store to retrieve

#### Returns

`undefined` \| [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

Store instance if found, undefined otherwise

#### Examples

```typescript
const userStore = registry.getStore('user')
if (userStore) {
  const userData = userStore.getValue()
  console.log('Current user:', userData)
} else {
  console.log('User store not found')
}
```

```typescript
const updateUserHandler = async (payload, controller) => {
  // Lazy evaluation - only get store when needed
  const userStore = registry.getStore('user')
  const currentUser = userStore?.getValue()
  
  if (currentUser) {
    userStore.setValue({ ...currentUser, ...payload })
  }
}
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getStore`](../interfaces/IStoreRegistry.md#getstore)

***

### getAllStores()

> **getAllStores**(): `Map`\<`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:280](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L280)

Get all registered stores as a new Map

Returns a new Map containing all currently registered stores.
The returned Map is independent of the internal registry state
and can be safely modified without affecting the registry.

#### Returns

`Map`\<`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\>

New Map with store names as keys and store instances as values

#### Example

```typescript
const allStores = registry.getAllStores()
allStores.forEach((store, name) => {
  console.log(`Store ${name}:`, store.getValue())
})
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getAllStores`](../interfaces/IStoreRegistry.md#getallstores)

***

### hasStore()

> **hasStore**(`name`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:306](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L306)

Check if a store exists in the registry

Returns true if a store with the given name is registered,
false otherwise. Useful for conditional operations.

#### Parameters

##### name

`string`

Name of the store to check

#### Returns

`boolean`

True if store exists, false otherwise

#### Example

```typescript
if (registry.hasStore('user')) {
  const user = registry.getStore('user').getValue()
  console.log('User data:', user)
} else {
  console.log('User store not initialized yet')
}
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`hasStore`](../interfaces/IStoreRegistry.md#hasstore)

***

### getStoreCount()

> **getStoreCount**(): `number`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:330](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L330)

Get the total number of registered stores

Returns the count of currently registered stores in the registry.
Useful for debugging and monitoring registry size.

#### Returns

`number`

Number of registered stores

#### Example

```typescript
console.log(`Registry has ${registry.getStoreCount()} stores`)

// Monitor registry growth
const unsubscribe = registry.subscribe(() => {
  console.log(`Store count changed to: ${registry.getStoreCount()}`)
})
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getStoreCount`](../interfaces/IStoreRegistry.md#getstorecount)

***

### getStoreNames()

> **getStoreNames**(): `string`[]

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:355](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L355)

Get all registered store names

Returns an array containing the names of all currently registered stores.
Useful for iteration, debugging, and building dynamic UI components.

#### Returns

`string`[]

Array of store names

#### Example

```typescript
const storeNames = registry.getStoreNames()
console.log('Available stores:', storeNames)

// Use in UI to show available stores
storeNames.forEach(name => {
  console.log(`${name}: ${registry.getStore(name).getValue()}`)
})
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getStoreNames`](../interfaces/IStoreRegistry.md#getstorenames)

***

### getStoreMetadata()

> **getStoreMetadata**(`name`): `undefined` \| `StoreMetadata`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:381](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L381)

Get metadata for a specific store

Retrieves the metadata associated with a registered store.
Returns undefined if the store doesn't exist or has no metadata.

#### Parameters

##### name

`string`

Name of the store

#### Returns

`undefined` \| `StoreMetadata`

Store metadata if found, undefined otherwise

#### Example

```typescript
const metadata = registry.getStoreMetadata('userProfile')
if (metadata) {
  console.log('Store registered at:', new Date(metadata.registeredAt))
  console.log('Tags:', metadata.tags)
  console.log('Description:', metadata.description)
}
```

***

### updateStoreMetadata()

> **updateStoreMetadata**(`name`, `updates`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:412](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L412)

Update metadata for a registered store

Partially updates the metadata for an existing store.
Only provided fields will be updated, existing fields remain unchanged.

#### Parameters

##### name

`string`

Name of the store to update

##### updates

`Partial`&lt;`StoreMetadata`&gt;

Partial metadata updates to apply

#### Returns

`boolean`

True if metadata was updated, false if store doesn't exist

#### Example

```typescript
// Update version and remove debug flag
const success = registry.updateStoreMetadata('userStore', {
  version: '2.0.1',
  debug: false
})

if (success) {
  console.log('Metadata updated successfully')
}
```

***

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:444](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L444)

Clear all registered stores

Removes all stores from the registry and calls their destroy methods
if available. Triggers registry change notifications. Use with caution
as this will affect all parts of the application using these stores.

#### Returns

`void`

#### Example

```typescript
// Clear all stores (useful for testing or app reset)
registry.clear()

console.log(`Stores remaining: ${registry.getStoreCount()}`) // 0
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`clear`](../interfaces/IStoreRegistry.md#clear)

***

### forEach()

> **forEach**(`callback`): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:483](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L483)

Execute a function for each registered store

Iterates over all registered stores, calling the provided callback
function for each store with the store instance and its name.

#### Parameters

##### callback

(`store`, `name`) => `void`

Function to execute for each store

#### Returns

`void`

#### Example

```typescript
// Log all store values
registry.forEach((store, name) => {
  console.log(`${name}:`, store.getValue())
})

// Check store health
registry.forEach((store, name) => {
  const listenerCount = store.getListenerCount()
  if (listenerCount === 0) {
    console.warn(`Store ${name} has no listeners`)
  }
})
```

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`forEach`](../interfaces/IStoreRegistry.md#foreach)

***

### filter()

> **filter**(`predicate`): `StoreRegistry`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:521](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L521)

Create a new registry containing filtered stores

Creates a new StoreRegistry instance containing only the stores
that match the provided predicate function. The original registry
remains unchanged. Useful for creating specialized registries.

#### Parameters

##### predicate

(`store`, `name`) => `boolean`

Function to test each store for inclusion

#### Returns

Type parameter **StoreRegistry**

New StoreRegistry containing only matching stores

#### Examples

```typescript
// Create registry with only user-related stores
const userRegistry = registry.filter((store, name) => {
  const metadata = registry.getStoreMetadata(name)
  return metadata?.tags?.includes('user') ?? false
})

console.log('User stores:', userRegistry.getStoreNames())
```

```typescript
// Create registry with only active stores (having listeners)
const activeRegistry = registry.filter((store) => {
  return store.getListenerCount() > 0
})
```

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:66](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/StoreRegistry.ts#L66)

Unique identifier for the registry

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`name`](../interfaces/IStoreRegistry.md#name)
