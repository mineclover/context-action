[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / TimeTravelStore

# Class: TimeTravelStore\<T\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:72](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L72)

TimeTravelStore - Store with built-in undo/redo functionality

## Example

```tsx
const store = createTimeTravelStore('counter', { count: 0 }, { maxHistory: 50 });

// Update state
store.setValue({ count: 1 });
store.setValue({ count: 2 });

// Undo/Redo
store.undo(); // count: 1
store.redo(); // count: 2

// Get controls for UI
const { canUndo, canRedo, position, history } = store.getTimeTravelControls();
```

## Type Parameters

### Generic type T

`T` = `unknown`

## Implements

- [`IStore`](../interfaces/IStore.md)&lt;`T`&gt;

## Constructors

### Constructor

> **new TimeTravelStore**&lt;`T`&gt;(`name`, `initialValue`, `options?`): `TimeTravelStore`&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:96](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L96)

#### Parameters

##### name

`string`

##### initialValue

Type parameter **T**

##### options?

[`TimeTravelStoreOptions`](../interfaces/TimeTravelStoreOptions.md)&lt;`T`&gt; = `{}`

#### Returns

`TimeTravelStore`&lt;`T`&gt;

## Methods

### subscribe()

> **subscribe**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:148](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L148)

Subscribe to store changes (React useSyncExternalStore compatible)

#### Parameters

##### listener

`Listener`

#### Returns

`Unsubscribe`

#### Implementation of

`IStore.subscribe`

***

### subscribeWithPatches()

> **subscribeWithPatches**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:161](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L161)

Subscribe with patches information for path-based optimization

#### Parameters

##### listener

`PatchAwareListener`

#### Returns

`Unsubscribe`

***

### getLastPatches()

> **getLastPatches**(): [`Patches`](../../../mutative/src/type-aliases/Patches.md) \| `null`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:175](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L175)

Get the patches from the last state change. In batched mode this includes
every transition accumulated before the notification frame was flushed.

#### Returns

[`Patches`](../../../mutative/src/type-aliases/Patches.md) \| `null`

***

### getLastTransitionMeta()

> **getLastTransitionMeta**(): `TimeTravelTransitionMeta` \| `undefined`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:179](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L179)

#### Returns

`TimeTravelTransitionMeta` \| `undefined`

***

### getSnapshot()

> **getSnapshot**(): [`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:183](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L183)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSnapshot`](../interfaces/IStore.md#getsnapshot)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:194](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L194)

Get current value directly (preserves structural sharing)

Returns the state reference directly to maintain structural sharing.
This enables selective re-rendering when combined with path-based subscriptions.
Use `readMode: 'safe'` or getSafeValue() when the value crosses an
external boundary. Reference reads are retained for legacy action-handler
compatibility and should not be mutated.

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getValue`](../interfaces/IStore.md#getvalue)

***

### getSafeValue()

> **getSafeValue**(): `T`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:202](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L202)

Return a defensive copy without changing structural-sharing reads.

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSafeValue`](../interfaces/IStore.md#getsafevalue)

***

### setValue()

> **setValue**(`value`, `options?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:206](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L206)

Set store value with enhanced options and validation

#### Parameters

##### value

Type parameter **T**

##### options?

`StoreSetValueOptions`&lt;`T`&gt;

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`setValue`](../interfaces/IStore.md#setvalue)

***

### update()

> **update**(`updater`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:246](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L246)

Update store value with function (for functional updates, supports draft mutations)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`update`](../interfaces/IStore.md#update)

***

### beginBatch()

> **beginBatch**(`metadata?`, `options?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:261](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L261)

Group multiple updates into one timeline entry and notification.

#### Parameters

##### metadata?

`TimeTravelTransitionMeta`

##### options?

###### deferNotification?

`boolean`

#### Returns

`void`

***

### endBatch()

> **endBatch**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:267](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L267)

#### Returns

`void`

***

### cancelBatch()

> **cancelBatch**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:273](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L273)

Restore the active batch without creating a timeline entry.

#### Returns

`void`

***

### resumeNotifications()

> **resumeNotifications**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:278](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L278)

#### Returns

`void`

***

### flushNotifications()

> **flushNotifications**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:282](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L282)

#### Returns

