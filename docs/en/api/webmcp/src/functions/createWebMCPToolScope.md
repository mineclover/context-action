[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / createWebMCPToolScope

# Function: createWebMCPToolScope()

> **createWebMCPToolScope**(`manager`, `options`): `Promise`\<[`WebMCPToolScope`](../interfaces/WebMCPToolScope.md)\>

Defined in: [packages/webmcp/src/index.ts:102](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L102)

Register an explicit canonical capability scope with WebMCP's imperative
API. Unsupported browsers return an inert scope instead of failing SSR or
non-browser consumers.

## Parameters

### manager

Type parameter **ToolManagementInterface**

### options

[`WebMCPToolScopeOptions`](../interfaces/WebMCPToolScopeOptions.md)

## Returns

`Promise`\<[`WebMCPToolScope`](../interfaces/WebMCPToolScope.md)\>
