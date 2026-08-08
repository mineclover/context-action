[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionResult

# Type Alias: ActionResult\<TResultMap, K\>

> **ActionResult**\<`TResultMap`, `K`\> = `K` *extends* keyof `TResultMap` ? `TResultMap`\[`K`\] : `void`

Defined in: [packages/core/src/types.ts:229](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L229)

Resolve the configured result type for an action, falling back to void.

## Type Parameters

### TResultMap

`TResultMap` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)

### Generic type K

`K` *extends* `PropertyKey`
