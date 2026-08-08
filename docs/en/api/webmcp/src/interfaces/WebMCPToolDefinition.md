[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolDefinition

# Interface: WebMCPToolDefinition

Defined in: [packages/webmcp/src/index.ts:18](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L18)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/webmcp/src/index.ts:19](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L19)

***

### description

> `readonly` **description**: `string`

Defined in: [packages/webmcp/src/index.ts:20](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L20)

***

### inputSchema

> `readonly` **inputSchema**: `JSONSchema`

Defined in: [packages/webmcp/src/index.ts:21](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L21)

***

### annotations?

> `readonly` `optional` **annotations?**: `ToolAnnotations`

Defined in: [packages/webmcp/src/index.ts:22](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L22)

***

### execute

> `readonly` **execute**: (`input`) => `Promise`&lt;`unknown`&gt;

Defined in: [packages/webmcp/src/index.ts:23](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L23)

#### Parameters

##### input

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`&lt;`unknown`&gt;
