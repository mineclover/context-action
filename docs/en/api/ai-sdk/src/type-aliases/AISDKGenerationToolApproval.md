[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKGenerationToolApproval

# Type Alias: AISDKGenerationToolApproval

> **AISDKGenerationToolApproval** = (`options`) => `"user-approval"` \| `"not-applicable"` \| `Promise`\<`"user-approval"` \| `"not-applicable"`\>

Defined in: [packages/ai-sdk/src/index.ts:72](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L72)

Generation-level approval policy compatible with AI SDK's `toolApproval`
option. Pass this directly alongside `tools` and `activeTools`.

## Parameters

### options

#### toolCall

\{ `toolName`: `string`; `input`: `unknown`; \}

#### toolCall.toolName

`string`

#### toolCall.input

`unknown`

## Returns

`"user-approval"` \| `"not-applicable"` \| `Promise`\<`"user-approval"` \| `"not-applicable"`\>
