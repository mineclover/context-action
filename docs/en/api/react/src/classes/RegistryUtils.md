[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RegistryUtils

# Class: RegistryUtils

Defined in: [packages/react/src/stores/utils/registry-sync.ts:35](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/utils/registry-sync.ts#L35)

Registry 유틸리티 클래스
핵심 기능: Registry 상태 조회 및 검색을 위한 정적 메서드 제공

## Constructors

### Constructor

> **new RegistryUtils**(): `RegistryUtils`

#### Returns

Type parameter **RegistryUtils**

## Methods

### getTypedStore()

> `static` **getTypedStore**&lt;`T`&gt;(`registry`, `name`): `undefined` \| [`IStore`](../interfaces/IStore.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/utils/registry-sync.ts:40](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/utils/registry-sync.ts#L40)

Registry에서 타입 안전한 store 가져오기
핵심 로직: 타입 캐스팅을 통한 타입 안전성 보장

#### Type Parameters

##### T

Type parameter **T**

#### Parameters

##### registry

`undefined` | `null` | [`IStoreRegistry`](../interfaces/IStoreRegistry.md)

##### name

`string`

#### Returns

`undefined` \| [`IStore`](../interfaces/IStore.md)&lt;`T`&gt;

***

### hasStore()

> `static` **hasStore**(`registry`, `name`): `boolean`

Defined in: [packages/react/src/stores/utils/registry-sync.ts:51](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/utils/registry-sync.ts#L51)

Registry에 store가 존재하는지 확인
핵심 로직: null-safe 체이닝으로 안전한 존재 여부 확인

#### Parameters

##### registry

`undefined` | `null` | [`IStoreRegistry`](../interfaces/IStoreRegistry.md)

##### name

`string`

#### Returns

`boolean`
