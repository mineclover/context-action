[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallError

# Interface: ToolCallError

Defined in: [packages/tool-protocol/src/tool-protocol.ts:247](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L247)

Structured error returned to the model instead of leaking an exception.

## Properties

### code

> `readonly` **code**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:249](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L249)

Canonical codes are listed in TOOL_CALL_ERROR_CODES; applications may add their own.

***

### message

> `readonly` **message**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:250](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L250)

***

### retryable?

> `readonly` `optional` **retryable?**: `boolean`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:251](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L251)

***

### details?

> `readonly` `optional` **details?**: `unknown`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:252](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L252)
