[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ActionFactory

# Type Alias: ActionFactory

> **ActionFactory** = \<`TSchema`, `TOutputSchema`\>(`options`) => [`ActionDefinition`](../interfaces/ActionDefinition.md)\<`TSchema`, `TOutputSchema`\>

Defined in: [packages/tool-protocol/src/action-schema.ts:197](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/action-schema.ts#L197)

A Zod-bound action factory that preserves input and output schema inference.

## Type Parameters

### TSchema

`TSchema` *extends* `ZodRawShape`

### TOutputSchema

`TOutputSchema` *extends* `ZodTypeAny` \| `undefined` = `undefined`

## Parameters

### options

[`DefineActionOptions`](../interfaces/DefineActionOptions.md)\<`TSchema`, `TOutputSchema`\>

## Returns

[`ActionDefinition`](../interfaces/ActionDefinition.md)\<`TSchema`, `TOutputSchema`\>
