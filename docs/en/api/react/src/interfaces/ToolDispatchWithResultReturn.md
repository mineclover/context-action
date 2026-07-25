[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ToolDispatchWithResultReturn

# Interface: ToolDispatchWithResultReturn\<TPayloadMap\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:265](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L265)

Return type for useToolDispatchWithResult hook

## Type Parameters

### TPayloadMap

Type parameter **TPayloadMap**

## Properties

### dispatch

> **dispatch**: [`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)&lt;`TPayloadMap`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:266](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L266)

***

### dispatchWithResult

> **dispatchWithResult**: \<`K`, `R`\>(`toolName`, `payload`, `options?`) => `Promise`\<[`ToolExecutionResult`](ToolExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:267](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L267)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### toolName

Type parameter **K**

##### payload

`TPayloadMap`\[`K`\]

##### options?

Type parameter **DispatchOptions**

#### Returns

`Promise`\<[`ToolExecutionResult`](ToolExecutionResult.md)&lt;`R`&gt;\>

***

### abortAll

> **abortAll**: () => `void`

Defined in: [packages/react/src/tools/ToolContext.types.ts:272](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L272)

#### Returns

`void`
