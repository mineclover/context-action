[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolCallContext

# Interface: ToolCallContext

Defined in: packages/tool-protocol/src/tool-protocol.ts:59

## Properties

### source?

> `readonly` `optional` **source?**: [`ToolCallSource`](../type-aliases/ToolCallSource.md)

Defined in: packages/tool-protocol/src/tool-protocol.ts:60

***

### mode?

> `readonly` `optional` **mode?**: [`ToolCallMode`](../type-aliases/ToolCallMode.md)

Defined in: packages/tool-protocol/src/tool-protocol.ts:62

`agent` is model/prompt orchestration; `direct` is an explicit command.

***

### sessionId?

> `readonly` `optional` **sessionId?**: `string`

Defined in: packages/tool-protocol/src/tool-protocol.ts:63

***

### revision?

> `readonly` `optional` **revision?**: `string` \| `number`

Defined in: packages/tool-protocol/src/tool-protocol.ts:65

Provider/session revision token; browser workspaces commonly use a number.

***

### metadata?

> `readonly` `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: packages/tool-protocol/src/tool-protocol.ts:66
