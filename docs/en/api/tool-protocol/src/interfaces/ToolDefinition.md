[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolDefinition

# Interface: ToolDefinition

Defined in: [packages/tool-protocol/src/json-schema.ts:121](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L121)

Canonical tool definition shared by MCP and local tool managers.

## Extended by

- [`MCPToolDefinition`](MCPToolDefinition.md)

## Properties

### name

> **name**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:123](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L123)

Tool name (unique identifier)

***

### title?

> `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:125](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L125)

Optional human-facing title

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:127](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L127)

Description used by the model for tool selection

***

### inputSchema

> **inputSchema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:129](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L129)

Input schema in JSON Schema format

***

### outputSchema?

> `optional` **outputSchema?**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:131](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L131)

Optional structured output schema

***

### annotations?

> `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:133](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L133)

Optional behavioral hints
