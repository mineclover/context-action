[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / InferActionInputMap

# Type Alias: InferActionInputMap\<T\>

> **InferActionInputMap**&lt;`T`&gt; = `{ [K in keyof T]: T[K] extends UnifiedAction<unknown, unknown, infer TInputSchema> ? z.input<TInputSchema> : never }`

Defined in: [packages/tool-protocol/src/action-schema.ts:190](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L190)

Infer the unparsed input accepted by each action's Zod parameter schema.

## Type Parameters

### Generic type T

`T` *extends* [`ActionSchemaMap`](../interfaces/ActionSchemaMap.md)
