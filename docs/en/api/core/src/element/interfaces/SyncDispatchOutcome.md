[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / SyncDispatchOutcome

# Interface: SyncDispatchOutcome\<TPayload, TResult\>

Defined in: [packages/core/src/element/sync-action-pipeline.ts:21](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L21)

## Type Parameters

### TPayload

`TPayload` = `unknown`

### TResult

`TResult` = `unknown`

## Properties

### success

> `readonly` **success**: `boolean`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:22](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L22)

***

### aborted

> `readonly` **aborted**: `boolean`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:23](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L23)

***

### abortReason?

> `readonly` `optional` **abortReason?**: `string`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:24](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L24)

***

### payload

> `readonly` **payload**: `TPayload`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:25](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L25)

***

### result

> `readonly` **result**: `TResult` \| `undefined`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:26](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L26)

***

### errors

> `readonly` **errors**: readonly `unknown`[]

Defined in: [packages/core/src/element/sync-action-pipeline.ts:27](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L27)
