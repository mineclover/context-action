[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreValues

# Type Alias: StoreValues\<T\>

> **StoreValues**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends StoreConfig<infer V> ? V : T[K] }`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:421](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L421)

Type helper for store values

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
