[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / redactToolObservabilityValue

# Function: redactToolObservabilityValue()

> **redactToolObservabilityValue**(`value`, `policy?`): `unknown`

Defined in: packages/tool-protocol/src/observability.ts:155

Returns a bounded JSON-compatible value with sensitive fields removed.
Cycles, unsupported values, deep branches, and excess collection entries are
represented by explicit markers rather than throwing or leaking raw input.

## Parameters

### value

`unknown`

### policy?

[`ToolObservabilityPolicy`](../interfaces/ToolObservabilityPolicy.md) = `DEFAULT_TOOL_OBSERVABILITY_POLICY`

## Returns

`unknown`
