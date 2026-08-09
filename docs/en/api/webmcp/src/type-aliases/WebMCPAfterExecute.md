[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPAfterExecute

# Type Alias: WebMCPAfterExecute

> **WebMCPAfterExecute** = (`event`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/webmcp/src/index.ts:96](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L96)

Post-commit notification. It is deliberately detached from the browser
tool result, so notification failures cannot make a completed mutation look
retryable to an agent.

## Parameters

### event

#### invocation

[`WebMCPToolInvocation`](../interfaces/WebMCPToolInvocation.md)

#### result

Type parameter **ToolCallResult**

## Returns

`void` \| `Promise`&lt;`void`&gt;
