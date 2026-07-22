[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelInitialStores

# Type Alias: TimeTravelInitialStores\<T\>

> **TimeTravelInitialStores**&lt;`T`&gt; = \{ \[K in keyof T\]: TimeTravelStoreConfig\<T\[K\]\> \| ExplicitStoreValue\<T\[K\]\> \| T\[K\] \}

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:91](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L91)

Initial stores type for time travel pattern

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
