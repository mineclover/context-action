[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKToolScope

# Interface: AISDKToolScope

Defined in: [packages/ai-sdk/src/index.ts:100](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L100)

## Properties

### tools

> `readonly` **tools**: `ToolSet`

Defined in: [packages/ai-sdk/src/index.ts:102](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L102)

Tool definitions ready for `generateText` or `streamText`.

***

### activeTools

> `readonly` **activeTools**: readonly `string`[]

Defined in: [packages/ai-sdk/src/index.ts:104](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L104)

Mirrors the exact capability scope for AI SDK's `activeTools` option.
