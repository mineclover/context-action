[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallError

# Interface: ToolCallError

Defined in: [packages/tool-protocol/src/tool-protocol.ts:258](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L258)

Structured error returned to the model instead of leaking an exception.

## Properties

### code

> `readonly` **code**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:260](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L260)

Canonical codes are listed in TOOL_CALL_ERROR_CODES; applications may add their own.

***

### message

> `readonly` **message**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:261](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L261)

***

### retryable?

> `readonly` `optional` **retryable?**: `boolean`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:262](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L262)

***

### details?

> `readonly` `optional` **details?**: `unknown`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:263](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L263)
