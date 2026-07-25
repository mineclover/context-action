[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / createToolIdempotencyRegistry

# Function: createToolIdempotencyRegistry()

> **createToolIdempotencyRegistry**&lt;`TResult`&gt;(`options?`): [`ToolIdempotencyRegistry`](../interfaces/ToolIdempotencyRegistry.md)&lt;`TResult`&gt;

Defined in: [packages/tool-protocol/src/idempotency.ts:73](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/idempotency.ts#L73)

Create a bounded in-memory promise-sharing idempotency registry.

## Type Parameters

### TResult

`TResult` = `unknown`

## Parameters

### options?

[`ToolIdempotencyRegistryOptions`](../interfaces/ToolIdempotencyRegistryOptions.md) = `{}`

## Returns

[`ToolIdempotencyRegistry`](../interfaces/ToolIdempotencyRegistry.md)&lt;`TResult`&gt;
