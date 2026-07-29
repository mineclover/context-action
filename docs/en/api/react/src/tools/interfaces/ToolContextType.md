[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolContextType

# Interface: ToolContextType\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:242](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L242)

Internal context type for ToolContext

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### actionRegisterRef

> **actionRegisterRef**: `RefObject`\<`ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;\> \| `null`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:243](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L243)

***

### registry

> **registry**: [`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:244](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L244)

***

### dispatch

> **dispatch**: [`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:245](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L245)

***

### dispatchLifecycle

> **dispatchLifecycle**: `ProviderDispatchLifecycle`

Defined in: [packages/react/src/tools/ToolContext.types.ts:246](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L246)
