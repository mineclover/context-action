[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolContextReturn

# Interface: ToolContextReturn\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:301](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L301)

Return type for createToolContext factory

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:303](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L303)

Provider component that wraps children with tool context

***

### useToolDispatch

> **useToolDispatch**: () => [`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:309](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L309)

Hook to dispatch tools (execute with validation)

#### Returns

[`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Dispatch function that validates and executes tools

***

### useToolCall

> **useToolCall**: () => `ToolCallFunction`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:315](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L315)

Invoke a tool through the canonical `tools/call` path.
Direct UI calls default to `{ source: 'local', mode: 'direct' }`.

#### Returns

`ToolCallFunction`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

***

### useToolHandler

> **useToolHandler**: \<`K`, `R`\>(`toolName`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/tools/ToolContext.types.ts:321](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L321)

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

`HandlerConfig`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\[`K`\]\>

#### Returns

`void`

***

### useToolRegistry

> **useToolRegistry**: () => [`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:331](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L331)

Hook to access the tool registry
Provides methods to export tools in various formats

#### Returns

[`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

***

### useToolDispatchWithResult

> **useToolDispatchWithResult**: () => [`ToolDispatchWithResultReturn`](ToolDispatchWithResultReturn.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:336](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L336)

Hook for dispatch with detailed result

#### Returns

[`ToolDispatchWithResultReturn`](ToolDispatchWithResultReturn.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

***

### useActionRegister

> **useActionRegister**: () => `ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\> \| `null`

Defined in: [packages/react/src/tools/ToolContext.types.ts:342](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L342)

Hook to access raw ActionRegister
For advanced use cases

#### Returns

`ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\> \| `null`

***

### context

> **context**: `Context`\<[`ToolContextType`](ToolContextType.md)&lt;`TSchema`&gt; \| `null`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:345](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L345)

The underlying React Context
