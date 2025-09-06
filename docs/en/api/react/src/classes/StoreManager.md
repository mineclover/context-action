[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreManager

# Class: StoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:115](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L115)

Internal store registry manager

Manages store creation, caching, and registry coordination for the
store context pattern. Handles store lifecycle and provides
type-safe access to individual stores.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

Record of store names to their value types

## Constructors

### Constructor

> **new StoreManager**&lt;`T`&gt;(`name`, `initialStores`): `StoreManager`&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:120](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L120)

#### Parameters

##### name

`string`

##### initialStores

[`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

#### Returns

`StoreManager`&lt;`T`&gt;

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:218](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L218)

Clear all stores

#### Returns

`void`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:226](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L226)

Get registry info

#### Returns

`object`

##### name

> **name**: `string`

##### storeCount

> **storeCount**: `number`

##### availableStores

> **availableStores**: `string`[]

## Properties

### registry

> `readonly` **registry**: `StoreRegistry`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:116](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L116)

***

### initialStores

> `readonly` **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:117](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L117)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:118](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L118)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:121](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L121)
