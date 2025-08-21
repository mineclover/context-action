[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useAsyncComputedStore

# Function: useAsyncComputedStore()

> **useAsyncComputedStore**&lt;`R`&gt;(`dependencies`, `compute`, `config`): `object`

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:469](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useComputedStore.ts#L469)

비동기 계산을 지원하는 Computed Store Hook

## Type Parameters

### Generic type R

Type parameter **R**

## Parameters

### dependencies

[`Store`](../classes/Store.md)&lt;`any`&gt;[]

### compute

(`values`) => `Promise`&lt;`R`&gt;

### config

`ComputedStoreConfig`&lt;`R`&gt; & `object` = `{}`

## Returns

`object`

### value

> **value**: `R`

### loading

> **loading**: `boolean`

### error

> **error**: `null` \| `Error`

### reload()

> **reload**: () => `void`

#### Returns

`void`

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#async-computed-patterns
