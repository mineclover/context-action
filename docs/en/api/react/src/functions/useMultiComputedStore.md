[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useMultiComputedStore

# Function: useMultiComputedStore()

> **useMultiComputedStore**&lt;`R`&gt;(`stores`, `compute`, `config?`): `R`

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:242](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useComputedStore.ts#L242)

여러 Store 기반 Computed Hook

## Type Parameters

### Generic type R

Type parameter **R**

## Parameters

### stores

[`Store`](../classes/Store.md)&lt;`any`&gt;[]

의존성 Store들

### compute

(`values`) => `R`

계산 함수

### config?

`ComputedStoreConfig`&lt;`R`&gt;

설정 옵션

## Returns

Type parameter **R**

계산된 값

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usecomputedstore-patterns
