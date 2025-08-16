[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createDeclarativeStorePattern

# Function: createDeclarativeStorePattern()

Implementation function that handles both overloads

## Call Signature

> **createDeclarativeStorePattern**&lt;`T`&gt;(`contextName`, `initialStores`): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:205](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L205)

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

> **useStoreManager**: () => `StoreManager`&lt;`T`&gt;

Get the store manager (for advanced use cases)

##### Returns

`StoreManager`&lt;`T`&gt;

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

### Example

```typescript
// Define types explicitly
interface AppStores {
  counter: number;
  user: { id: string; name: string; email: string };
  settings: { theme: 'light' | 'dark'; language: string };
}

// Create with explicit type and type-checked initialValue
const AppStores = createDeclarativeStorePattern<AppStores>('App', {
  counter: 0,  // Must match AppStores['counter'] = number
  user: { id: '', name: '', email: '' },  // Must match AppStores['user']
  settings: { 
    initialValue: { theme: 'light', language: 'en' },  // Must match AppStores['settings']
    strategy: 'shallow'
  }
});
```

## Call Signature

> **createDeclarativeStorePattern**&lt;`T`&gt;(`contextName`, `storeDefinitions`): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:226](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L226)

Overload 2: Type inference - Types inferred from store definitions

### Type Parameters

#### T

`T` *extends* [`StoreDefinitions`](../type-aliases/StoreDefinitions.md)

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

> **useStore**: &lt;`K`&gt;(`storeName`) => [`Store`](../classes/Store.md)\<[`InferStoreTypes`](../type-aliases/InferStoreTypes.md)&lt;`T`&gt;\[`K`\]\>

Core hook - Get typed store by name
This is the primary API for accessing stores

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### storeName

Type parameter **K**

##### Returns

[`Store`](../classes/Store.md)\<[`InferStoreTypes`](../type-aliases/InferStoreTypes.md)&lt;`T`&gt;\[`K`\]\>

#### useStoreManager()

> **useStoreManager**: () => `StoreManager`\<[`InferStoreTypes`](../type-aliases/InferStoreTypes.md)&lt;`T`&gt;\>

Get the store manager (for advanced use cases)

##### Returns

`StoreManager`\<[`InferStoreTypes`](../type-aliases/InferStoreTypes.md)&lt;`T`&gt;\>

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

> **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)\<[`InferStoreTypes`](../type-aliases/InferStoreTypes.md)&lt;`T`&gt;\>

### Example

```typescript
// Type inference from initialValue (automatic)
const AppStores = createDeclarativeStorePattern('App', {
  counter: 0,  // Inferred as Store<number>
  user: { id: '', name: '', email: '' },  // Inferred as Store<{id: string, name: string, email: string}>
  settings: {
    initialValue: { theme: 'light' as const, language: 'en' },
    strategy: 'shallow'
  }
});
```
