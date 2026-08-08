[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / createAISDKToolScope

# Function: createAISDKToolScope()

> **createAISDKToolScope**(`manager`, `options`): [`AISDKToolScope`](../interfaces/AISDKToolScope.md)

Defined in: [packages/ai-sdk/src/index.ts:148](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L148)

Build an AI SDK ToolSet from the canonical manager.

The returned `activeTools` is intentionally redundant with the ToolSet: it
documents and carries the same scope into AI SDK generation options, so a
caller cannot accidentally advertise a broader catalog than it executes.

## Parameters

### manager

Type parameter **ToolManagementInterface**

### options

[`AISDKToolSetOptions`](../interfaces/AISDKToolSetOptions.md)

## Returns

[`AISDKToolScope`](../interfaces/AISDKToolScope.md)
