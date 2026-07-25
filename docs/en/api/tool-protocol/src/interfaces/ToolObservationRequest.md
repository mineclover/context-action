[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolObservationRequest

# Interface: ToolObservationRequest

Defined in: [packages/tool-protocol/src/observability.ts:56](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L56)

## Properties

### method

> `readonly` **method**: `"tools/call"`

Defined in: [packages/tool-protocol/src/observability.ts:57](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L57)

***

### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: [packages/tool-protocol/src/observability.ts:58](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L58)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/tool-protocol/src/observability.ts:59](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L59)

***

### argumentKeys

> `readonly` **argumentKeys**: readonly `string`[]

Defined in: [packages/tool-protocol/src/observability.ts:61](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/observability.ts#L61)

Argument names only; argument values are intentionally never projected.
