[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreManager

# Class: StoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:204](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L204)

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

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:217](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L217)

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

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:341](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L341)

Clear manager-owned stores while keeping shared external stores alive

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:369](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L369)

Dispose manager-owned stores and registry resources; preserve shared external stores.

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:383](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L383)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getVersion()

> **getVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:388](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L388)

#### Returns

`number`

***

### subscribeInfo()

> **subscribeInfo**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:392](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L392)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getInfoVersion()

> **getInfoVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:397](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L397)

#### Returns

`number`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:419](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L419)

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

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:205](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L205)

***

### initialStores

> `readonly` **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:206](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L206)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:207](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L207)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:218](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L218)
