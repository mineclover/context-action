[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallEvent

# Type Alias: ToolCallEvent

> **ToolCallEvent** = \{ `type`: `"started"`; `toolCallId?`: [`ToolCallId`](ToolCallId.md); `name`: `string`; `request`: [`ToolCallRequest`](../interfaces/ToolCallRequest.md); `context?`: [`ToolCallContext`](../interfaces/ToolCallContext.md); `timestamp`: `number`; `provenance`: [`ToolExecutionProvenance`](../interfaces/ToolExecutionProvenance.md); \} \| \{ `type`: `"completed"` \| `"failed"`; `toolCallId?`: [`ToolCallId`](ToolCallId.md); `name`: `string`; `request`: [`ToolCallRequest`](../interfaces/ToolCallRequest.md); `context?`: [`ToolCallContext`](../interfaces/ToolCallContext.md); `timestamp`: `number`; `durationMs`: `number`; `result`: [`ToolCallResult`](../interfaces/ToolCallResult.md); `provenance`: [`ToolExecutionProvenance`](../interfaces/ToolExecutionProvenance.md); \}

Defined in: [packages/tool-protocol/src/tool-protocol.ts:535](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L535)

## Union Members

### Type Literal

\{ `type`: `"started"`; `toolCallId?`: [`ToolCallId`](ToolCallId.md); `name`: `string`; `request`: [`ToolCallRequest`](../interfaces/ToolCallRequest.md); `context?`: [`ToolCallContext`](../interfaces/ToolCallContext.md); `timestamp`: `number`; `provenance`: [`ToolExecutionProvenance`](../interfaces/ToolExecutionProvenance.md); \}

#### type

> `readonly` **type**: `"started"`

#### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](ToolCallId.md)

#### name

> `readonly` **name**: `string`

#### request

> `readonly` **request**: [`ToolCallRequest`](../interfaces/ToolCallRequest.md)

Canonical tools/call request correlated with this lifecycle event.

#### context?

> `readonly` `optional` **context?**: [`ToolCallContext`](../interfaces/ToolCallContext.md)

#### timestamp

> `readonly` **timestamp**: `number`

#### provenance

> `readonly` **provenance**: [`ToolExecutionProvenance`](../interfaces/ToolExecutionProvenance.md)

***

### Type Literal

\{ `type`: `"completed"` \| `"failed"`; `toolCallId?`: [`ToolCallId`](ToolCallId.md); `name`: `string`; `request`: [`ToolCallRequest`](../interfaces/ToolCallRequest.md); `context?`: [`ToolCallContext`](../interfaces/ToolCallContext.md); `timestamp`: `number`; `durationMs`: `number`; `result`: [`ToolCallResult`](../interfaces/ToolCallResult.md); `provenance`: [`ToolExecutionProvenance`](../interfaces/ToolExecutionProvenance.md); \}

#### type

> `readonly` **type**: `"completed"` \| `"failed"`

#### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](ToolCallId.md)

#### name

> `readonly` **name**: `string`

#### request

> `readonly` **request**: [`ToolCallRequest`](../interfaces/ToolCallRequest.md)

Canonical tools/call request correlated with this lifecycle event.

#### context?

> `readonly` `optional` **context?**: [`ToolCallContext`](../interfaces/ToolCallContext.md)

#### timestamp

> `readonly` **timestamp**: `number`

#### durationMs

> `readonly` **durationMs**: `number`

#### result

> `readonly` **result**: [`ToolCallResult`](../interfaces/ToolCallResult.md)

#### provenance

> `readonly` **provenance**: [`ToolExecutionProvenance`](../interfaces/ToolExecutionProvenance.md)
