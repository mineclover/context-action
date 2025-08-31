[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStore

# Function: createStore()

> **createStore**\<`T`\>(`name`, `initialValue`): [`Store`](../classes/Store.md)\<`T`\>

Defined in: [packages/react/src/stores/core/Store.ts:778](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/core/Store.ts#L778)

Factory function for creating type-safe Store instances

Creates a new Store instance with the specified name and initial value.
Provides type safety and integrates seamlessly with React hooks and
the Context-Action framework patterns.

## Type Parameters

### T

`T`

The type of values stored in this store

## Parameters

### name

`string`

Unique identifier for the store (used for debugging)

### initialValue

`T`

Initial value to store

## Returns

[`Store`](../classes/Store.md)\<`T`\>

Configured Store instance ready for use

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
