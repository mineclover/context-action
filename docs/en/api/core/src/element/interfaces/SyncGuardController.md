[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / SyncGuardController

# Interface: SyncGuardController\<TPayload\>

Defined in: [packages/core/src/element/sync-action-pipeline.ts:1](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L1)

## Extended by

- [`SyncResultController`](SyncResultController.md)

## Type Parameters

### TPayload

`TPayload` = `unknown`

## Methods

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:2](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L2)

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### modifyPayload()

> **modifyPayload**(`updater`): `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:3](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L3)

#### Parameters

##### updater

`TPayload` \| ((`prev`) => `TPayload`)

#### Returns

`void`

***

### getPayload()

> **getPayload**(): `TPayload`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:4](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L4)

#### Returns

`TPayload`
