[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallError

# Interface: ToolCallError

Defined in: [packages/tool-protocol/src/tool-protocol.ts:264](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L264)

Structured error returned to the model instead of leaking an exception.

## Properties

### code

> `readonly` **code**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:266](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L266)

Canonical codes are listed in TOOL_CALL_ERROR_CODES; applications may add their own.

***

### message

> `readonly` **message**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:267](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L267)

***

### retryable?

> `readonly` `optional` **retryable?**: `boolean`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:268](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L268)

***

### details?

> `readonly` `optional` **details?**: `unknown`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:269](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L269)
