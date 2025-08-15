[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InferStoreTypes

# Type Alias: InferStoreTypes\<T\>

> **InferStoreTypes**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends StoreConfig<infer V> ? V : T[K] extends (args: any[]) => any ? never : T[K] extends object ? T[K] extends { length: number } ? T[K] : T[K] extends Date ? T[K] : T[K] : T[K] }`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:45](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L45)

Infer store types from store definitions

## Type Parameters

### Generic type T

`T` *extends* [`StoreDefinitions`](StoreDefinitions.md)
