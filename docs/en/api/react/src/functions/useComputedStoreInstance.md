[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useComputedStoreInstance

# Function: useComputedStoreInstance()

> **useComputedStoreInstance**&lt;`R`&gt;(`dependencies`, `compute`, `config?`): [`Store`](../classes/Store.md)&lt;`R`&gt;

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:436](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useComputedStore.ts#L436)

Computed Store 인스턴스를 생성하는 Hook

계산된 값을 실제 Store 인스턴스로 반환하여 다른 곳에서 구독할 수 있게 합니다.

## Type Parameters

### Generic type R

Type parameter **R**

## Parameters

### dependencies

[`Store`](../classes/Store.md)&lt;`any`&gt;[]

의존성 Store들

### compute

(`values`) => `R`

계산 함수

### config?

`ComputedStoreConfig`&lt;`R`&gt;

설정 옵션

## Returns

[`Store`](../classes/Store.md)&lt;`R`&gt;

계산된 값을 가진 Store 인스턴스

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#computed-store-instances
