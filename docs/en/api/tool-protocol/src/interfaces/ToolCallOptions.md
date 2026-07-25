[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallOptions

# Interface: ToolCallOptions

Defined in: [packages/tool-protocol/src/tool-protocol.ts:509](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L509)

Transport-independent options accepted by a managed tool call.

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:510](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L510)

***

### timeout?

> `readonly` `optional` **timeout?**: `number`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:512](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L512)

Wall-clock timeout covering policy evaluation and tool execution.

***

### maxOutputBytes?

> `readonly` `optional` **maxOutputBytes?**: `number`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:514](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L514)

Optional output budget enforced at the canonical result boundary.

***

### executionOwnerId?

> `readonly` `optional` **executionOwnerId?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:516](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L516)

Optional logical owner override for execution provenance.

***

### idempotencyKey?

> `readonly` `optional` **idempotencyKey?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:518](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L518)

Stable key for one logical mutation across provider retries.

***

### context?

> `readonly` `optional` **context?**: [`ToolCallContext`](ToolCallContext.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:519](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L519)
