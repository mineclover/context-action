[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-durable-operations/src](../README.md) / hasDurableOperationFencingCapability

# Function: hasDurableOperationFencingCapability()

> **hasDurableOperationFencingCapability**(`value`): `value is Pick<DurableOperationStore<unknown>, "fencingCapability">`

Defined in: [packages/tool-durable-operations/src/durable-operation.ts:277](https://github.com/mineclover/context-action/blob/main/packages/tool-durable-operations/src/durable-operation.ts#L277)

Runtime guard used by orchestrators to reject legacy, unfenced stores.

## Parameters

### value

`unknown`

## Returns

`value is Pick<DurableOperationStore<unknown>, "fencingCapability">`
