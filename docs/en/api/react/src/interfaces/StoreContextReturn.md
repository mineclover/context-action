[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreContextReturn

# Interface: StoreContextReturn\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:447](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L447)

Public return contract kept explicit for stable declaration consumers.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Properties

### Provider

> `readonly` **Provider**: (`props`) => `Element`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:448](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L448)

#### Parameters

##### props

[`StoreProviderProps`](StoreProviderProps.md)&lt;`T`&gt;

#### Returns

`Element`

***

### useStore

> `readonly` **useStore**: &lt;`K`&gt;(`storeName`) => [`Store`](../classes/Store.md)\<`T`\[`K`\]\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:449](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L449)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### storeName

Type parameter **K**

#### Returns

[`Store`](../classes/Store.md)\<`T`\[`K`\]\>

***

### useStoreManager

> `readonly` **useStoreManager**: () => [`StoreManager`](../classes/StoreManager.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:450](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L450)

#### Returns

[`StoreManager`](../classes/StoreManager.md)&lt;`T`&gt;

***

### useStoreInfo

> `readonly` **useStoreInfo**: () => `object`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:451](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L451)

#### Returns

`object`

##### name

> **name**: `string`

##### storeCount

> **storeCount**: `number`

##### availableStores

> **availableStores**: `string`[]

***

### useStoreClear

> `readonly` **useStoreClear**: () => () => `void`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:456](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L456)

#### Returns

() => `void`

***

### withProvider

> `readonly` **withProvider**: &lt;`P`&gt;(`Component`, `config?`) => `FC`&lt;`P`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:457](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L457)

#### Type Parameters

##### P

`P` *extends* `object`

#### Parameters

##### Component

`ComponentType`&lt;`P`&gt;

##### config?

[`WithProviderConfig`](WithProviderConfig.md)

#### Returns

`FC`&lt;`P`&gt;

***

### contextName

> `readonly` **contextName**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:461](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L461)

***

### initialStores

> `readonly` **initialStores**: [`InitialStores`](../type-aliases/InitialStores.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:462](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L462)
