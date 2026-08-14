[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolDispatchWithResultReturn

# Interface: ToolDispatchWithResultReturn\<TPayloadMap\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:289](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L289)

Return type for useToolDispatchWithResult hook

## Type Parameters

### TPayloadMap

Type parameter **TPayloadMap**

## Properties

### dispatch

> **dispatch**: [`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)&lt;`TPayloadMap`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:290](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L290)

***

### dispatchWithResult

> **dispatchWithResult**: \<`K`, `R`\>(`toolName`, ...`args`) => `Promise`\<[`ToolExecutionResult`](ToolExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:291](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L291)

#### Type Parameters

##### K

`K` *extends* `string`

##### R

`R` = `void`

#### Parameters

##### toolName

Type parameter **K**

##### args

...`DispatchArgs`\<`TPayloadMap`\[`K`\]\>

#### Returns

`Promise`\<[`ToolExecutionResult`](ToolExecutionResult.md)&lt;`R`&gt;\>

***

### abortAll

> **abortAll**: () => `void`

Defined in: [packages/react/src/tools/ToolContext.types.ts:295](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L295)

#### Returns

`void`
