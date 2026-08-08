[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPRegistrationConfig

# Interface: WebMCPRegistrationConfig\<TDocument\>

Defined in: [packages/webmcp/src/index.ts:116](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L116)

Values that change browser capability registration and require a new scope.

## Extended by

- [`WebMCPToolScopeOptions`](WebMCPToolScopeOptions.md)

## Type Parameters

### TDocument

`TDocument` = [`WebMCPDocument`](WebMCPDocument.md)

## Properties

### sessionId

> `readonly` **sessionId**: `string`

Defined in: [packages/webmcp/src/index.ts:118](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L118)

Stable identity for the page agent session.

***

### toolNames

> `readonly` **toolNames**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:120](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L120)

Explicit capability scope; an omitted list never exposes a whole registry.

***

### document?

> `readonly` `optional` **document?**: `TDocument`

Defined in: [packages/webmcp/src/index.ts:122](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L122)

Defaults to the ambient browser document when it is available.

***

### profile?

> `readonly` `optional` **profile?**: [`WebMCPRuntimeProfile`](WebMCPRuntimeProfile.md)&lt;`TDocument`&gt;

Defined in: [packages/webmcp/src/index.ts:124](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L124)

Defaults to the current WebMCP draft profile.

***

### exposedTo?

> `readonly` `optional` **exposedTo?**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:126](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L126)

Optional cross-origin documents allowed to discover and execute these tools.

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/webmcp/src/index.ts:128](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L128)

Unregister all registered tools when aborted.
