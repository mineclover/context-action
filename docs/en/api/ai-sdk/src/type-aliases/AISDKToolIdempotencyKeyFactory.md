[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKToolIdempotencyKeyFactory

# Type Alias: AISDKToolIdempotencyKeyFactory

> **AISDKToolIdempotencyKeyFactory** = (`invocation`) => `string` \| `undefined`

Defined in: [packages/ai-sdk/src/index.ts:56](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L56)

Maps a model tool invocation to a logical mutation identity.

The default is the provider's `toolCallId`, while the canonical manager
already namespaces it by tool name and session. Return `undefined` to
disable replay protection for a particular call.

## Parameters

### invocation

[`AISDKToolInvocation`](../interfaces/AISDKToolInvocation.md)

## Returns

`string` \| `undefined`
