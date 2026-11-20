[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / MutativeTimelineBackend

# Class: MutativeTimelineBackend\<T\>

Defined in: [packages/mutative/src/backend.ts:474](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L474)

A framework-neutral Mutative timeline backend with undo/redo and batches.

TimeTravel remains the history engine, while this adapter supplies the
StateBackend/TransactionBackend contract used by UI integrations.

## Type Parameters

### Generic type T

`T` = `unknown`

## Implements

- `TransactionBackend`\<`T`, `MutativePatch`\>

## Constructors

### Constructor

> **new MutativeTimelineBackend**&lt;`T`&gt;(`name`, `initialValue`, `options?`): `MutativeTimelineBackend`&lt;`T`&gt;

Defined in: [packages/mutative/src/backend.ts:503](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L503)

#### Parameters

##### name

`string`

##### initialValue

Type parameter **T**

##### options?

[`MutativeTimelineBackendOptions`](../interfaces/MutativeTimelineBackendOptions.md) = `{}`

#### Returns

`MutativeTimelineBackend`&lt;`T`&gt;

## Methods

### getSnapshot()

> **getSnapshot**(): `ReadonlyStateSnapshot`&lt;`T`&gt;

Defined in: [packages/mutative/src/backend.ts:555](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L555)

#### Returns

`ReadonlyStateSnapshot`&lt;`T`&gt;

#### Implementation of

`TransactionBackend.getSnapshot`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/mutative/src/backend.ts:557](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L557)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`

#### Implementation of

`TransactionBackend.subscribe`

***

### subscribeWithPatches()

> **subscribeWithPatches**(`listener`): () => `void`

Defined in: [packages/mutative/src/backend.ts:563](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L563)

#### Parameters

##### listener

(`patches`) => `void`

#### Returns

() => `void`

#### Implementation of

`TransactionBackend.subscribeWithPatches`

***

### getLastPatches()

> **getLastPatches**(): readonly (`IPatch` & `object` \| `IPatch` & `object` \| `IPatch` & `object`)[] \| `null`

Defined in: [packages/mutative/src/backend.ts:571](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L571)

#### Returns

readonly (`IPatch` & `object` \| `IPatch` & `object` \| `IPatch` & `object`)[] \| `null`

#### Implementation of

`TransactionBackend.getLastPatches`

***

### getSafeValue()

> **getSafeValue**(): `T`

Defined in: [packages/mutative/src/backend.ts:573](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L573)

#### Returns

Type parameter **T**

#### Implementation of

`TransactionBackend.getSafeValue`

***

### getLastTransitionMeta()

> **getLastTransitionMeta**(): [`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md) \| `undefined`

Defined in: [packages/mutative/src/backend.ts:575](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L575)

#### Returns

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md) \| `undefined`

***

### setValue()

> **setValue**(`value`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:578](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L578)

#### Parameters

##### value

Type parameter **T**

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

`TransactionBackend.setValue`

***

### update()

> **update**(`updater`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:584](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L584)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

`TransactionBackend.update`

***

### getHistoryEntryId()

> **getHistoryEntryId**(): `HistoryEntryId`

Defined in: [packages/mutative/src/backend.ts:594](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L594)

#### Returns

`HistoryEntryId`

#### Implementation of

`TransactionBackend.getHistoryEntryId`

***

### hasHistoryEntry()

> **hasHistoryEntry**(`entryId`): `boolean`

Defined in: [packages/mutative/src/backend.ts:596](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L596)

#### Parameters

##### entryId

`HistoryEntryId`

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.hasHistoryEntry`

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/mutative/src/backend.ts:599](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L599)

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.canUndo`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/mutative/src/backend.ts:601](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L601)

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.canRedo`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/mutative/src/backend.ts:603](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L603)

#### Returns

`number`

#### Implementation of

`TransactionBackend.getPosition`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/mutative/src/backend.ts:605](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L605)

#### Returns

`number`

#### Implementation of

`TransactionBackend.getHistoryLength`

***

### getHistory()

> **getHistory**(): readonly `T`[]

Defined in: [packages/mutative/src/backend.ts:607](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L607)

#### Returns

readonly `T`[]

#### Implementation of

`TransactionBackend.getHistory`

***

### goTo()

> **goTo**(`position`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:609](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L609)

#### Parameters

##### position

`number`

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

`TransactionBackend.goTo`

***

### undo()

> **undo**(`steps?`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:614](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L614)

#### Parameters

##### steps?

`number` = `1`

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

`TransactionBackend.undo`

***

### redo()

> **redo**(`steps?`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:619](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L619)

#### Parameters

##### steps?

`number` = `1`

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

`TransactionBackend.redo`

***

### goToHistoryEntry()

> **goToHistoryEntry**(`entryId`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:624](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L624)

#### Parameters

##### entryId

`HistoryEntryId`

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

`TransactionBackend.goToHistoryEntry`

***

### reset()

> **reset**(`meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:632](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L632)

#### Parameters

##### meta?

`StateMutationMeta`

#### Returns

`void`

#### Implementation of

`TransactionBackend.reset`

***

### beginBatch()

> **beginBatch**(`meta?`, `options?`): `void`

Defined in: [packages/mutative/src/backend.ts:637](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L637)

#### Parameters

##### meta?

`StateMutationMeta`

##### options?

###### deferNotification?

`boolean`

#### Returns

`void`

#### Implementation of

`TransactionBackend.beginBatch`

***

### endBatch()

> **endBatch**(): `void`

Defined in: [packages/mutative/src/backend.ts:648](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L648)

#### Returns

`void`

#### Implementation of

`TransactionBackend.endBatch`

***

### cancelBatch()

> **cancelBatch**(): `void`

Defined in: [packages/mutative/src/backend.ts:653](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L653)

#### Returns

`void`

#### Implementation of

`TransactionBackend.cancelBatch`

***

### resumeNotifications()

> **resumeNotifications**(): `void`

Defined in: [packages/mutative/src/backend.ts:658](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L658)

#### Returns

`void`

#### Implementation of

`TransactionBackend.resumeNotifications`

***

### flushNotifications()

> **flushNotifications**(): `void`

Defined in: [packages/mutative/src/backend.ts:662](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L662)

#### Returns

`void`

#### Implementation of

`TransactionBackend.flushNotifications`

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/mutative/src/backend.ts:670](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L670)

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.isStoreDisposed`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/mutative/src/backend.ts:672](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L672)

#### Returns

`void`

#### Implementation of

`TransactionBackend.dispose`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/mutative/src/backend.ts:477](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L477)

#### Implementation of

`TransactionBackend.name`

***

### capabilities

> `readonly` **capabilities**: `object`

Defined in: [packages/mutative/src/backend.ts:478](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L478)

#### patches

> `readonly` **patches**: `true` = `true`

#### timeline

> `readonly` **timeline**: `true` = `true`

#### immutableSnapshots

> `readonly` **immutableSnapshots**: `boolean`

#### Implementation of

`TransactionBackend.capabilities`
