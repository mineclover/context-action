[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / AnthropicToolDefinition

# Interface: AnthropicToolDefinition

Defined in: [packages/tool-protocol/src/json-schema.ts:165](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L165)

Anthropic API Tool 정의

## See

https://docs.anthropic.com/en/docs/build-with-claude/tool-use

## Properties

### name

> **name**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:167](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L167)

Tool 이름

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:169](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L169)

Tool 설명

***

### input\_schema

> **input\_schema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:171](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L171)

Input 스키마 (JSON Schema 형식)
