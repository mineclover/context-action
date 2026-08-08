[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKToolsOnlyOptions

# Type Alias: AISDKToolsOnlyOptions

> **AISDKToolsOnlyOptions** = `Omit`\<[`AISDKToolSetOptions`](../interfaces/AISDKToolSetOptions.md), `"needsApproval"`\> & `object`

Defined in: [packages/ai-sdk/src/index.ts:137](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L137)

Options accepted by the tools-only convenience helper. Approval is a
generation-level AI SDK option, so callers that need it must retain the
complete scope returned by `createAISDKToolScope`.

## Type Declaration

### needsApproval?

> `readonly` `optional` **needsApproval?**: `never`
