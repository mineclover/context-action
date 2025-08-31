[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreManager

# Class: StoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:115](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L115)

Internal store registry manager

Manages store creation, caching, and registry coordination for the
store context pattern. Handles store lifecycle and provides
type-safe access to individual stores.

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `any`\>

Record of store names to their value types

## Constructors

### Constructor

> **new StoreManager**\<`T`\>(`name`, `initialStores`): `StoreManager`\<`T`\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:120](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L120)

#### Parameters

##### name

`string`

##### initialStores

[`InitialStores`](../type-aliases/InitialStores.md)\<`T`\>

#### Returns

`StoreManager`\<`T`\>

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:218](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L218)

Clear all stores

#### Returns

`void`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:226](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L226)

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

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:116](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L116)

***

### initialStores

> `readonly` **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)\<`T`\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:117](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L117)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)\<`any`\>\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:118](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L118)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:121](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L121)
