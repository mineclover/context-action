[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createRegistrySync

# Function: createRegistrySync()

> **createRegistrySync**&lt;`T`&gt;(): `object`

Defined in: [packages/react/src/stores/utils/registry-sync.ts:17](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/utils/registry-sync.ts#L17)

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

## Example

```typescript
const sync = createRegistrySync<UserData>();
const userData = sync.useDynamicStore(registry, 'user');
```
