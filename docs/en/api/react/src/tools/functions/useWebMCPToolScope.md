[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / useWebMCPToolScope

# Function: useWebMCPToolScope()

> **useWebMCPToolScope**(`manager`, `options`): [`WebMCPToolScopeState`](../interfaces/WebMCPToolScopeState.md)

Defined in: [packages/react/src/tools/useWebMCPToolScope.ts:50](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/useWebMCPToolScope.ts#L50)

Connect a canonical tool registry to the current component lifecycle.
Memoize `options` so unrelated renders do not re-register WebMCP tools.

## Parameters

### manager

`ToolManagementInterface`&lt;`ToolDefinition`&gt; \| `null` \| `undefined`

### options

Type parameter **WebMCPToolScopeOptions**

## Returns

[`WebMCPToolScopeState`](../interfaces/WebMCPToolScopeState.md)
