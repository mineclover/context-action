[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / listAllTools

# Function: listAllTools()

> **listAllTools**&lt;`TDefinition`&gt;(`manager`, `options?`): `TDefinition`[]

Defined in: [packages/tool-protocol/src/tool-protocol.ts:602](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L602)

Collect every page from a canonical tools/list manager.

Provider adapters may use a paged registry without reimplementing cursor
handling. A repeated cursor and a configurable page limit are rejected so a
malformed remote manager cannot make an adapter loop forever.

## Type Parameters

### TDefinition

`TDefinition` *extends* [`ToolDefinition`](../interfaces/ToolDefinition.md) = [`ToolDefinition`](../interfaces/ToolDefinition.md)

## Parameters

### manager

`Pick`\<[`ToolManagementInterface`](../interfaces/ToolManagementInterface.md)&lt;`TDefinition`&gt;, `"listTools"`\>

### options?

[`ListAllToolsOptions`](../interfaces/ListAllToolsOptions.md) = `{}`

## Returns

`TDefinition`[]
