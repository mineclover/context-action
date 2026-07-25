[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallError

# Interface: ToolCallError

Defined in: [packages/tool-protocol/src/tool-protocol.ts:236](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L236)

Structured error returned to the model instead of leaking an exception.

## Properties

### code

> `readonly` **code**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:238](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L238)

Canonical codes are listed in TOOL_CALL_ERROR_CODES; applications may add their own.

***

### message

> `readonly` **message**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:239](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L239)

***

### retryable?

> `readonly` `optional` **retryable?**: `boolean`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:240](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L240)

***

### details?

> `readonly` `optional` **details?**: `unknown`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:241](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L241)
