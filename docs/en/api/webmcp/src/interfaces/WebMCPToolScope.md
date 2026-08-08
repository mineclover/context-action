[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolScope

# Interface: WebMCPToolScope

Defined in: [packages/webmcp/src/index.ts:88](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L88)

## Properties

### supported

> `readonly` **supported**: `boolean`

Defined in: [packages/webmcp/src/index.ts:90](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L90)

Whether this page exposes the experimental WebMCP API.

***

### activeTools

> `readonly` **activeTools**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:92](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L92)

Names successfully registered with the page's model context.

***

### dispose

> `readonly` **dispose**: () => `void`

Defined in: [packages/webmcp/src/index.ts:94](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L94)

Abort the registration signal and unregister every tool in this scope.

#### Returns

`void`
