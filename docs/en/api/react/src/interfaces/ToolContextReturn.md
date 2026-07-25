[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ToolContextReturn

# Interface: ToolContextReturn\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:282](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L282)

Return type for createToolContext factory

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:284](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L284)

Provider component that wraps children with tool context

***

### useToolDispatch

> **useToolDispatch**: () => [`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:290](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L290)

Hook to dispatch tools (execute with validation)

#### Returns

[`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Dispatch function that validates and executes tools

***

### useToolHandler

> **useToolHandler**: \<`K`, `R`\>(`toolName`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/tools/ToolContext.types.ts:296](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L296)

Hook to register tool handlers
Similar to useActionHandler but for tool execution

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### toolName

Type parameter **K**

##### handler

`ActionHandler`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\[`K`\], `R`\>

##### config?

`HandlerConfig`&lt;`unknown`&gt;

#### Returns

`void`

***

### useToolRegistry

> **useToolRegistry**: () => [`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:306](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L306)

Hook to access the tool registry
Provides methods to export tools in various formats

#### Returns

[`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

***

### useToolDispatchWithResult

> **useToolDispatchWithResult**: () => [`ToolDispatchWithResultReturn`](ToolDispatchWithResultReturn.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:311](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L311)

Hook for dispatch with detailed result

#### Returns

[`ToolDispatchWithResultReturn`](ToolDispatchWithResultReturn.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

***

### useActionRegister

> **useActionRegister**: () => `ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\> \| `null`

Defined in: [packages/react/src/tools/ToolContext.types.ts:317](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L317)

Hook to access raw ActionRegister
For advanced use cases

#### Returns

`ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\> \| `null`

***

### context

> **context**: `Context`\<[`ToolContextType`](ToolContextType.md)&lt;`TSchema`&gt; \| `null`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:320](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/tools/ToolContext.types.ts#L320)

The underlying React Context
