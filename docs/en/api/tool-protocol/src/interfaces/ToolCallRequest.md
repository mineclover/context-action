[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallRequest

# Interface: ToolCallRequest

Defined in: [packages/tool-protocol/src/tool-protocol.ts:328](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L328)

JSON-RPC-shaped request for MCP tools/call.

## Properties

### id?

> `readonly` `optional` **id?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:329](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L329)

***

### method

> `readonly` **method**: `"tools/call"`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:330](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L330)

***

### params

> `readonly` **params**: `object`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:331](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L331)

#### name

> `readonly` **name**: `string`

#### arguments?

> `readonly` `optional` **arguments?**: [`ToolArguments`](../type-aliases/ToolArguments.md)
