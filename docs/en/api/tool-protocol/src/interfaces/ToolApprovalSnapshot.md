[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolApprovalSnapshot

# Interface: ToolApprovalSnapshot

Defined in: [packages/tool-protocol/src/tool-protocol.ts:75](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L75)

Provider-neutral approval snapshot for a pending tools/call request.

The snapshot is intentionally metadata-only: an approval surface may
resolve it, but execution remains owned by the ToolManagementInterface.

## Properties

### id

> `readonly` **id**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:77](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L77)

Queue-lifetime request ID used by `resolve`; distinct from `toolCallId`.

***

### method

> `readonly` **method**: `"tools/call"`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:78](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L78)

***

### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:79](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L79)

***

### sessionId?

> `readonly` `optional` **sessionId?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:80](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L80)

***

### name

> `readonly` **name**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:81](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L81)

***

### description

> `readonly` **description**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:82](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L82)

***

### source

> `readonly` **source**: [`ToolCallSource`](../type-aliases/ToolCallSource.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:83](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L83)

***

### mode?

> `readonly` `optional` **mode?**: [`ToolCallMode`](../type-aliases/ToolCallMode.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:84](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L84)

***

### argumentKeys

> `readonly` **argumentKeys**: readonly `string`[]

Defined in: [packages/tool-protocol/src/tool-protocol.ts:85](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L85)

***

### safeArgumentPreview?

> `readonly` `optional` **safeArgumentPreview?**: `string`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:86](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L86)

***

### createdAt

> `readonly` **createdAt**: `number`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:87](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L87)
