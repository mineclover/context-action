[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolInteractionRequest

# Interface: ToolInteractionRequest

Defined in: [packages/tool-protocol/src/tool-protocol.ts:102](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L102)

Request passed to a transport-neutral, canonical interaction boundary.

## Extends

- [`ToolApprovalRequestInput`](ToolApprovalRequestInput.md)

## Properties

### request

> `readonly` **request**: [`ToolCallRequest`](ToolCallRequest.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:95](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L95)

#### Inherited from

[`ToolApprovalRequestInput`](ToolApprovalRequestInput.md).[`request`](ToolApprovalRequestInput.md#request)

***

### definition

> `readonly` **definition**: [`ToolDefinition`](ToolDefinition.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:96](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L96)

#### Inherited from

[`ToolApprovalRequestInput`](ToolApprovalRequestInput.md).[`definition`](ToolApprovalRequestInput.md#definition)

***

### context?

> `readonly` `optional` **context?**: [`ToolCallContext`](ToolCallContext.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:97](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L97)

#### Inherited from

[`ToolApprovalRequestInput`](ToolApprovalRequestInput.md).[`context`](ToolApprovalRequestInput.md#context)

***

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:98](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L98)

#### Inherited from

[`ToolApprovalRequestInput`](ToolApprovalRequestInput.md).[`signal`](ToolApprovalRequestInput.md#signal)

***

### kind

> `readonly` **kind**: `"approval"` \| `"user-interaction"`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:103](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L103)

***

### call

> `readonly` **call**: [`ModelToolCall`](ModelToolCall.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:104](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L104)
