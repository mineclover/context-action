[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallOptions

# Interface: ToolCallOptions

Defined in: [packages/tool-protocol/src/tool-protocol.ts:520](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L520)

Transport-independent options accepted by a managed tool call.

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:521](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L521)

***

### timeout?

> `readonly` `optional` **timeout?**: `number`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:523](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L523)

Wall-clock timeout covering policy evaluation and tool execution.

***

### maxOutputBytes?

> `readonly` `optional` **maxOutputBytes?**: `number`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:525](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L525)

Optional output budget enforced at the canonical result boundary.

***

### executionOwnerId?

> `readonly` `optional` **executionOwnerId?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:527](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L527)

Optional logical owner override for execution provenance.

***

### idempotencyKey?

> `readonly` `optional` **idempotencyKey?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:529](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L529)

Stable key for one logical mutation across provider retries.

***

### interaction?

> `readonly` `optional` **interaction?**: [`ToolInteractionHandler`](../type-aliases/ToolInteractionHandler.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:531](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L531)

Invoked only after argument validation and a policy `ask` decision.

***

### context?

> `readonly` `optional` **context?**: [`ToolCallContext`](ToolCallContext.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:532](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L532)
