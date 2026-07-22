[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolDefinition

# Interface: ToolDefinition

Defined in: packages/tool-protocol/src/json-schema.ts:119

Canonical tool definition shared by MCP and local tool managers.

## Extended by

- [`MCPToolDefinition`](MCPToolDefinition.md)

## Properties

### name

> **name**: `string`

Defined in: packages/tool-protocol/src/json-schema.ts:121

Tool name (unique identifier)

***

### title?

> `optional` **title?**: `string`

Defined in: packages/tool-protocol/src/json-schema.ts:123

Optional human-facing title

***

### description?

> `optional` **description?**: `string`

Defined in: packages/tool-protocol/src/json-schema.ts:125

Description used by the model for tool selection

***

### inputSchema

> **inputSchema**: [`JSONSchema`](JSONSchema.md)

Defined in: packages/tool-protocol/src/json-schema.ts:127

Input schema in JSON Schema format

***

### outputSchema?

> `optional` **outputSchema?**: [`JSONSchema`](JSONSchema.md)

Defined in: packages/tool-protocol/src/json-schema.ts:129

Optional structured output schema

***

### annotations?

> `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: packages/tool-protocol/src/json-schema.ts:131

Optional behavioral hints
