[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolScopeOptions

# Interface: WebMCPToolScopeOptions

Defined in: [packages/webmcp/src/index.ts:55](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L55)

## Properties

### sessionId

> `readonly` **sessionId**: `string`

Defined in: [packages/webmcp/src/index.ts:57](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L57)

Stable identity for the page agent session.

***

### toolNames

> `readonly` **toolNames**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:59](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L59)

Explicit capability scope; an omitted list never exposes a whole registry.

***

### document?

> `readonly` `optional` **document?**: [`WebMCPDocument`](WebMCPDocument.md)

Defined in: [packages/webmcp/src/index.ts:61](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L61)

Defaults to the ambient browser document when it is available.

***

### exposedTo?

> `readonly` `optional` **exposedTo?**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:63](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L63)

Optional cross-origin documents allowed to discover and execute these tools.

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/webmcp/src/index.ts:65](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L65)

Unregister all registered tools when aborted.

***

### context?

> `readonly` `optional` **context?**: `Omit`\<`ToolCallContext`, `"source"` \| `"mode"` \| `"sessionId"`\>

Defined in: [packages/webmcp/src/index.ts:66](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L66)

***

### callOptions?

> `readonly` `optional` **callOptions?**: `Omit`\<`ToolCallOptions`, `"signal"` \| `"context"` \| `"idempotencyKey"`\>

Defined in: [packages/webmcp/src/index.ts:67](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L67)

***

### getIdempotencyKey?

> `readonly` `optional` **getIdempotencyKey?**: [`WebMCPIdempotencyKeyFactory`](../type-aliases/WebMCPIdempotencyKeyFactory.md)

Defined in: [packages/webmcp/src/index.ts:68](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L68)
