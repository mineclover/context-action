[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / createWebMCPToolScope

# Function: createWebMCPToolScope()

> **createWebMCPToolScope**&lt;`TDocument`&gt;(`manager`, `options`): `Promise`\<[`WebMCPToolScope`](../interfaces/WebMCPToolScope.md)\>

Defined in: [packages/webmcp/src/index.ts:171](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L171)

Register an explicit canonical capability scope with WebMCP's imperative
API. Unsupported browsers return an inert scope instead of failing SSR or
non-browser consumers.

## Type Parameters

### TDocument

`TDocument` = [`WebMCPDocument`](../interfaces/WebMCPDocument.md)

## Parameters

### manager

Type parameter **ToolManagementInterface**

### options

[`WebMCPToolScopeOptions`](../interfaces/WebMCPToolScopeOptions.md)&lt;`TDocument`&gt;

## Returns

`Promise`\<[`WebMCPToolScope`](../interfaces/WebMCPToolScope.md)\>
