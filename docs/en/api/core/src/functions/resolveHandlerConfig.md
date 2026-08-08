[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / resolveHandlerConfig

# Function: resolveHandlerConfig()

> **resolveHandlerConfig**&lt;`T`&gt;(`config`, `handlerId`): [`ResolvedHandlerConfig`](../interfaces/ResolvedHandlerConfig.md)&lt;`T`&gt;

Defined in: [packages/core/src/types.ts:540](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L540)

Resolve the legacy `blocking` compatibility flag and all registration
defaults in one place. Adapters should pass their original config to the
registry and use this helper only when they need to expose resolved values.

## Type Parameters

### Generic type T

`T` = `unknown`

## Parameters

### config

[`HandlerConfig`](../interfaces/HandlerConfig.md)&lt;`T`&gt; \| `undefined`

### handlerId

`string`

## Returns

[`ResolvedHandlerConfig`](../interfaces/ResolvedHandlerConfig.md)&lt;`T`&gt;
