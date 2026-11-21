[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreManager

# Class: TimeTravelStoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:168](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L168)

Time Travel Store Manager

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Constructors

### Constructor

> **new TimeTravelStoreManager**&lt;`T`&gt;(`name`, `initialStores`, `defaultMaxHistory?`, `options?`): `TimeTravelStoreManager`&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:181](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L181)

#### Parameters

##### name

`string`

##### initialStores

[`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

##### defaultMaxHistory?

`number` = `50`

##### options?

[`TimeTravelStoreManagerOptions`](../interfaces/TimeTravelStoreManagerOptions.md)&lt;`T`&gt;

#### Returns

`TimeTravelStoreManager`&lt;`T`&gt;

## Methods

### getStore()

> **getStore**&lt;`K`&gt;(`storeName`): [`Store`](Store.md)\<`T`\[`K`\]\> \| [`TimeTravelStore`](TimeTravelStore.md)\<`T`\[`K`\]\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:207](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L207)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:307](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L307)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:313](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L313)

Clear manager-owned stores while keeping shared external stores alive.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:341](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L341)

Dispose manager-owned stores and registry resources; preserve shared external stores.

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:355](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L355)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getVersion()

> **getVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:360](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L360)

#### Returns

`number`

***

### subscribeInfo()

> **subscribeInfo**(`listener`): () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:364](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L364)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

***

### getInfoVersion()

> **getInfoVersion**(): `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:369](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L369)

#### Returns

`number`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:388](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L388)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:169](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L169)

***

### initialStores

> `readonly` **initialStores**: [`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:170](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L170)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)&lt;`any`&gt; \| [`TimeTravelStore`](TimeTravelStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:171](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L171)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:182](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L182)
