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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:135](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L135)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:144](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L144)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:228](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L228)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:233](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L233)

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:246](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L246)

Dispose all stores and registry resources owned by this manager.

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:255](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L255)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getVersion()

> **getVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:260](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L260)

#### Returns

`number`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:264](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L264)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:136](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L136)
