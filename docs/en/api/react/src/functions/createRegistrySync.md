[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createRegistrySync

# Function: createRegistrySync()

> **createRegistrySync**&lt;`T`&gt;(): `object`

Defined in: [packages/react/src/stores/utils/registry-sync.ts:13](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/utils/registry-sync.ts#L13)

Factory for creating registry sync hooks
핵심 기능: Registry에서 동적으로 store에 접근하는 표준화된 인터페이스 제공

## Type Parameters

### Generic type T

`T` = `any`

Store value type

## Returns

Registry sync methods

### useDynamicStore()

> **useDynamicStore**(`registry`, `storeName`): `undefined` \| `T`

Registry에서 이름으로 store 값을 동적으로 가져오기
핵심 로직: registry.getStore() → useStoreSelector() → value 추출

#### Parameters

##### registry

`undefined` | `null` | [`IStoreRegistry`](../interfaces/IStoreRegistry.md)

##### storeName

`string`

#### Returns

`undefined` \| `T`

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#dynamic-store-access