`void`

***

### batch()

> **batch**&lt;`R`&gt;(`callback`, `metadata?`): `R`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:289](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L289)

Group multiple updates into one timeline entry and notification.

#### Type Parameters

##### R

Type parameter **R**

#### Parameters

##### callback

() => `R`

##### metadata?

`TimeTravelTransitionMeta`

#### Returns

Type parameter **R**

***

### getListenerCount()

> **getListenerCount**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:294](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L294)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getListenerCount`](../interfaces/IStore.md#getlistenercount)

***

### clearListeners()

> **clearListeners**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:298](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L298)

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:303](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L303)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`dispose`](../interfaces/IStore.md#dispose)

***

### registerCleanup()

> **registerCleanup**(`task`): () => `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:332](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L332)

Register cleanup task for automatic execution on disposal

#### Parameters

##### task

() => `void`

#### Returns

() => `void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`registerCleanup`](../interfaces/IStore.md#registercleanup)

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:338](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L338)

Check if store is disposed

#### Returns

`boolean`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`isStoreDisposed`](../interfaces/IStore.md#isstoredisposed)

***

### undo()

> **undo**(`steps?`, `metadata?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:349](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L349)

Undo the last change

#### Parameters

##### steps?

`number` = `1`

##### metadata?

`TimeTravelTransitionMeta`

#### Returns

`void`

***

### redo()

> **redo**(`steps?`, `metadata?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:364](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L364)

Redo the last undone change

#### Parameters

##### steps?

`number` = `1`

##### metadata?

`TimeTravelTransitionMeta`

#### Returns

`void`

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:379](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L379)

Check if undo is possible

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:387](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L387)

Check if redo is possible

#### Returns

`boolean`

***

### goTo()

> **goTo**(`position`, `metadata?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:395](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L395)

Go to a specific position in history

#### Parameters

##### position

`number`

##### metadata?

`TimeTravelTransitionMeta`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:404](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L404)

Reset to initial state

#### Returns

`void`

***

### getHistory()

> **getHistory**(): readonly `T`[]

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:412](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L412)

Get the complete history of states

#### Returns

readonly `T`[]

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:420](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L420)

Get current position in history

#### Returns

`number`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:425](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L425)

#### Returns

`number`

***

### getHistoryEntryId()

> **getHistoryEntryId**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:431](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L431)

Stable retained timeline identity for transaction coordination.

#### Returns

`number`

***

### hasHistoryEntry()

> **hasHistoryEntry**(`entryId`): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:436](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L436)

#### Parameters

##### entryId

`number`

#### Returns

`boolean`

***

### goToHistoryEntry()

> **goToHistoryEntry**(`entryId`, `metadata?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:440](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L440)

#### Parameters

##### entryId

`number`

##### metadata?

`TimeTravelTransitionMeta`

#### Returns

`void`

***

### getTimeTravelControls()

> **getTimeTravelControls**(): `TimeTravelControls`\<`T`, `false`\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:448](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L448)

Get time travel controls object

#### Returns

`TimeTravelControls`\<`T`, `false`\>

***

### notifyPath()

> **notifyPath**(`path`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:471](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L471)

Manually notify path-based subscribers without changing state value

Useful for external systems (WebSocket, async operations) that need to
trigger UI updates for specific paths without actual state changes.

#### Parameters

##### path

(`string` \| `number`)[]

The path to notify subscribers about

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`notifyPath`](../interfaces/IStore.md#notifypath)

***

### notifyPaths()

> **notifyPaths**(`paths`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:498](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L498)

Manually notify multiple paths at once

#### Parameters

##### paths

(`string` \| `number`)[][]

Array of paths to notify subscribers about

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`notifyPaths`](../interfaces/IStore.md#notifypaths)

***

### setCloningEnabled()

> **setCloningEnabled**(`enabled`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:539](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L539)

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### isCloningEnabled()

> **isCloningEnabled**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:543](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L543)

#### Returns

`boolean`

***

### setCustomComparator()

> **setCustomComparator**(`comparator`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:547](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L547)

#### Parameters

##### comparator

(`a`, `b`) => `boolean`

#### Returns

`void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:73](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L73)

Unique identifier for the store

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`name`](../interfaces/IStore.md#name)
