[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / projectToolCallObservation

# Function: projectToolCallObservation()

> **projectToolCallObservation**(`event`, `policy?`): [`ToolObservation`](../interfaces/ToolObservation.md)

Defined in: packages/tool-protocol/src/observability.ts:191

Projects a canonical lifecycle event without copying request arguments,
result content, structured payloads, or error messages into the sink value.

The returned object is metadata-only but still needs to be serialized with
`serializeToolObservabilityValue()` before crossing a telemetry boundary so
the configured byte, depth, and collection limits are applied.

## Parameters

### event

[`ToolCallEvent`](../type-aliases/ToolCallEvent.md)

### policy?

[`ToolObservabilityPolicy`](../interfaces/ToolObservabilityPolicy.md) = `DEFAULT_TOOL_OBSERVABILITY_POLICY`

## Returns

[`ToolObservation`](../interfaces/ToolObservation.md)
