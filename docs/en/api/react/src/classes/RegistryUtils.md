[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RegistryUtils

# Class: RegistryUtils

Defined in: [packages/react/src/stores/utils/registry-sync.ts:39](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/utils/registry-sync.ts#L39)

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

Defined in: [packages/react/src/stores/utils/registry-sync.ts:44](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/utils/registry-sync.ts#L44)

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

Defined in: [packages/react/src/stores/utils/registry-sync.ts:55](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/utils/registry-sync.ts#L55)

Registry에 store가 존재하는지 확인
핵심 로직: null-safe 체이닝으로 안전한 존재 여부 확인

#### Parameters

##### registry

`undefined` | `null` | [`IStoreRegistry`](../interfaces/IStoreRegistry.md)

##### name

`string`

#### Returns

`boolean`
