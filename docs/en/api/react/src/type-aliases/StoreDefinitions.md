[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreDefinitions

# Type Alias: StoreDefinitions

> **StoreDefinitions** = `Record`\<`string`, [`StoreConfig`](../interfaces/StoreConfig.md)&lt;`any`&gt; \| `any`\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:88](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L88)

Store definitions that can infer types from initialValue

Generic type for store definitions that supports automatic type inference.
Each store can be defined with either a full configuration or a direct value.
