[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / InferActionResultMap

# Type Alias: InferActionResultMap\<T\>

> **InferActionResultMap**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends UnifiedAction<unknown, infer R> ? R : never }`

Defined in: [packages/tool-protocol/src/action-schema.ts:171](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L171)

Infer each action's structured output type from its optional output schema.

## Type Parameters

### Generic type T

`T` *extends* [`ActionSchemaMap`](../interfaces/ActionSchemaMap.md)
