[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / getToolCallErrorMetadata

# Function: getToolCallErrorMetadata()

> **getToolCallErrorMetadata**(`error`): [`ToolCallErrorMetadata`](../type-aliases/ToolCallErrorMetadata.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:276](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L276)

Read optional structured error metadata from a handler-thrown value.
Applications can use a custom Error subclass without coupling handlers to a
transport-specific result object.

## Parameters

### error

`unknown`

## Returns

[`ToolCallErrorMetadata`](../type-aliases/ToolCallErrorMetadata.md)
