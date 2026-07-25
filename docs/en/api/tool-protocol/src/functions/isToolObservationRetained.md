[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / isToolObservationRetained

# Function: isToolObservationRetained()

> **isToolObservationRetained**(`observedAt`, `now`, `policy?`): `boolean`

Defined in: [packages/tool-protocol/src/observability.ts:337](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L337)

Returns whether an observation is still within the configured retention window.

## Parameters

### observedAt

`number`

### now

`number`

### policy?

[`ToolObservabilityPolicy`](../interfaces/ToolObservabilityPolicy.md) = `DEFAULT_TOOL_OBSERVABILITY_POLICY`

## Returns

`boolean`
