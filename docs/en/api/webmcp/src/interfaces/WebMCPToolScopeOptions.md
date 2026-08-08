[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolScopeOptions

# Interface: WebMCPToolScopeOptions

Defined in: [packages/webmcp/src/index.ts:69](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L69)

## Properties

### sessionId

> `readonly` **sessionId**: `string`

Defined in: [packages/webmcp/src/index.ts:71](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L71)

Stable identity for the page agent session.

***

### toolNames

> `readonly` **toolNames**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:73](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L73)

Explicit capability scope; an omitted list never exposes a whole registry.

***

### document?

> `readonly` `optional` **document?**: [`WebMCPDocument`](WebMCPDocument.md)

Defined in: [packages/webmcp/src/index.ts:75](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L75)

Defaults to the ambient browser document when it is available.

***

### exposedTo?

> `readonly` `optional` **exposedTo?**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:77](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L77)

Optional cross-origin documents allowed to discover and execute these tools.

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/webmcp/src/index.ts:79](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L79)

Unregister all registered tools when aborted.

***

### context?

> `readonly` `optional` **context?**: `Omit`\<`ToolCallContext`, `"source"` \| `"mode"` \| `"sessionId"`\>

Defined in: [packages/webmcp/src/index.ts:80](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L80)

***

### callOptions?

> `readonly` `optional` **callOptions?**: `Omit`\<`ToolCallOptions`, `"signal"` \| `"context"` \| `"idempotencyKey"`\>

Defined in: [packages/webmcp/src/index.ts:81](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L81)

***

### beforeExecute?

> `readonly` `optional` **beforeExecute?**: [`WebMCPBeforeExecute`](../type-aliases/WebMCPBeforeExecute.md)

Defined in: [packages/webmcp/src/index.ts:83](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L83)

Optional bridge for WebMCP's native user-interaction client.

***

### getIdempotencyKey?

> `readonly` `optional` **getIdempotencyKey?**: [`WebMCPIdempotencyKeyFactory`](../type-aliases/WebMCPIdempotencyKeyFactory.md)

Defined in: [packages/webmcp/src/index.ts:85](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L85)

Domain-owned retry identity; omitted by default because WebMCP has no native call ID.
