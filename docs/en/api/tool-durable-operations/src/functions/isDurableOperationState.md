[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / isDurableOperationState

# Function: isDurableOperationState()

> **isDurableOperationState**(`value`): `value is DurableOperationState`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:493](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-durable-operations/src/durable-operation.ts#L493)

Durable operation records and external side-effect adapters.

This package owns mutation safety after a tool call has crossed into an
external system. Provider-neutral schemas, discovery, and lifecycle event
contracts remain in @context-action/tool-protocol.

## Parameters

### value

`unknown`

## Returns

`value is DurableOperationState`
