[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStore

# Function: createStore()

> **createStore**&lt;`T`&gt;(`name`, `initialValue`): [`Store`](../classes/Store.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/Store.ts:1024](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/Store.ts#L1024)

Factory function for creating type-safe Store instances

Creates a new Store instance with the specified name and initial value.
Provides type safety and integrates seamlessly with React hooks and
the Context-Action framework patterns.

## Type Parameters

### Generic type T

Type parameter **T**

The type of values stored in this store

## Parameters

### name

`string`

Unique identifier for the store (used for debugging)

### initialValue

Type parameter **T**

Initial value to store

## Returns

[`Store`](../classes/Store.md)&lt;`T`&gt;

Configured Store instance ready for use

## See

 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
 - https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
