[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKToolScope

# Interface: AISDKToolScope

Defined in: [packages/ai-sdk/src/index.ts:120](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L120)

## Properties

### tools

> `readonly` **tools**: `ToolSet`

Defined in: [packages/ai-sdk/src/index.ts:122](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L122)

Tool definitions ready for `generateText` or `streamText`.

***

### activeTools

> `readonly` **activeTools**: readonly `string`[]

Defined in: [packages/ai-sdk/src/index.ts:124](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L124)

Mirrors the exact capability scope for AI SDK's `activeTools` option.

***

### toolApproval?

> `readonly` `optional` **toolApproval?**: [`AISDKGenerationToolApproval`](../type-aliases/AISDKGenerationToolApproval.md)

Defined in: [packages/ai-sdk/src/index.ts:129](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L129)

Native AI SDK generation-level approval policy. Supply this as
`toolApproval` to `generateText`, `streamText`, or an AI SDK agent.
