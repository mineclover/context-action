[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / MCPToolDefinition

# Interface: MCPToolDefinition

Defined in: [packages/tool-protocol/src/json-schema.ts:139](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L139)

MCP (Model Context Protocol) Tool 정의

## See

https://modelcontextprotocol.io/docs/concepts/tools

## Extends

- [`ToolDefinition`](ToolDefinition.md)

## Properties

### name

> **name**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:121](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L121)

Tool name (unique identifier)

#### Inherited from

[`ToolDefinition`](ToolDefinition.md).[`name`](ToolDefinition.md#name)

***

### title?

> `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:123](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L123)

Optional human-facing title

#### Inherited from

[`ToolDefinition`](ToolDefinition.md).[`title`](ToolDefinition.md#title)

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:125](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L125)

Description used by the model for tool selection

#### Inherited from

[`ToolDefinition`](ToolDefinition.md).[`description`](ToolDefinition.md#description)

***

### inputSchema

> **inputSchema**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:127](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L127)

Input schema in JSON Schema format

#### Inherited from

[`ToolDefinition`](ToolDefinition.md).[`inputSchema`](ToolDefinition.md#inputschema)

***

### outputSchema?

> `optional` **outputSchema?**: [`JSONSchema`](JSONSchema.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:129](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L129)

Optional structured output schema

#### Inherited from

[`ToolDefinition`](ToolDefinition.md).[`outputSchema`](ToolDefinition.md#outputschema)

***

### annotations?

> `optional` **annotations?**: [`ToolAnnotations`](ToolAnnotations.md)

Defined in: [packages/tool-protocol/src/json-schema.ts:131](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L131)

Optional behavioral hints

#### Inherited from

[`ToolDefinition`](ToolDefinition.md).[`annotations`](ToolDefinition.md#annotations)
