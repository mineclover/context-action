[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / StoreSyncConfig

# Interface: StoreSyncConfig\<T, R\>

Defined in: [packages/react/src/stores/core/types.ts:271](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L271)

## Type Parameters

### Generic type T

Type parameter **T**

### Generic type R

`R` = [`Snapshot`](../../interfaces/Snapshot.md)&lt;`T`&gt;

## Properties

### defaultValue?

> `optional` **defaultValue?**: `T`

Defined in: [packages/react/src/stores/core/types.ts:273](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L273)

기본값 (초기 렌더링용)

***

### selector?

> `optional` **selector?**: (`snapshot`) => `R`

Defined in: [packages/react/src/stores/core/types.ts:275](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L275)

선택적 구독 (성능 최적화)

#### Parameters

##### snapshot

[`Snapshot`](../../interfaces/Snapshot.md)&lt;`T`&gt;

#### Returns

Type parameter **R**

***

### isEqual?

> `optional` **isEqual?**: (`prev`, `next`) => `boolean`

Defined in: [packages/react/src/stores/core/types.ts:277](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L277)

Equality function for selector results

#### Parameters

##### prev

Type parameter **R**

##### next

Type parameter **R**

#### Returns

`boolean`

***

### errorBoundary?

> `optional` **errorBoundary?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:279](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L279)

Enable error boundary integration

***

### suspense?

> `optional` **suspense?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:281](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L281)

Suspension support for concurrent features
