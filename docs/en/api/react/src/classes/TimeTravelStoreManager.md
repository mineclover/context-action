[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreManager

# Class: TimeTravelStoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:127](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L127)

Time Travel Store Manager

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Constructors

### Constructor

> **new TimeTravelStoreManager**&lt;`T`&gt;(`name`, `initialStores`, `defaultMaxHistory?`): `TimeTravelStoreManager`&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:138](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L138)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:147](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L147)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:233](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L233)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:238](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L238)

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:253](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L253)

Dispose all stores and registry resources owned by this manager.

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:263](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L263)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getVersion()

> **getVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:268](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L268)

#### Returns

`number`

***

### subscribeInfo()

> **subscribeInfo**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:272](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L272)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getInfoVersion()

> **getInfoVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:277](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L277)

#### Returns

`number`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:296](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L296)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:128](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L128)

***

### initialStores

> `readonly` **initialStores**: [`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:129](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L129)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)&lt;`any`&gt; \| [`TimeTravelStore`](TimeTravelStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:130](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L130)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:139](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L139)
