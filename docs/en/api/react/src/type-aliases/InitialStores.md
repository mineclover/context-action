[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InitialStores

# Type Alias: InitialStores\<T\>

> **InitialStores**&lt;`T`&gt; = \{ \[K in keyof T\]: StoreConfig\<T\[K\]\> \| ExplicitStoreValue\<T\[K\]\> \| T\[K\] \}

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:73](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L73)

Initial stores type mapping for declarative store pattern

Maps store names to their configuration or direct initial values.
Supports both full configuration objects and direct value assignment
for simplified store definition.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

Record of store names to their value types

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
