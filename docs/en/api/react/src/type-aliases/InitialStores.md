[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InitialStores

# Type Alias: InitialStores\<T\>

> **InitialStores**\<`T`\> = \{ \[K in keyof T\]: StoreConfig\<T\[K\]\> \| T\[K\] \}

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:53](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L53)

Initial stores type mapping for declarative store pattern

Maps store names to their configuration or direct initial values.
Supports both full configuration objects and direct value assignment
for simplified store definition.

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `any`\>

Record of store names to their value types

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
