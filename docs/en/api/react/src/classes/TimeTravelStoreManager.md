[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreManager

# Class: TimeTravelStoreManager\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:127](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L127)

Time Travel Store Manager

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Constructors

### Constructor

> **new TimeTravelStoreManager**&lt;`T`&gt;(`name`, `initialStores`, `defaultMaxHistory?`): `TimeTravelStoreManager`&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:132](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L132)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:141](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L141)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:221](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L221)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:226](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L226)

#### Returns

`void`

***

### getInfo()

> **getInfo**(): `object`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:231](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L231)

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

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:128](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L128)

***

### initialStores

> `readonly` **initialStores**: [`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:129](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L129)

***

### stores

> `readonly` **stores**: `Map`\<keyof `T`, [`Store`](Store.md)&lt;`any`&gt; \| [`TimeTravelStore`](TimeTravelStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:130](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L130)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:133](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L133)
