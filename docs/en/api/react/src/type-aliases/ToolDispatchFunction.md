[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ToolDispatchFunction

# Type Alias: ToolDispatchFunction\<TPayloadMap\>

> **ToolDispatchFunction**&lt;`TPayloadMap`&gt; = &lt;`K`&gt;(`toolName`, `payload`, `options?`) => `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:256](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L256)

Return type for useToolDispatch hook

## Type Parameters

### TPayloadMap

Type parameter **TPayloadMap**

## Type Parameters

### Generic type K

`K` *extends* keyof `TPayloadMap`

## Parameters

### toolName

Type parameter **K**

### payload

`TPayloadMap`\[`K`\]

### options?

Type parameter **DispatchOptions**

## Returns

`Promise`&lt;`void`&gt;
