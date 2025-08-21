[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreValues

# Type Alias: StoreValues\<T\>

> **StoreValues**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends StoreConfig<infer V> ? V : T[K] }`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:421](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L421)

Type helper for store values

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
