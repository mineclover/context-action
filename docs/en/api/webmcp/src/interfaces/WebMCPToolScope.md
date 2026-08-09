[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolScope

# Interface: WebMCPToolScope

Defined in: [packages/webmcp/src/index.ts:144](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L144)

## Properties

### supported

> `readonly` **supported**: `boolean`

Defined in: [packages/webmcp/src/index.ts:146](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L146)

Whether this page exposes the experimental WebMCP API.

***

### activeTools

> `readonly` **activeTools**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:148](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L148)

Names successfully registered with the page's model context.

***

### dispose

> `readonly` **dispose**: () => `void`

Defined in: [packages/webmcp/src/index.ts:150](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L150)

Abort the registration signal and unregister every tool in this scope.

#### Returns

`void`
