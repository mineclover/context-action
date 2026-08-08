[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPExecutionOptions

# Interface: WebMCPExecutionOptions

Defined in: [packages/webmcp/src/index.ts:132](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L132)

Values read at browser-tool invocation time without re-registering tools.

## Extended by

- [`WebMCPToolScopeOptions`](WebMCPToolScopeOptions.md)

## Properties

### context?

> `readonly` `optional` **context?**: `Omit`\<`ToolCallContext`, `"source"` \| `"mode"` \| `"sessionId"`\>

Defined in: [packages/webmcp/src/index.ts:133](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L133)

***

### callOptions?

> `readonly` `optional` **callOptions?**: `Omit`\<`ToolCallOptions`, `"signal"` \| `"context"` \| `"idempotencyKey"` \| `"interaction"`\>

Defined in: [packages/webmcp/src/index.ts:134](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L134)

***

### ~~beforeExecute?~~

> `readonly` `optional` **beforeExecute?**: [`WebMCPBeforeExecute`](../type-aliases/WebMCPBeforeExecute.md)

Defined in: [packages/webmcp/src/index.ts:136](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L136)

#### Deprecated

Post-execution compatibility notification.

***

### afterExecute?

> `readonly` `optional` **afterExecute?**: [`WebMCPAfterExecute`](../type-aliases/WebMCPAfterExecute.md)

Defined in: [packages/webmcp/src/index.ts:138](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L138)

Detached notification after canonical execution has committed.

***

### onObserverError?

> `readonly` `optional` **onObserverError?**: (`error`) => `void`

Defined in: [packages/webmcp/src/index.ts:140](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L140)

Receives detached post-execution notification failures.

#### Parameters

##### error

`unknown`

#### Returns

`void`

***

### interaction?

> `readonly` `optional` **interaction?**: `ToolInteractionHandler`

Defined in: [packages/webmcp/src/index.ts:142](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L142)

Canonical approval handler, called only after validation and policy ask.

***

### errorMode?

> `readonly` `optional` **errorMode?**: [`WebMCPErrorMode`](../type-aliases/WebMCPErrorMode.md)

Defined in: [packages/webmcp/src/index.ts:144](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L144)

Default `structured` preserves Context-Action's structured error envelope.

***

### getIdempotencyKey?

> `readonly` `optional` **getIdempotencyKey?**: [`WebMCPIdempotencyKeyFactory`](../type-aliases/WebMCPIdempotencyKeyFactory.md)

Defined in: [packages/webmcp/src/index.ts:146](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L146)

Domain-owned retry identity; omitted by default because WebMCP has no native call ID.
