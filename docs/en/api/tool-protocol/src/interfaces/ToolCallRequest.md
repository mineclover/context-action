[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallRequest

# Interface: ToolCallRequest

Defined in: packages/tool-protocol/src/tool-protocol.ts:300

JSON-RPC-shaped request for MCP tools/call.

## Properties

### id?

> `readonly` `optional` **id?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: packages/tool-protocol/src/tool-protocol.ts:301

***

### method

> `readonly` **method**: `"tools/call"`

Defined in: packages/tool-protocol/src/tool-protocol.ts:302

***

### params

> `readonly` **params**: `object`

Defined in: packages/tool-protocol/src/tool-protocol.ts:303

#### name

> `readonly` **name**: `string`

#### arguments?

> `readonly` `optional` **arguments?**: [`ToolArguments`](../type-aliases/ToolArguments.md)
