[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolObservabilityPolicyOptions

# Interface: ToolObservabilityPolicyOptions

Defined in: [packages/tool-protocol/src/observability.ts:12](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L12)

## Properties

### maxBytes?

> `readonly` `optional` **maxBytes?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:14](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L14)

Maximum UTF-8 bytes emitted by serializeToolObservabilityValue().

***

### maxDepth?

> `readonly` `optional` **maxDepth?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:16](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L16)

Maximum recursive object/array depth before a value is omitted.

***

### maxStringLength?

> `readonly` `optional` **maxStringLength?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:18](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L18)

Maximum characters retained for a non-sensitive string value.

***

### maxArrayEntries?

> `readonly` `optional` **maxArrayEntries?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:20](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L20)

Maximum array items retained per object/array node.

***

### maxObjectEntries?

> `readonly` `optional` **maxObjectEntries?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:22](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L22)

Maximum object fields retained per object node.

***

### retentionMs?

> `readonly` `optional` **retentionMs?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:24](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L24)

Suggested lifetime for an observation in a telemetry store.

***

### maxEntries?

> `readonly` `optional` **maxEntries?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:26](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L26)

Suggested maximum number of observations retained by a telemetry store.

***

### redactedKeys?

> `readonly` `optional` **redactedKeys?**: readonly `string`[]

Defined in: [packages/tool-protocol/src/observability.ts:28](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L28)

Additional case-insensitive field names whose values must be redacted.
