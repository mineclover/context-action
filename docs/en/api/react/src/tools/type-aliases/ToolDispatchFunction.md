[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolDispatchFunction

# Type Alias: ToolDispatchFunction\<TPayloadMap\>

> **ToolDispatchFunction**&lt;`TPayloadMap`&gt; = &lt;`K`&gt;(`toolName`, `payload`, `options?`) => `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:257](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L257)

Return type for useToolDispatch hook

## Type Parameters

### TPayloadMap

Type parameter **TPayloadMap**

## Type Parameters

### Generic type K

`K` *extends* `Extract`\<keyof `TPayloadMap`, `string`\>

## Parameters

### toolName

Type parameter **K**

### payload

`TPayloadMap`\[`K`\]

### options?

Type parameter **DispatchOptions**

## Returns

`Promise`&lt;`void`&gt;
