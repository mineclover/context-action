[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createToolCallError

# Function: createToolCallError()

> **createToolCallError**(`message`, `options?`): [`ToolCallResult`](../interfaces/ToolCallResult.md)&lt;`never`&gt;

Defined in: [packages/tool-protocol/src/tool-protocol.ts:716](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L716)

Create an MCP-compatible tool error without throwing across the tool boundary.

## Parameters

### message

`string`

### options?

#### code?

`string`

#### details?

`unknown`

#### retryable?

`boolean`

#### toolCallId?

[`ToolCallId`](../type-aliases/ToolCallId.md)

## Returns

[`ToolCallResult`](../interfaces/ToolCallResult.md)&lt;`never`&gt;
