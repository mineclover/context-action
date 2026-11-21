[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallOptions

# Interface: ToolCallOptions

Defined in: [packages/tool-protocol/src/tool-protocol.ts:537](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L537)

Transport-independent options accepted by a managed tool call.

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:538](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L538)

***

### timeout?

> `readonly` `optional` **timeout?**: `number`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:540](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L540)

Wall-clock timeout covering policy evaluation and tool execution.

***

### maxOutputBytes?

> `readonly` `optional` **maxOutputBytes?**: `number`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:542](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L542)

Optional output budget enforced at the canonical result boundary.

***

### executionOwnerId?

> `readonly` `optional` **executionOwnerId?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:544](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L544)

Optional logical owner override for execution provenance.

***

### idempotencyKey?

> `readonly` `optional` **idempotencyKey?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:546](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L546)

Stable key for one logical mutation across provider retries.

***

### interaction?

> `readonly` `optional` **interaction?**: [`ToolInteractionHandler`](../type-aliases/ToolInteractionHandler.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:548](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L548)

Invoked only after argument validation and a policy `ask` decision.

***

### context?

> `readonly` `optional` **context?**: [`ToolCallContext`](ToolCallContext.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:549](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L549)
