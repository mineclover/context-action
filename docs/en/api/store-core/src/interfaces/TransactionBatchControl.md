[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/store-core/src](../README.md) / TransactionBatchControl

# Interface: TransactionBatchControl

Defined in: [packages/store-core/src/contracts.ts:85](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L85)

Lifecycle authority can be separate from the participant's stable identity.

## Extended by

- [`TransactionBackend`](TransactionBackend.md)
- [`TransactionParticipantBackend`](TransactionParticipantBackend.md)

## Methods

### beginBatch()

> **beginBatch**(`meta?`, `options?`): `void`

Defined in: [packages/store-core/src/contracts.ts:86](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L86)

#### Parameters

##### meta?

[`StateMutationMeta`](StateMutationMeta.md)

##### options?

###### deferNotification?

`boolean`

#### Returns

`void`

***

### endBatch()

> **endBatch**(): `void`

Defined in: [packages/store-core/src/contracts.ts:87](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L87)

#### Returns

`void`

***

### cancelBatch()

> **cancelBatch**(): `void`

Defined in: [packages/store-core/src/contracts.ts:88](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L88)

#### Returns

`void`

***

### resumeNotifications()

> **resumeNotifications**(): `void`

Defined in: [packages/store-core/src/contracts.ts:89](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L89)

#### Returns

`void`

***

### flushNotifications()

> **flushNotifications**(): `void`

Defined in: [packages/store-core/src/contracts.ts:90](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L90)

#### Returns

`void`
