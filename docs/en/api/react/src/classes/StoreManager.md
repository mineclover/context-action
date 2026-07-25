[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreManager

# Class: StoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:147](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L147)

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

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:152](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L152)

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

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:253](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L253)

Clear all stores

#### Returns

`void`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:261](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L261)

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

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:148](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L148)

***

### initialStores

> `readonly` **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:149](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L149)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:150](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L150)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:153](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L153)
