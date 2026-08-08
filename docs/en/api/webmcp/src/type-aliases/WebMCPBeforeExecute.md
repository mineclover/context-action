[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPBeforeExecute

# Type Alias: WebMCPBeforeExecute

> **WebMCPBeforeExecute** = (`invocation`, `client`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/webmcp/src/index.ts:64](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L64)

Runs before the canonical manager so browser-native interaction can be bridged explicitly.

## Parameters

### invocation

[`WebMCPToolInvocation`](../interfaces/WebMCPToolInvocation.md)

### client

[`WebMCPModelContextClient`](../interfaces/WebMCPModelContextClient.md) \| `undefined`

## Returns

`void` \| `Promise`&lt;`void`&gt;
