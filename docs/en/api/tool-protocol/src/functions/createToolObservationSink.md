[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createToolObservationSink

# Function: createToolObservationSink()

> **createToolObservationSink**(`sink`, `policy?`): [`ToolCallObserver`](../type-aliases/ToolCallObserver.md)

Defined in: [packages/tool-protocol/src/observability.ts:270](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L270)

Creates an observer that crosses a telemetry boundary with a safe record.
The callback never receives the canonical ToolCallEvent, request arguments,
result content, or error messages. Apply the sink's retention/deletion job
to the policy metadata supplied in the record.

## Parameters

### sink

[`ToolObservationSink`](../type-aliases/ToolObservationSink.md)

### policy?

[`ToolObservabilityPolicy`](../interfaces/ToolObservabilityPolicy.md) = `DEFAULT_TOOL_OBSERVABILITY_POLICY`

## Returns

[`ToolCallObserver`](../type-aliases/ToolCallObserver.md)
