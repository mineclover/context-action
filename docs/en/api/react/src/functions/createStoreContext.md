[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStoreContext

# Function: createStoreContext()

Implementation function that handles both overloads

## Call Signature

> **createStoreContext**\<`T`\>(`contextName`, `initialStores`): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:247](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L247)

Overload 1: Explicit generic types - User provides explicit type interface

### Type Parameters

#### T

`T` *extends* `Record`\<`string`, `any`\>

### Parameters

#### contextName

`string`

#### initialStores

[`InitialStores`](../type-aliases/InitialStores.md)\<`T`\>

### Returns

#### Provider()

> **Provider**: (`__namedParameters`) => `Element`

Provider component with optional registry isolation

##### Parameters

###### \_\_namedParameters

###### children

`ReactNode`

###### registryId?

`string`

##### Returns

`Element`

#### useStore()

> **useStore**: \<`K`\>(`storeName`) => [`Store`](../classes/Store.md)\<`T`\[`K`\]\>

Core hook - Get typed store by name
This is the primary API for accessing stores

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### storeName

`K`

##### Returns

[`Store`](../classes/Store.md)\<`T`\[`K`\]\>

#### useStoreManager()

> **useStoreManager**: () => [`StoreManager`](../classes/StoreManager.md)\<`T`\>

Get the store manager (for advanced use cases)

##### Returns

[`StoreManager`](../classes/StoreManager.md)\<`T`\>

#### useStoreInfo()

> **useStoreInfo**: () => `object`

Utility hooks

##### Returns

`object`

###### name

> **name**: `string`

###### storeCount

> **storeCount**: `number`

###### availableStores

> **availableStores**: `string`[]

#### useStoreClear()

> **useStoreClear**: () => () => `void`

##### Returns

> (): `void`

###### Returns

`void`

#### withProvider()

> **withProvider**: \<`P`\>(`Component`, `config?`) => `FC`\<`P`\>

HOC for automatic provider wrapping with optional configuration

##### Type Parameters

###### P

`P` *extends* `object`

##### Parameters

###### Component

`ComponentType`\<`P`\>

###### config?

`WithProviderConfig`

##### Returns

`FC`\<`P`\>

#### contextName

> **contextName**: `string`

#### initialStores

> **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)\<`T`\>

### See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Call Signature

> **createStoreContext**\<`T`\>(`contextName`, `storeDefinitions`): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:257](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L257)

Overload 2: Type inference - Types inferred from store definitions

### Type Parameters

#### T

`T` *extends* `StoreDefinitions`

### Parameters

#### contextName

`string`

#### storeDefinitions

`T`

### Returns

#### Provider()

> **Provider**: (`__namedParameters`) => `Element`

Provider component with optional registry isolation

##### Parameters

###### \_\_namedParameters

###### children

`ReactNode`

###### registryId?

`string`

##### Returns

`Element`

#### useStore()

> **useStore**: \<`K`\>(`storeName`) => [`Store`](../classes/Store.md)\<`InferStoreTypes`\<`T`\>\[`K`\]\>

Core hook - Get typed store by name
This is the primary API for accessing stores

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### storeName

`K`

##### Returns

[`Store`](../classes/Store.md)\<`InferStoreTypes`\<`T`\>\[`K`\]\>

#### useStoreManager()

> **useStoreManager**: () => [`StoreManager`](../classes/StoreManager.md)\<`InferStoreTypes`\<`T`\>\>

Get the store manager (for advanced use cases)

##### Returns

[`StoreManager`](../classes/StoreManager.md)\<`InferStoreTypes`\<`T`\>\>

#### useStoreInfo()

> **useStoreInfo**: () => `object`

Utility hooks

##### Returns

`object`

###### name

> **name**: `string`

###### storeCount

> **storeCount**: `number`

###### availableStores

> **availableStores**: `string`[]

#### useStoreClear()

> **useStoreClear**: () => () => `void`

##### Returns

> (): `void`

###### Returns

`void`

#### withProvider()

> **withProvider**: \<`P`\>(`Component`, `config?`) => `FC`\<`P`\>

HOC for automatic provider wrapping with optional configuration

##### Type Parameters

###### P

`P` *extends* `object`

##### Parameters

###### Component

`ComponentType`\<`P`\>

###### config?

`WithProviderConfig`

##### Returns

`FC`\<`P`\>

#### contextName

> **contextName**: `string`

#### initialStores

> **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)\<`InferStoreTypes`\<`T`\>\>

### See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
