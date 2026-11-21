[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / DynamicStoreOptions

# Interface: DynamicStoreOptions\<T\>

Defined in: [packages/react/src/stores/core/types.ts:390](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L390)

Enhanced dynamic store options with advanced features

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### defaultValue?

> `optional` **defaultValue?**: `T`

Defined in: [packages/react/src/stores/core/types.ts:392](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L392)

기본값

***

### createIfNotExists?

> `optional` **createIfNotExists?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:394](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L394)

없을 때 자동 생성 여부

***

### onNotFound?

> `optional` **onNotFound?**: (`storeName`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:396](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L396)

Store 찾기 실패 콜백

#### Parameters

##### storeName

`string`

#### Returns

`void`

***

### securityOptions?

> `optional` **securityOptions?**: `SecurityOptions`

Defined in: [packages/react/src/stores/core/types.ts:398](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L398)

Security options for auto-created stores

***

### autoCleanup?

> `optional` **autoCleanup?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:400](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L400)

Cleanup options for auto-created stores

***

### enableMetrics?

> `optional` **enableMetrics?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:402](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L402)

Performance monitoring for auto-created stores
