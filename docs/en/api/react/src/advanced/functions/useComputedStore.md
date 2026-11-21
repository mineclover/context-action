[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / useComputedStore

# Function: useComputedStore()

> **useComputedStore**\<`T`, `R`\>(`store`, `compute`, `config?`): `R`

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:74](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useComputedStore.ts#L74)

Hook for computed store based on a single source store

Creates a derived value that automatically recalculates when the source store changes.
Includes performance optimizations like caching, debouncing, and intelligent re-computation
to prevent unnecessary work. Perfect for derived state patterns.

## Type Parameters

### Generic type T

Type parameter **T**

Type of the source store value

### Generic type R

Type parameter **R**

Type of the computed result

## Parameters

### store

[`Store`](../../classes/Store.md)&lt;`T`&gt;

Source store to derive from

### compute

(`value`) => `R`

Function to compute derived value from store value

### config?

`ComputedStoreConfig`&lt;`R`&gt; = `{}`

Optional configuration for performance and debugging

## Returns

Type parameter **R**

The computed value that updates when source store changes

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usecomputedstore-patterns
