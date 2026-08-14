[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createToolApprovalQueue

# Function: createToolApprovalQueue()

> **createToolApprovalQueue**(`options?`): [`ToolApprovalQueue`](../interfaces/ToolApprovalQueue.md)

Defined in: [packages/tool-protocol/src/tool-protocol.ts:141](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L141)

Create a provider-neutral approval queue for `tools/call` requests.

The queue owns only metadata and promise resolution. It does not execute a
tool, persist arguments, or depend on React, so an application can attach a
browser dialog, a host prompt, or an audit surface to the same contract.

## Parameters

### options?

[`ToolApprovalQueueOptions`](../interfaces/ToolApprovalQueueOptions.md) = `{}`

## Returns

[`ToolApprovalQueue`](../interfaces/ToolApprovalQueue.md)
