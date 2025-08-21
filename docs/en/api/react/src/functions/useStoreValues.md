[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValues

# Function: useStoreValues()

> **useStoreValues**\<`T`, `S`\>(`store`, `selectors`): `undefined` \| \{ \[K in string \| number \| symbol\]: ReturnType\<S\[K\]\> \}

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:257](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/hooks/useStoreValue.ts#L257)

Hook for selecting multiple values from a store with optimized re-renders

Subscribes to multiple computed values from a single store using selector functions.
Optimizes performance by only triggering re-renders when the selected values change,
using shallow comparison to detect changes in the combined result object.

## Type Parameters

### Generic type T

Type parameter **T**

Type of the store value

### Generic type S

`S` *extends* `Record`\<`string`, (`value`) => `any`\>

Type of the selectors object mapping keys to selector functions

## Parameters

### store

The store to subscribe to (can be undefined for conditional usage)

`undefined` | `null` | [`Store`](../classes/Store.md)&lt;`T`&gt;

### selectors

Type parameter **S**

Object mapping result keys to selector functions

## Returns

`undefined` \| \{ \[K in string \| number \| symbol\]: ReturnType\<S\[K\]\> \}

Object with selected values, or undefined if store is undefined

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usestoreselector-advanced-usage

@public\n
