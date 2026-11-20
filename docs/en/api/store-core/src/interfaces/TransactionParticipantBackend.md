[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/store-core/src](../README.md) / TransactionParticipantBackend

# Interface: TransactionParticipantBackend\<T\>

Defined in: [packages/store-core/src/transaction-contracts.ts:14](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/transaction-contracts.ts#L14)

Participant identity/observation/navigation, not state ownership. Coordinators
do not require setValue/update, patch subscriptions or materialized history.
Legacy Store snapshots may omit version; StateBackend still requires it.

## Extends

- [`StateReader`](StateReader.md)\<`T`, [`StateSnapshot`](StateSnapshot.md)&lt;`T`&gt;\>.`Pick`\<[`TransactionBackend`](TransactionBackend.md)&lt;`T`&gt;, `"getHistoryEntryId"` \| `"hasHistoryEntry"` \| `"canUndo"` \| `"canRedo"` \| `"getPosition"` \| `"getHistoryLength"` \| `"goToHistoryEntry"` \| `"isStoreDisposed"`\>.[`TransactionBatchControl`](TransactionBatchControl.md)

## Type Parameters

### Generic type T

`T` = `unknown`

## Methods

### getSnapshot()

> **getSnapshot**(): [`StateSnapshot`](StateSnapshot.md)

Defined in: [packages/store-core/src/contracts.ts:38](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L38)

#### Returns

[`StateSnapshot`](StateSnapshot.md)

#### Inherited from

[`StateReader`](StateReader.md).[`getSnapshot`](StateReader.md#getsnapshot)

***

### getValue()?

> `optional` **getValue**(): `T`

Defined in: [packages/store-core/src/contracts.ts:39](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L39)

#### Returns

Type parameter **T**

#### Inherited from

[`StateReader`](StateReader.md).[`getValue`](StateReader.md#getvalue)

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/store-core/src/contracts.ts:40](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L40)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

#### Inherited from

[`StateReader`](StateReader.md).[`subscribe`](StateReader.md#subscribe)

***

### getHistoryEntryId()

> **getHistoryEntryId**(): [`HistoryEntryId`](../type-aliases/HistoryEntryId.md)

Defined in: [packages/store-core/src/contracts.ts:70](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L70)

#### Returns

[`HistoryEntryId`](../type-aliases/HistoryEntryId.md)

#### Inherited from

`Pick.getHistoryEntryId`

***

### hasHistoryEntry()

> **hasHistoryEntry**(`entryId`): `boolean`

Defined in: [packages/store-core/src/contracts.ts:71](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L71)

#### Parameters

##### entryId

[`HistoryEntryId`](../type-aliases/HistoryEntryId.md)

#### Returns

`boolean`

#### Inherited from

`Pick.hasHistoryEntry`

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/store-core/src/contracts.ts:72](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L72)

#### Returns

`boolean`

#### Inherited from

`Pick.canUndo`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/store-core/src/contracts.ts:73](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L73)

#### Returns

`boolean`

#### Inherited from

`Pick.canRedo`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/store-core/src/contracts.ts:74](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L74)

#### Returns

`number`

#### Inherited from

`Pick.getPosition`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/store-core/src/contracts.ts:76](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L76)

#### Returns

`number`

#### Inherited from

`Pick.getHistoryLength`

***

### goToHistoryEntry()

> **goToHistoryEntry**(`entryId`, `meta?`): `void`

Defined in: [packages/store-core/src/contracts.ts:80](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L80)

#### Parameters

##### entryId

[`HistoryEntryId`](../type-aliases/HistoryEntryId.md)

##### meta?

[`StateMutationMeta`](StateMutationMeta.md)

#### Returns

`void`

#### Inherited from

`Pick.goToHistoryEntry`

***

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

#### Inherited from

[`TransactionBatchControl`](TransactionBatchControl.md).[`beginBatch`](TransactionBatchControl.md#beginbatch)

***

### endBatch()

> **endBatch**(): `void`

Defined in: [packages/store-core/src/contracts.ts:87](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L87)

#### Returns

`void`

#### Inherited from

[`TransactionBatchControl`](TransactionBatchControl.md).[`endBatch`](TransactionBatchControl.md#endbatch)

***

### cancelBatch()

> **cancelBatch**(): `void`

Defined in: [packages/store-core/src/contracts.ts:88](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L88)

#### Returns

`void`

#### Inherited from

[`TransactionBatchControl`](TransactionBatchControl.md).[`cancelBatch`](TransactionBatchControl.md#cancelbatch)

***

### resumeNotifications()

> **resumeNotifications**(): `void`

Defined in: [packages/store-core/src/contracts.ts:89](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L89)

#### Returns

`void`

#### Inherited from

[`TransactionBatchControl`](TransactionBatchControl.md).[`resumeNotifications`](TransactionBatchControl.md#resumenotifications)

***

### flushNotifications()

> **flushNotifications**(): `void`

Defined in: [packages/store-core/src/contracts.ts:90](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L90)

#### Returns

`void`

#### Inherited from

[`TransactionBatchControl`](TransactionBatchControl.md).[`flushNotifications`](TransactionBatchControl.md#flushnotifications)

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/store-core/src/contracts.ts:94](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L94)

#### Returns

`boolean`

#### Inherited from

`Pick.isStoreDisposed`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/store-core/src/contracts.ts:37](https://github.com/mineclover/context-action/blob/main/packages/store-core/src/contracts.ts#L37)

#### Inherited from

[`StateReader`](StateReader.md).[`name`](StateReader.md#name)
