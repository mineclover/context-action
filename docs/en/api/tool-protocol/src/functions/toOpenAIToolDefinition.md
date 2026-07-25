[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / toOpenAIToolDefinition

# Function: toOpenAIToolDefinition()

> **toOpenAIToolDefinition**(`definition`): [`OpenAIToolDefinition`](../interfaces/OpenAIToolDefinition.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:652](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L652)

Convert one canonical tools/list definition into an OpenAI-compatible
function payload without consulting a second registry export.

The input schema is preserved as-is so provider adapters do not silently
drop nested constraints, enums, descriptions, or additional-properties
policy while translating the transport envelope.

## Parameters

### definition

[`ToolDefinition`](../interfaces/ToolDefinition.md)

## Returns

[`OpenAIToolDefinition`](../interfaces/OpenAIToolDefinition.md)
