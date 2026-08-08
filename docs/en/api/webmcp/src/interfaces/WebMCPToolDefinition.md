[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolDefinition

# Interface: WebMCPToolDefinition

Defined in: [packages/webmcp/src/index.ts:19](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L19)

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/webmcp/src/index.ts:20](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L20)

***

### title?

> `readonly` `optional` **title?**: `string`

Defined in: [packages/webmcp/src/index.ts:21](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L21)

***

### description

> `readonly` **description**: `string`

Defined in: [packages/webmcp/src/index.ts:22](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L22)

***

### inputSchema

> `readonly` **inputSchema**: `JSONSchema`

Defined in: [packages/webmcp/src/index.ts:23](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L23)

***

### annotations?

> `readonly` `optional` **annotations?**: [`WebMCPAnnotations`](WebMCPAnnotations.md)

Defined in: [packages/webmcp/src/index.ts:24](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L24)

***

### execute

> `readonly` **execute**: (`input`) => `Promise`&lt;`unknown`&gt;

Defined in: [packages/webmcp/src/index.ts:26](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L26)

Current WebMCP Draft callback shape: exactly one input object.

#### Parameters

##### input

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`&lt;`unknown`&gt;
