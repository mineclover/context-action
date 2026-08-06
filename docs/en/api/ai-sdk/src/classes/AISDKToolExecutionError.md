[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/ai-sdk/src](../README.md) / AISDKToolExecutionError

# Class: AISDKToolExecutionError

Defined in: [packages/ai-sdk/src/index.ts:24](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L24)

A model tool failure that should be surfaced by AI SDK as `tool-error`.

## Extends

- `Error`

## Constructors

### Constructor

> **new AISDKToolExecutionError**(`toolName`, `toolCallId`, `result`): `AISDKToolExecutionError`

Defined in: [packages/ai-sdk/src/index.ts:27](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L27)

#### Parameters

##### toolName

`string`

##### toolCallId

`string`

##### result

Type parameter **ToolCallResult**

#### Returns

Type parameter **AISDKToolExecutionError**

#### Overrides

`Error.constructor`

## Properties

### name

> **name**: `string` = `'AISDKToolExecutionError'`

Defined in: [packages/ai-sdk/src/index.ts:25](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L25)

#### Overrides

`Error.name`

***

### toolName

> `readonly` **toolName**: `string`

Defined in: [packages/ai-sdk/src/index.ts:28](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L28)

***

### toolCallId

> `readonly` **toolCallId**: `string`

Defined in: [packages/ai-sdk/src/index.ts:29](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L29)

***

### result

> `readonly` **result**: `ToolCallResult`

Defined in: [packages/ai-sdk/src/index.ts:30](https://github.com/mineclover/context-action/blob/main/packages/ai-sdk/src/index.ts#L30)
