[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStoreContext

# Function: createStoreContext()

Implementation function that handles both overloads

## Call Signature

> **createStoreContext**&lt;`T`&gt;(`contextName`, `initialStores`): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:247](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L247)

Overload 1: Explicit generic types - User provides explicit type interface

### Type Parameters

#### T

`T` *extends* `Record`\<`string`, `any`\>

### Parameters

#### contextName

`string`

#### initialStores

[`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

### Returns

#### Provider()

> **Provider**: (`__namedParameters`) => `Element`

Provider component with optional registry isolation

##### Parameters

###### \_\_namedParameters

###### children

Type parameter **ReactNode**

###### registryId?

`string`

##### Returns

Type parameter **Element**

#### useStore()

> **useStore**: &lt;`K`&gt;(`storeName`) => [`Store`](../classes/Store.md)\<`T`\[`K`\]\>

Core hook - Get typed store by name
This is the primary API for accessing stores

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### storeName

Type parameter **K**

##### Returns

[`Store`](../classes/Store.md)\<`T`\[`K`\]\>

#### useStoreManager()

> **useStoreManager**: () => [`StoreManager`](../classes/StoreManager.md)&lt;`T`&gt;

Get the store manager (for advanced use cases)

##### Returns

[`StoreManager`](../classes/StoreManager.md)&lt;`T`&gt;

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

> **withProvider**: &lt;`P`&gt;(`Component`, `config?`) => `FC`&lt;`P`&gt;

HOC for automatic provider wrapping with optional configuration

##### Type Parameters

###### P

`P` *extends* `object`

##### Parameters

###### Component

`ComponentType`&lt;`P`&gt;

###### config?

[`WithProviderConfig`](../interfaces/WithProviderConfig.md)

##### Returns

`FC`&lt;`P`&gt;

#### contextName

> **contextName**: `string`

#### initialStores

> **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

### See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Call Signature

> **createStoreContext**&lt;`T`&gt;(`contextName`, `storeDefinitions`): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:257](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L257)

Overload 2: Type inference - Types inferred from store definitions

### Type Parameters

#### T

`T` *extends* `StoreDefinitions`

### Parameters

#### contextName

`string`

#### storeDefinitions

Type parameter **T**

### Returns

#### Provider()

> **Provider**: (`__namedParameters`) => `Element`

Provider component with optional registry isolation

##### Parameters

###### \_\_namedParameters

###### children

Type parameter **ReactNode**

###### registryId?

`string`

##### Returns

Type parameter **Element**

#### useStore()

> **useStore**: &lt;`K`&gt;(`storeName`) => [`Store`](../classes/Store.md)\<`InferStoreTypes`&lt;`T`&gt;\[`K`\]\>

Core hook - Get typed store by name
This is the primary API for accessing stores

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### storeName

Type parameter **K**

##### Returns

[`Store`](../classes/Store.md)\<`InferStoreTypes`&lt;`T`&gt;\[`K`\]\>

#### useStoreManager()

> **useStoreManager**: () => [`StoreManager`](../classes/StoreManager.md)\<`InferStoreTypes`&lt;`T`&gt;\>

Get the store manager (for advanced use cases)

##### Returns

[`StoreManager`](../classes/StoreManager.md)\<`InferStoreTypes`&lt;`T`&gt;\>

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

> **withProvider**: &lt;`P`&gt;(`Component`, `config?`) => `FC`&lt;`P`&gt;

HOC for automatic provider wrapping with optional configuration

##### Type Parameters

###### P

`P` *extends* `object`

##### Parameters

###### Component

`ComponentType`&lt;`P`&gt;

###### config?

[`WithProviderConfig`](../interfaces/WithProviderConfig.md)

##### Returns

`FC`&lt;`P`&gt;

#### contextName

> **contextName**: `string`

#### initialStores

> **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)\<`InferStoreTypes`&lt;`T`&gt;\>

### See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
