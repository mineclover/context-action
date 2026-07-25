[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / isToolListResult

# Function: isToolListResult()

> **isToolListResult**&lt;`TDefinition`&gt;(`value`): `value is ToolListResult<TDefinition>`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:351](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L351)

Runtime guard for JSON returned by the canonical tools/list boundary.

## Type Parameters

### TDefinition

`TDefinition` *extends* [`ToolDefinition`](../interfaces/ToolDefinition.md) = [`ToolDefinition`](../interfaces/ToolDefinition.md)

## Parameters

### value

`unknown`

## Returns

`value is ToolListResult<TDefinition>`
