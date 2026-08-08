[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPToolScopeOptions

# Interface: WebMCPToolScopeOptions

Defined in: [packages/webmcp/src/index.ts:73](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L73)

## Properties

### sessionId

> `readonly` **sessionId**: `string`

Defined in: [packages/webmcp/src/index.ts:75](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L75)

Stable identity for the page agent session.

***

### toolNames

> `readonly` **toolNames**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:77](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L77)

Explicit capability scope; an omitted list never exposes a whole registry.

***

### document?

> `readonly` `optional` **document?**: [`WebMCPDocument`](WebMCPDocument.md)

Defined in: [packages/webmcp/src/index.ts:79](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L79)

Defaults to the ambient browser document when it is available.

***

### exposedTo?

> `readonly` `optional` **exposedTo?**: readonly `string`[]

Defined in: [packages/webmcp/src/index.ts:81](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L81)

Optional cross-origin documents allowed to discover and execute these tools.

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/webmcp/src/index.ts:83](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L83)

Unregister all registered tools when aborted.

***

### context?

> `readonly` `optional` **context?**: `Omit`\<`ToolCallContext`, `"source"` \| `"mode"` \| `"sessionId"`\>

Defined in: [packages/webmcp/src/index.ts:84](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L84)

***

### callOptions?

> `readonly` `optional` **callOptions?**: `Omit`\<`ToolCallOptions`, `"signal"` \| `"context"` \| `"idempotencyKey"`\>

Defined in: [packages/webmcp/src/index.ts:85](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L85)

***

### beforeExecute?

> `readonly` `optional` **beforeExecute?**: [`WebMCPBeforeExecute`](../type-aliases/WebMCPBeforeExecute.md)

Defined in: [packages/webmcp/src/index.ts:87](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L87)

Optional application hook; this is not a native WebMCP client bridge.

***

### errorMode?

> `readonly` `optional` **errorMode?**: [`WebMCPErrorMode`](../type-aliases/WebMCPErrorMode.md)

Defined in: [packages/webmcp/src/index.ts:89](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L89)

Default `result` preserves Context-Action's structured error envelope.

***

### getIdempotencyKey?

> `readonly` `optional` **getIdempotencyKey?**: [`WebMCPIdempotencyKeyFactory`](../type-aliases/WebMCPIdempotencyKeyFactory.md)

Defined in: [packages/webmcp/src/index.ts:91](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L91)

Domain-owned retry identity; omitted by default because WebMCP has no native call ID.
