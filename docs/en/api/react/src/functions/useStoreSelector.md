[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreSelector

# Function: useStoreSelector()

> **useStoreSelector**\<`T`, `R`\>(`store`, `selector`, `equalityFn`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreSelector.ts:41](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/hooks/useStoreSelector.ts#L41)

Hook for selective store subscription with performance optimization

Subscribes to specific parts of store data using a selector function,
triggering re-renders only when the selected value actually changes.
Essential for preventing unnecessary re-renders in complex applications.

## Type Parameters

### T

`T`

Type of the store value

### R

`R`

Type of the value returned by the selector

## Parameters

### store

[`Store`](../classes/Store.md)\<`T`\>

Store instance to subscribe to

### selector

(`value`) => `R`

Function to extract needed data from store value

### equalityFn

(`a`, `b`) => `boolean`

Function to compare previous and new values (default: Object.is)

## Returns

`R`

The value returned by the selector function

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-hooks#usestoreselector-advanced-usage
