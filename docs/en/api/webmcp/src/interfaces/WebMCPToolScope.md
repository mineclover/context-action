[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolScope

# Interface: WebMCPToolScope

Defined in: [packages/webmcp/src/index.ts:71](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L71)

## Properties

### supported

> `readonly` **supported**: `boolean`

Defined in: [packages/webmcp/src/index.ts:73](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L73)

Whether this page exposes the experimental WebMCP API.

***

### activeTools

> `readonly` **activeTools**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:75](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L75)

Names successfully registered with the page's model context.

***

### dispose

> `readonly` **dispose**: () => `void`

Defined in: [packages/webmcp/src/index.ts:77](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L77)

Abort the registration signal and unregister every tool in this scope.

#### Returns

`void`
