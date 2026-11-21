[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / SyncResultController

# Interface: SyncResultController\<TPayload, TResult\>

Defined in: [packages/core/src/element/sync-action-pipeline.ts:7](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L7)

## Extends

- [`SyncGuardController`](SyncGuardController.md)&lt;`TPayload`&gt;

## Type Parameters

### TPayload

`TPayload` = `unknown`

### TResult

`TResult` = `unknown`

## Methods

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:2](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L2)

#### Parameters

##### reason?

`string`

#### Returns

`void`

#### Inherited from

[`SyncGuardController`](SyncGuardController.md).[`abort`](SyncGuardController.md#abort)

***

### modifyPayload()

> **modifyPayload**(`updater`): `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:3](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L3)

#### Parameters

##### updater

`TPayload` \| ((`prev`) => `TPayload`)

#### Returns

`void`

#### Inherited from

[`SyncGuardController`](SyncGuardController.md).[`modifyPayload`](SyncGuardController.md#modifypayload)

***

### getPayload()

> **getPayload**(): `TPayload`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:4](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L4)

#### Returns

`TPayload`

#### Inherited from

[`SyncGuardController`](SyncGuardController.md).[`getPayload`](SyncGuardController.md#getpayload)

***

### setResult()

> **setResult**(`value`): `void`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:9](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L9)

#### Parameters

##### value

`TResult`

#### Returns

`void`

***

### getResult()

> **getResult**(): `TResult` \| `undefined`

Defined in: [packages/core/src/element/sync-action-pipeline.ts:10](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/sync-action-pipeline.ts#L10)

#### Returns

`TResult` \| `undefined`
