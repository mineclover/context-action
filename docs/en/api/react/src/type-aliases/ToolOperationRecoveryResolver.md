[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ToolOperationRecoveryResolver

# Type Alias: ToolOperationRecoveryResolver

> **ToolOperationRecoveryResolver** = (`record`, `context?`) => `DurableOperationResolution`&lt;`ToolCallResult`&gt; \| `Promise`\<`DurableOperationResolution`&lt;`ToolCallResult`&gt;\>

Defined in: [packages/react/src/tools/ToolContext.types.ts:64](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/tools/ToolContext.types.ts#L64)

Domain-owned decision used by `recoverOperation` after an unknown durable
operation has been queried, compensated, or confirmed by the application.

## Parameters

### record

`DurableOperationRecord`&lt;`ToolCallResult`&gt;

### context?

Type parameter **ToolCallContext**

## Returns

`DurableOperationResolution`&lt;`ToolCallResult`&gt; \| `Promise`\<`DurableOperationResolution`&lt;`ToolCallResult`&gt;\>
