[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / fromStandardSchema

# Function: fromStandardSchema()

> **fromStandardSchema**\<`TInput`, `TOutput`\>(`schema`): `ActionSchemaLike`

Defined in: [packages/xstate/src/effect.ts:240](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L240)

Adapts a `@standard-schema/spec` v1 schema (including Effect v4 `Schema.toStandardSchemaV1`)
into `@context-action/core`'s synchronous `ActionSchemaLike` contract for `new ActionRegister({ schema })`.

## Type Parameters

### TInput

`TInput` = `unknown`

### TOutput

`TOutput` = `TInput`

## Parameters

### schema

[`StandardSchemaV1Like`](../interfaces/StandardSchemaV1Like.md)\<`TInput`, `TOutput`\>

## Returns

`ActionSchemaLike`
