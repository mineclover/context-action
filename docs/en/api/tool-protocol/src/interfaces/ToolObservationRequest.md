[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolObservationRequest

# Interface: ToolObservationRequest

Defined in: packages/tool-protocol/src/observability.ts:55

## Properties

### method

> `readonly` **method**: `"tools/call"`

Defined in: packages/tool-protocol/src/observability.ts:56

***

### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: packages/tool-protocol/src/observability.ts:57

***

### name

> `readonly` **name**: `string`

Defined in: packages/tool-protocol/src/observability.ts:58

***

### argumentKeys

> `readonly` **argumentKeys**: readonly `string`[]

Defined in: packages/tool-protocol/src/observability.ts:60

Argument names only; argument values are intentionally never projected.
