[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreDefinitions

# Type Alias: StoreDefinitions

> **StoreDefinitions** = `Record`\<`string`, [`StoreConfig`](../interfaces/StoreConfig.md)&lt;`any`&gt; \| `any`\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:65](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L65)

Store definitions that can infer types from initialValue

Generic type for store definitions that supports automatic type inference.
Each store can be defined with either a full configuration or a direct value.
