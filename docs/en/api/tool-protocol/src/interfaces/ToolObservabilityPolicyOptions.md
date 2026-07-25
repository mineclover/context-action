[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolObservabilityPolicyOptions

# Interface: ToolObservabilityPolicyOptions

Defined in: [packages/tool-protocol/src/observability.ts:13](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L13)

## Properties

### maxBytes?

> `readonly` `optional` **maxBytes?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:15](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L15)

Maximum UTF-8 bytes emitted by serializeToolObservabilityValue().

***

### maxDepth?

> `readonly` `optional` **maxDepth?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:17](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L17)

Maximum recursive object/array depth before a value is omitted.

***

### maxStringLength?

> `readonly` `optional` **maxStringLength?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:19](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L19)

Maximum characters retained for a non-sensitive string value.

***

### maxArrayEntries?

> `readonly` `optional` **maxArrayEntries?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:21](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L21)

Maximum array items retained per object/array node.

***

### maxObjectEntries?

> `readonly` `optional` **maxObjectEntries?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:23](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L23)

Maximum object fields retained per object node.

***

### retentionMs?

> `readonly` `optional` **retentionMs?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:25](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L25)

Suggested lifetime for an observation in a telemetry store.

***

### maxEntries?

> `readonly` `optional` **maxEntries?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:27](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L27)

Suggested maximum number of observations retained by a telemetry store.

***

### redactedKeys?

> `readonly` `optional` **redactedKeys?**: readonly `string`[]

Defined in: [packages/tool-protocol/src/observability.ts:29](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L29)

Additional case-insensitive field names whose values must be redacted.
