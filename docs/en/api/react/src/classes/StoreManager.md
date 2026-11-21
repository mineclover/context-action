[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreManager

# Class: StoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:203](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L203)

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

> **new StoreManager**&lt;`T`&gt;(`name`, `initialStores`, `options?`): `StoreManager`&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:216](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L216)

#### Parameters

##### name

`string`

##### initialStores

[`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

##### options?

[`StoreManagerOptions`](../interfaces/StoreManagerOptions.md)&lt;`T`&gt;

#### Returns

`StoreManager`&lt;`T`&gt;

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:340](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L340)

Clear manager-owned stores while keeping shared external stores alive

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:368](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L368)

Dispose manager-owned stores and registry resources; preserve shared external stores.

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:382](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L382)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getVersion()

> **getVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:387](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L387)

#### Returns

`number`

***

### subscribeInfo()

> **subscribeInfo**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:391](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L391)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getInfoVersion()

> **getInfoVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:396](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L396)

#### Returns

`number`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:418](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L418)

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

> `readonly` **registry**: [`StoreRegistry`](../advanced/classes/StoreRegistry.md)

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:204](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L204)

***

### initialStores

> `readonly` **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:205](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L205)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:206](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L206)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:217](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L217)
