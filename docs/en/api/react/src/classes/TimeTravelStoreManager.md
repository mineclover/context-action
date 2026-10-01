[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreManager

# Class: TimeTravelStoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:116](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L116)

Time Travel Store Manager

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Constructors

### Constructor

> **new TimeTravelStoreManager**&lt;`T`&gt;(`name`, `initialStores`, `defaultMaxHistory?`): `TimeTravelStoreManager`&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:127](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L127)

#### Parameters

##### name

`string`

##### initialStores

[`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

##### defaultMaxHistory?

`number` = `50`

#### Returns

`TimeTravelStoreManager`&lt;`T`&gt;

## Methods

### getStore()

> **getStore**&lt;`K`&gt;(`storeName`): [`Store`](Store.md)\<`T`\[`K`\]\> \| [`TimeTravelStore`](TimeTravelStore.md)\<`T`\[`K`\]\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:136](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L136)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### storeName

Type parameter **K**

#### Returns

[`Store`](Store.md)\<`T`\[`K`\]\> \| [`TimeTravelStore`](TimeTravelStore.md)\<`T`\[`K`\]\>

***

### hasTimeTravel()

> **hasTimeTravel**&lt;`K`&gt;(`storeName`): `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:232](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L232)

Check if a store has time travel enabled

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### storeName

Type parameter **K**

#### Returns

`boolean`

***

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:237](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L237)

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:252](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L252)

Dispose all stores and registry resources owned by this manager.

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:262](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L262)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getVersion()

> **getVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:267](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L267)

#### Returns

`number`

***

### subscribeInfo()

> **subscribeInfo**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:271](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L271)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getInfoVersion()

> **getInfoVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:276](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L276)

#### Returns

`number`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:295](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L295)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:117](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L117)

***

### initialStores

> `readonly` **initialStores**: [`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:118](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L118)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`TimeTravelStore`](TimeTravelStore.md)&lt;`any`&gt; \| [`Store`](Store.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:119](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L119)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:128](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L128)
