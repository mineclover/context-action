[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKToolApprovalPolicy

# Type Alias: AISDKToolApprovalPolicy

> **AISDKToolApprovalPolicy** = `boolean` \| ((`invocation`) => `boolean` \| `Promise`&lt;`boolean`&gt;)

Defined in: [packages/ai-sdk/src/index.ts:64](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L64)

Requests AI SDK's native approval turn before a sensitive tool executes.
ToolContext policy remains the final authorization boundary after approval.
