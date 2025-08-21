[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStorePathSelector

# Function: useStorePathSelector()

> **useStorePathSelector**&lt;`T`&gt;(`store`, `path`, `equalityFn`): `any`

Defined in: [packages/react/src/stores/hooks/useStoreSelector.ts:272](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useStoreSelector.ts#L272)

Store의 깊은 경로에 있는 값을 선택적으로 구독하는 유틸리티 Hook

## Type Parameters

### Generic type T

Type parameter **T**

Store의 값 타입

## Parameters

### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

구독할 Store

### path

(`string` \| `number`)[]

객체 경로 (예: ['user', 'profile', 'name'])

### equalityFn

(`a`, `b`) => `boolean`

동등성 비교 함수

## Returns

`any`

경로에 있는 값

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#path-based-selection
