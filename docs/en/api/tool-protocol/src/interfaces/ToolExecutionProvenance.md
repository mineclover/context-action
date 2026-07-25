[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolExecutionProvenance

# Interface: ToolExecutionProvenance

Defined in: [packages/tool-protocol/src/execution-provenance.ts:18](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L18)

## Properties

### schemaVersion

> `readonly` **schemaVersion**: `"context-action-tool-execution-provenance.v1"`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:19](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L19)

***

### phase

> `readonly` **phase**: `"tool-call"`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:20](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L20)

***

### ownerId

> `readonly` **ownerId**: `string`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:22](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L22)

Logical owner for the caller/worker lifetime, never a secret or payload.

***

### state

> `readonly` **state**: [`ToolExecutionProvenanceState`](../type-aliases/ToolExecutionProvenanceState.md)

Defined in: [packages/tool-protocol/src/execution-provenance.ts:23](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L23)

***

### timeoutMs?

> `readonly` `optional` **timeoutMs?**: `number`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:25](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L25)

Configured wall-clock limit, when the caller supplied one.

***

### maxOutputBytes?

> `readonly` `optional` **maxOutputBytes?**: `number`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:27](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L27)

Configured output limit, when the caller supplied one.

***

### usedOutputBytes

> `readonly` **usedOutputBytes**: `number`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:29](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L29)

UTF-8 bytes observed at the tool result boundary.

***

### elapsedMs

> `readonly` **elapsedMs**: `number`

Defined in: [packages/tool-protocol/src/execution-provenance.ts:31](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/execution-provenance.ts#L31)

Wall-clock elapsed time measured by the caller, in milliseconds.
