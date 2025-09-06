[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreSelector

# Function: useStoreSelector()

> **useStoreSelector**\<`T`, `R`\>(`store`, `selector`, `equalityFn`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreSelector.ts:41](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/stores/hooks/useStoreSelector.ts#L41)

Hook for selective store subscription with performance optimization

Subscribes to specific parts of store data using a selector function,
triggering re-renders only when the selected value actually changes.
Essential for preventing unnecessary re-renders in complex applications.

## Type Parameters

### Generic type T

Type parameter **T**

Type of the store value

### Generic type R

Type parameter **R**

Type of the value returned by the selector

## Parameters

### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

Store instance to subscribe to

### selector

(`value`) => `R`

Function to extract needed data from store value

### equalityFn

(`a`, `b`) => `boolean`

Function to compare previous and new values (default: Object.is)

## Returns

Type parameter **R**

The value returned by the selector function

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usestoreselector-advanced-usage
