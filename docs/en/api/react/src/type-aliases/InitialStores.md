[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / InitialStores

# Type Alias: InitialStores\<T\>

> **InitialStores**&lt;`T`&gt; = \{ \[K in keyof T\]: StoreConfig\<T\[K\]\> \| T\[K\] \}

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:33](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L33)

Initial Stores - Direct type mapping (for generic approach)

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
