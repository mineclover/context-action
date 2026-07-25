[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createToolCallFingerprint

# Function: createToolCallFingerprint()

> **createToolCallFingerprint**(`toolName`, `argumentsValue`): `string`

Defined in: [packages/tool-protocol/src/idempotency.ts:191](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/idempotency.ts#L191)

Create a deterministic, non-secret fingerprint for tool name and arguments.
The fingerprint is for accidental key-reuse detection, not authentication.

## Parameters

### toolName

`string`

### argumentsValue

`unknown`

## Returns

`string`
