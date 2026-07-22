[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolApprovalSnapshot

# Interface: ToolApprovalSnapshot

Defined in: packages/tool-protocol/src/tool-protocol.ts:75

Provider-neutral approval snapshot for a pending tools/call request.

The snapshot is intentionally metadata-only: an approval surface may
resolve it, but execution remains owned by the ToolManagementInterface.

## Properties

### id

> `readonly` **id**: `string`

Defined in: packages/tool-protocol/src/tool-protocol.ts:76

***

### method

> `readonly` **method**: `"tools/call"`

Defined in: packages/tool-protocol/src/tool-protocol.ts:77

***

### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: packages/tool-protocol/src/tool-protocol.ts:78

***

### sessionId?

> `readonly` `optional` **sessionId?**: `string`

Defined in: packages/tool-protocol/src/tool-protocol.ts:79

***

### name

> `readonly` **name**: `string`

Defined in: packages/tool-protocol/src/tool-protocol.ts:80

***

### description

> `readonly` **description**: `string`

Defined in: packages/tool-protocol/src/tool-protocol.ts:81

***

### source

> `readonly` **source**: [`ToolCallSource`](../type-aliases/ToolCallSource.md)

Defined in: packages/tool-protocol/src/tool-protocol.ts:82

***

### mode?

> `readonly` `optional` **mode?**: [`ToolCallMode`](../type-aliases/ToolCallMode.md)

Defined in: packages/tool-protocol/src/tool-protocol.ts:83

***

### argumentKeys

> `readonly` **argumentKeys**: readonly `string`[]

Defined in: packages/tool-protocol/src/tool-protocol.ts:84

***

### safeArgumentPreview?

> `readonly` `optional` **safeArgumentPreview?**: `string`

Defined in: packages/tool-protocol/src/tool-protocol.ts:85

***

### createdAt

> `readonly` **createdAt**: `number`

Defined in: packages/tool-protocol/src/tool-protocol.ts:86
