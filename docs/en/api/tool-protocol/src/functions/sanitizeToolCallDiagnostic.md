[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / sanitizeToolCallDiagnostic

# Function: sanitizeToolCallDiagnostic()

> **sanitizeToolCallDiagnostic**(`result`, `policy?`): [`ToolCallResult`](../interfaces/ToolCallResult.md)

Defined in: [packages/tool-protocol/src/observability.ts:301](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L301)

Creates the durable projection for an ambiguous or failed tool result.

Successful results must remain lossless so a retry can replay them. An
An error result is diagnostic evidence instead: keep the error code and a
bounded/redacted details object, but never persist canonical content or
structured payloads that may contain source text or credentials.

## Parameters

### result

[`ToolCallResult`](../interfaces/ToolCallResult.md)

### policy?

[`ToolObservabilityPolicy`](../interfaces/ToolObservabilityPolicy.md) = `DEFAULT_TOOL_OBSERVABILITY_POLICY`

## Returns

[`ToolCallResult`](../interfaces/ToolCallResult.md)
