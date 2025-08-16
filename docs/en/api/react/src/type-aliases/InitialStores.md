[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InitialStores

# Type Alias: InitialStores\<T\>

> **InitialStores**&lt;`T`&gt; = \{ \[K in keyof T\]: StoreConfig\<T\[K\]\> \| T\[K\] \}

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:33](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L33)

Initial Stores - Direct type mapping (for generic approach)

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
