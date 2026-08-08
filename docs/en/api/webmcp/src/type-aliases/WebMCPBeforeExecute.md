[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPBeforeExecute

# Type Alias: WebMCPBeforeExecute

> **WebMCPBeforeExecute** = (`invocation`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/webmcp/src/index.ts:66](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L66)

Runs before canonical execution. The hook receives cancellation, but callers
must not treat it as a replacement for canonical policy/approval checks.

## Parameters

### invocation

[`WebMCPToolInvocation`](../interfaces/WebMCPToolInvocation.md)

## Returns

`void` \| `Promise`&lt;`void`&gt;
