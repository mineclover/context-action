[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreRegistry

# Class: StoreRegistry

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:27](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L27)

Store Registry - 여러 Store 인스턴스를 중앙 관리

핵심 기능:
1. Store 등록/해제 (register/unregister) - 이름으로 Store 관리
2. Store 조회 (getStore) - 이름으로 Store 인스턴스 반환
3. Registry 구독 (subscribe) - Store 목록 변경 감지
4. 메타데이터 관리 - Store별 추가 정보 저장

## Implements

store-registry

## Memberof

core-concepts

## Implements

- [`IStoreRegistry`](../interfaces/IStoreRegistry.md)

## Constructors

### Constructor

> **new StoreRegistry**(`name`): `StoreRegistry`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:37](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L37)

#### Parameters

##### name

`string` = `'default'`

#### Returns

Type parameter **StoreRegistry**

## Methods

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:46](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L46)

Subscribe to registry changes (store additions/removals)

#### Parameters

##### listener

[`Listener`](../type-aliases/Listener.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implements

store-hooks

#### Memberof

api-terms

#### Implementation of

`IStoreRegistry.subscribe`

***

### getSnapshot()

> **getSnapshot**(): \[`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\][]

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:57](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L57)

Get current snapshot of all stores

#### Returns

\[`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\][]

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getSnapshot`](../interfaces/IStoreRegistry.md#getsnapshot)

***

### register()

> **register**(`name`, `store`, `metadata?`): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:66](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L66)

Register a store with optional metadata

#### Parameters

##### name

`string`

##### store

[`IStore`](../interfaces/IStore.md)

##### metadata?

`Partial`&lt;`StoreMetadata`&gt;

#### Returns

`void`

#### Implements

store-integration-pattern

#### Memberof

core-concepts

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`register`](../interfaces/IStoreRegistry.md#register)

***

### unregister()

> **unregister**(`name`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:88](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L88)

Unregister a store

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`unregister`](../interfaces/IStoreRegistry.md#unregister)

***

### getStore()

> **getStore**(`name`): `undefined` \| [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:113](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L113)

Get a specific store

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;

#### Implements

lazy-evaluation

#### Memberof

architecture-terms

Enables lazy evaluation of store values in action handlers

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getStore`](../interfaces/IStoreRegistry.md#getstore)

***

### getAllStores()

> **getAllStores**(): `Map`\<`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\>

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:121](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L121)

Get all stores as a new Map

#### Returns

`Map`\<`string`, [`IStore`](../interfaces/IStore.md)&lt;`any`&gt;\>

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getAllStores`](../interfaces/IStoreRegistry.md#getallstores)

***

### hasStore()

> **hasStore**(`name`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:128](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L128)

Check if a store exists

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`hasStore`](../interfaces/IStoreRegistry.md#hasstore)

***

### getStoreCount()

> **getStoreCount**(): `number`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:135](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L135)

Get number of registered stores

#### Returns

`number`

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getStoreCount`](../interfaces/IStoreRegistry.md#getstorecount)

***

### getStoreNames()

> **getStoreNames**(): `string`[]

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:142](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L142)

Get all store names

#### Returns

`string`[]

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`getStoreNames`](../interfaces/IStoreRegistry.md#getstorenames)

***

### getStoreMetadata()

> **getStoreMetadata**(`name`): `undefined` \| `StoreMetadata`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:149](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L149)

Get metadata for a store

#### Parameters

##### name

`string`

#### Returns

`undefined` \| `StoreMetadata`

***

### updateStoreMetadata()

> **updateStoreMetadata**(`name`, `updates`): `boolean`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:157](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L157)

Update metadata for a store

#### Parameters

##### name

`string`

##### updates

`Partial`&lt;`StoreMetadata`&gt;

#### Returns

`boolean`

***

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:175](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L175)

Clear all stores

#### Returns

`void`

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`clear`](../interfaces/IStoreRegistry.md#clear)

***

### forEach()

> **forEach**(`callback`): `void`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:191](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L191)

Execute a function for each store

#### Parameters

##### callback

(`store`, `name`) => `void`

#### Returns

`void`

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`forEach`](../interfaces/IStoreRegistry.md#foreach)

***

### filter()

> **filter**(`predicate`): `StoreRegistry`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:200](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L200)

Create a new registry with filtered stores

#### Parameters

##### predicate

(`store`, `name`) => `boolean`

#### Returns

Type parameter **StoreRegistry**

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/StoreRegistry.ts:36](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/StoreRegistry.ts#L36)

Unique identifier for the registry

#### Implementation of

[`IStoreRegistry`](../interfaces/IStoreRegistry.md).[`name`](../interfaces/IStoreRegistry.md#name)
