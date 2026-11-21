[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolObservation

# Interface: ToolObservation

Defined in: [packages/tool-protocol/src/observability.ts:71](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L71)

## Properties

### schemaVersion

> `readonly` **schemaVersion**: `"context-action-tool-observation.v1"`

Defined in: [packages/tool-protocol/src/observability.ts:72](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L72)

***

### type

> `readonly` **type**: `"completed"` \| `"failed"` \| `"started"`

Defined in: [packages/tool-protocol/src/observability.ts:73](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L73)

***

### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: [packages/tool-protocol/src/observability.ts:74](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L74)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/tool-protocol/src/observability.ts:75](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L75)

***

### context?

> `readonly` `optional` **context?**: [`ToolObservationContext`](ToolObservationContext.md)

Defined in: [packages/tool-protocol/src/observability.ts:76](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L76)

***

### timestamp

> `readonly` **timestamp**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:77](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L77)

***

### durationMs?

> `readonly` `optional` **durationMs?**: `number`

Defined in: [packages/tool-protocol/src/observability.ts:78](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L78)

***

### provenance

> `readonly` **provenance**: [`ToolExecutionProvenance`](ToolExecutionProvenance.md)

Defined in: [packages/tool-protocol/src/observability.ts:79](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L79)

***

### request

> `readonly` **request**: [`ToolObservationRequest`](ToolObservationRequest.md)

Defined in: [packages/tool-protocol/src/observability.ts:80](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L80)

***

### result?

> `readonly` `optional` **result?**: [`ToolObservationResult`](ToolObservationResult.md)

Defined in: [packages/tool-protocol/src/observability.ts:81](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L81)
