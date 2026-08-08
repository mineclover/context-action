[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPBeforeExecute

# ~~Type Alias: WebMCPBeforeExecute~~

> **WebMCPBeforeExecute** = (`invocation`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/webmcp/src/index.ts:97](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L97)

## Parameters

### invocation

[`WebMCPToolInvocation`](../interfaces/WebMCPToolInvocation.md)

## Returns

`void` \| `Promise`&lt;`void`&gt;

## Deprecated

This notification runs only after canonical execution. Use the
canonical `interaction` option for policy-gated user confirmation.
