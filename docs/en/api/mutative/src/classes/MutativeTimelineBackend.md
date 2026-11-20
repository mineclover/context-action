[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / MutativeTimelineBackend

# Class: MutativeTimelineBackend\<T\>

Defined in: [packages/mutative/src/backend.ts:466](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L466)

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

Defined in: [packages/mutative/src/backend.ts:495](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L495)

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

Defined in: [packages/mutative/src/backend.ts:543](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L543)

#### Returns

`ReadonlyStateSnapshot`&lt;`T`&gt;

#### Implementation of

`TransactionBackend.getSnapshot`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/mutative/src/backend.ts:545](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L545)

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

Defined in: [packages/mutative/src/backend.ts:551](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L551)

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

Defined in: [packages/mutative/src/backend.ts:559](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L559)

#### Returns

readonly (`IPatch` & `object` \| `IPatch` & `object` \| `IPatch` & `object`)[] \| `null`

#### Implementation of

`TransactionBackend.getLastPatches`

***

### getSafeValue()

> **getSafeValue**(): `T`

Defined in: [packages/mutative/src/backend.ts:561](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L561)

#### Returns

Type parameter **T**

#### Implementation of

`TransactionBackend.getSafeValue`

***

### getLastTransitionMeta()

> **getLastTransitionMeta**(): [`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md) \| `undefined`

Defined in: [packages/mutative/src/backend.ts:563](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L563)

#### Returns

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md) \| `undefined`

***

### setValue()

> **setValue**(`value`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:566](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L566)

#### Parameters

##### value

Type parameter **T**

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`TransactionBackend.setValue`

***

### update()

> **update**(`updater`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:572](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L572)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`TransactionBackend.update`

***

### getHistoryEntryId()

> **getHistoryEntryId**(): `HistoryEntryId`

Defined in: [packages/mutative/src/backend.ts:582](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L582)

#### Returns

Type parameter **HistoryEntryId**

#### Implementation of

`TransactionBackend.getHistoryEntryId`

***

### hasHistoryEntry()

> **hasHistoryEntry**(`entryId`): `boolean`

Defined in: [packages/mutative/src/backend.ts:584](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L584)

#### Parameters

##### entryId

Type parameter **HistoryEntryId**

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.hasHistoryEntry`

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/mutative/src/backend.ts:587](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L587)

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.canUndo`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/mutative/src/backend.ts:589](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L589)

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.canRedo`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/mutative/src/backend.ts:591](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L591)

#### Returns

`number`

#### Implementation of

`TransactionBackend.getPosition`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/mutative/src/backend.ts:593](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L593)

#### Returns

`number`

#### Implementation of

`TransactionBackend.getHistoryLength`

***

### getHistory()

> **getHistory**(): readonly `T`[]

Defined in: [packages/mutative/src/backend.ts:595](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L595)

#### Returns

readonly `T`[]

#### Implementation of

`TransactionBackend.getHistory`

***

### goTo()

> **goTo**(`position`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:597](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L597)

#### Parameters

##### position

`number`

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`TransactionBackend.goTo`

***

### undo()

> **undo**(`steps?`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:602](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L602)

#### Parameters

##### steps?

`number` = `1`

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`TransactionBackend.undo`

***

### redo()

> **redo**(`steps?`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:607](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L607)

#### Parameters

##### steps?

`number` = `1`

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`TransactionBackend.redo`

***

### goToHistoryEntry()

> **goToHistoryEntry**(`entryId`, `meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:612](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L612)

#### Parameters

##### entryId

Type parameter **HistoryEntryId**

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`TransactionBackend.goToHistoryEntry`

***

### reset()

> **reset**(`meta?`): `void`

Defined in: [packages/mutative/src/backend.ts:620](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L620)

#### Parameters

##### meta?

Type parameter **StateMutationMeta**

#### Returns

`void`

#### Implementation of

`TransactionBackend.reset`

***

### beginBatch()

> **beginBatch**(`meta?`, `options?`): `void`

Defined in: [packages/mutative/src/backend.ts:625](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L625)

#### Parameters

##### meta?

Type parameter **StateMutationMeta**

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

Defined in: [packages/mutative/src/backend.ts:636](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L636)

#### Returns

`void`

#### Implementation of

`TransactionBackend.endBatch`

***

### cancelBatch()

> **cancelBatch**(): `void`

Defined in: [packages/mutative/src/backend.ts:641](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L641)

#### Returns

`void`

#### Implementation of

`TransactionBackend.cancelBatch`

***

### resumeNotifications()

> **resumeNotifications**(): `void`

Defined in: [packages/mutative/src/backend.ts:646](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L646)

#### Returns

`void`

#### Implementation of

`TransactionBackend.resumeNotifications`

***

### flushNotifications()

> **flushNotifications**(): `void`

Defined in: [packages/mutative/src/backend.ts:650](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L650)

#### Returns

`void`

#### Implementation of

`TransactionBackend.flushNotifications`

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/mutative/src/backend.ts:658](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L658)

#### Returns

`boolean`

#### Implementation of

`TransactionBackend.isStoreDisposed`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/mutative/src/backend.ts:660](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L660)

#### Returns

`void`

#### Implementation of

`TransactionBackend.dispose`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/mutative/src/backend.ts:469](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L469)

#### Implementation of

`TransactionBackend.name`

***

### capabilities

> `readonly` **capabilities**: `object`

Defined in: [packages/mutative/src/backend.ts:470](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L470)

#### patches

> `readonly` **patches**: `true` = `true`

#### timeline

> `readonly` **timeline**: `true` = `true`

#### immutableSnapshots

> `readonly` **immutableSnapshots**: `boolean`

#### Implementation of

`TransactionBackend.capabilities`
