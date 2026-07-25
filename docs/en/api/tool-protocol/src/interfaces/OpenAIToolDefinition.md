[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / OpenAIToolDefinition

# Interface: OpenAIToolDefinition

Defined in: [packages/tool-protocol/src/json-schema.ts:146](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L146)

OpenAI API Tool 정의

## See

https://platform.openai.com/docs/guides/function-calling

## Properties

### type

> **type**: `"function"`

Defined in: [packages/tool-protocol/src/json-schema.ts:147](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L147)

***

### function

> **function**: `object`

Defined in: [packages/tool-protocol/src/json-schema.ts:148](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L148)

#### name

> **name**: `string`

Function 이름

#### description?

> `optional` **description?**: `string`

Function 설명

#### parameters

> **parameters**: [`JSONSchema`](JSONSchema.md)

Parameters 스키마 (JSON Schema 형식)
