[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createToolOperationKey

# Function: createToolOperationKey()

> **createToolOperationKey**(`toolName`, `idempotencyKey`, `sessionId?`): `string`

Defined in: [packages/tool-protocol/src/idempotency.ts:215](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/idempotency.ts#L215)

Build the storage key used by a ToolContext durable operation adapter.
JSON tuple encoding avoids collisions when a user-controlled session ID
contains punctuation that could otherwise be interpreted as a separator.

## Parameters

### toolName

`string`

### idempotencyKey

`string`

### sessionId?

`string`

## Returns

`string`
