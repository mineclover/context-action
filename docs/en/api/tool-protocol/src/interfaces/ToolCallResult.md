[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallResult

# Interface: ToolCallResult\<TResult\>

Defined in: [packages/tool-protocol/src/tool-protocol.ts:473](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L473)

Standard tool result; content blocks and structuredContent are both preserved.

## Type Parameters

### TResult

`TResult` = `unknown`

## Properties

### toolCallId?

> `readonly` `optional` **toolCallId?**: [`ToolCallId`](../type-aliases/ToolCallId.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:474](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L474)

***

### content

> `readonly` **content**: [`ToolContent`](../type-aliases/ToolContent.md)[]

Defined in: [packages/tool-protocol/src/tool-protocol.ts:476](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L476)

Content remains the stable transport surface; structuredContent carries JSON output.

***

### structuredContent?

> `readonly` `optional` **structuredContent?**: `TResult`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:477](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L477)

***

### isError?

> `readonly` `optional` **isError?**: `boolean`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:478](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L478)

***

### error?

> `readonly` `optional` **error?**: [`ToolCallError`](ToolCallError.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:479](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L479)
