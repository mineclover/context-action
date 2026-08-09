[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/webmcp](../README.md) / useWebMCPToolScope

# Function: useWebMCPToolScope()

> **useWebMCPToolScope**&lt;`TDocument`&gt;(`manager`, `options`): [`WebMCPToolScopeState`](../interfaces/WebMCPToolScopeState.md)

Defined in: [packages/react/src/tools/useWebMCPToolScope.ts:51](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/useWebMCPToolScope.ts#L51)

Connect a canonical tool registry to the current component lifecycle.
Memoize `options` so unrelated renders do not re-register WebMCP tools.

## Type Parameters

### TDocument

`TDocument` = `WebMCPDocument`

## Parameters

### manager

`ToolManagementInterface`&lt;`ToolDefinition`&gt; \| `null` \| `undefined`

### options

`WebMCPToolScopeOptions`&lt;`TDocument`&gt;

## Returns

[`WebMCPToolScopeState`](../interfaces/WebMCPToolScopeState.md)
