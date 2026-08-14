[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolApprovalRequestInput

# Interface: ToolApprovalRequestInput

Defined in: [packages/tool-protocol/src/tool-protocol.ts:94](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L94)

Provider-neutral input used to create a pending approval snapshot.

## Extended by

- [`ToolInteractionRequest`](ToolInteractionRequest.md)

## Properties

### request

> `readonly` **request**: [`ToolCallRequest`](ToolCallRequest.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:95](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L95)

***

### definition

> `readonly` **definition**: [`ToolDefinition`](ToolDefinition.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:96](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L96)

***

### context?

> `readonly` `optional` **context?**: [`ToolCallContext`](ToolCallContext.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:97](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L97)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:98](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L98)
