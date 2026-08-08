[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallResult

# Interface: ToolCallResult\<TResult\>

Defined in: [packages/tool-protocol/src/tool-protocol.ts:462](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L462)

Standard tool result; content blocks and structuredContent are both preserved.

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:463](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L463)

***

### content

> `readonly` **content**: [`ToolContent`](../type-aliases/ToolContent.md)[]

Defined in: [packages/tool-protocol/src/tool-protocol.ts:465](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L465)

Content remains the stable transport surface; structuredContent carries JSON output.

***

### structuredContent?

> `readonly` `optional` **structuredContent?**: `TResult`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:466](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L466)

***

### isError?

> `readonly` `optional` **isError?**: `boolean`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:467](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L467)

***

### error?

> `readonly` `optional` **error?**: [`ToolCallError`](ToolCallError.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:468](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L468)
