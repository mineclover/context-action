[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / AnthropicToolDefinition

# Interface: AnthropicToolDefinition

Defined in: [packages/tool-protocol/src/json-schema.ts:171](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L171)

Anthropic API Tool 정의

## See

https://docs.anthropic.com/en/docs/build-with-claude/tool-use

## Properties

### name

> **name**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:173](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L173)

Tool 이름

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:175](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L175)

Tool 설명

***

### input\_schema

> **input\_schema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:177](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L177)

Input 스키마 (JSON Schema 형식)
