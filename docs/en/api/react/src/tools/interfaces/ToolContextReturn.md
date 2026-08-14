[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolContextReturn

# Interface: ToolContextReturn\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:305](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L305)

Return type for createToolContext factory

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:307](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L307)

Provider component that wraps children with tool context

***

### useToolDispatch

> **useToolDispatch**: () => [`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:313](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L313)

Hook to dispatch tools (execute with validation)

#### Returns

[`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Dispatch function that validates and executes tools

***

### useToolCall

> **useToolCall**: () => `ToolCallFunction`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:319](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L319)

Invoke a tool through the canonical `tools/call` path.
Direct UI calls default to `{ source: 'local', mode: 'direct' }`.

#### Returns

`ToolCallFunction`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

***

### useToolHandler

> **useToolHandler**: \<`K`, `R`\>(`toolName`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/tools/ToolContext.types.ts:325](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L325)

Hook to register tool handlers
Similar to useActionHandler but for tool execution

#### Type Parameters

##### K

`K` *extends* `string`

##### R

`R` = `void`

#### Parameters

##### toolName

Type parameter **K**

##### handler

`ActionHandler`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\[`K`\], `R`\>

##### config?

`HandlerConfig`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\[`K`\]\>

#### Returns

`void`

***

### useToolRegistry

> **useToolRegistry**: () => [`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:335](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L335)

Hook to access the tool registry
Provides methods to export tools in various formats

#### Returns

[`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

***

### useToolDispatchWithResult

> **useToolDispatchWithResult**: () => [`ToolDispatchWithResultReturn`](ToolDispatchWithResultReturn.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:340](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L340)

Hook for dispatch with detailed result

#### Returns

[`ToolDispatchWithResultReturn`](ToolDispatchWithResultReturn.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

***

### useActionRegister

> **useActionRegister**: () => `ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;, \{ \}\> \| `null`

Defined in: [packages/react/src/tools/ToolContext.types.ts:346](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L346)

Hook to access raw ActionRegister
For advanced use cases

#### Returns

`ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;, \{ \}\> \| `null`

***

### context

> **context**: `Context`\<[`ToolContextType`](ToolContextType.md)&lt;`TSchema`&gt; \| `null`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:349](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L349)

The underlying React Context
