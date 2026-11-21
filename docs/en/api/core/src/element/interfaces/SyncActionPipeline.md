[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / SyncActionPipeline

# Interface: SyncActionPipeline\<TActions\>

Defined in: [packages/core/src/element/sync-action-pipeline.ts:40](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L40)

## Type Parameters

### TActions

`TActions` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Methods

### registerGuard()

> **registerGuard**&lt;`K`&gt;(`action`, `handler`, `config?`): () => `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:44](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L44)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

##### handler

(`payload`, `controller`) => `void`

##### config?

[`SyncHandlerConfig`](SyncHandlerConfig.md)

#### Returns

() => `void`

***

### register()

> **register**\<`K`, `TResult`\>(`action`, `handler`, `config?`): () => `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:49](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L49)

#### Type Parameters

##### K

`K` *extends* `string`

##### TResult

`TResult` = `unknown`

#### Parameters

##### action

Type parameter **K**

##### handler

(`payload`, `controller`) => `TResult` \| `undefined`

##### config?

[`SyncHandlerConfig`](SyncHandlerConfig.md)

#### Returns

() => `void`

***

### registerObserver()

> **registerObserver**\<`K`, `TResult`\>(`action`, `handler`, `config?`): () => `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:57](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L57)

#### Type Parameters

##### K

`K` *extends* `string`

##### TResult

`TResult` = `unknown`

#### Parameters

##### action

Type parameter **K**

##### handler

(`payload`, `meta`) => `void`

##### config?

[`SyncObserverConfig`](SyncObserverConfig.md)

#### Returns

() => `void`

***

### dispatch()

> **dispatch**\<`K`, `TResult`\>(`action`, `payload?`): [`SyncDispatchOutcome`](SyncDispatchOutcome.md)\<`TActions`\[`K`\], `TResult`\>

Defined in: [packages/core/src/element/sync-action-pipeline.ts:62](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L62)

#### Type Parameters

##### K

`K` *extends* `string`

##### TResult

`TResult` = `unknown`

#### Parameters

##### action

Type parameter **K**

##### payload?

`TActions`\[`K`\]

#### Returns

[`SyncDispatchOutcome`](SyncDispatchOutcome.md)\<`TActions`\[`K`\], `TResult`\>

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:66](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L66)

#### Returns

`void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:43](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L43)
