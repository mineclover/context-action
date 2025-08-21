[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InferStoreTypes

# Type Alias: InferStoreTypes\<T\>

> **InferStoreTypes**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends StoreConfig<infer V> ? V : T[K] extends (args: any[]) => any ? never : T[K] extends object ? T[K] extends { length: number } ? T[K] : T[K] extends Date ? T[K] : T[K] : T[K] }`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:80](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L80)

Infer store value types from store definitions

Utility type that extracts the value types from store definitions,
supporting both configuration objects and direct values. Excludes
functions and properly handles arrays, dates, and objects.

## Type Parameters

### Generic type T

`T` *extends* [`StoreDefinitions`](StoreDefinitions.md)

Store definitions record

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage
