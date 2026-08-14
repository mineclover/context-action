[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/react/src/tools](../README.md) / ToolContextType

# Interface: ToolContextType\<TSchema\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:247](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L247)

Internal context type for ToolContext

## Type Parameters

### TSchema

`TSchema` *extends* `ActionSchemaMap`

## Properties

### actionRegisterRef

> **actionRegisterRef**: `RefObject`\<`ActionRegister`\<`InferActionPayloadMap`&lt;`TSchema`&gt;, \{ \}\> \| `null`\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:248](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L248)

***

### registry

> **registry**: [`ToolRegistry`](ToolRegistry.md)&lt;`TSchema`&gt;

Defined in: [packages/react/src/tools/ToolContext.types.ts:249](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L249)

***

### dispatch

> **dispatch**: [`ToolDispatchFunction`](../type-aliases/ToolDispatchFunction.md)\<`InferActionPayloadMap`&lt;`TSchema`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:250](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L250)

***

### dispatchLifecycle

> **dispatchLifecycle**: `ProviderDispatchLifecycle`

Defined in: [packages/react/src/tools/ToolContext.types.ts:251](https://github.com/mineclover/context-action/blob/main/packages/react/src/tools/ToolContext.types.ts#L251)
