[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStore

# Class: TimeTravelStore\<T\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:56](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L56)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:76](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L76)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:118](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L118)

Subscribe to store changes (React useSyncExternalStore compatible)

#### Parameters

##### listener

Type parameter **Listener**

#### Returns

Type parameter **Unsubscribe**

#### Implementation of

`IStore.subscribe`

***

### subscribeWithPatches()

> **subscribeWithPatches**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:131](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L131)

Subscribe with patches information for path-based optimization

#### Parameters

##### listener

Type parameter **PatchAwareListener**

#### Returns

Type parameter **Unsubscribe**

***

### getLastPatches()

> **getLastPatches**(): `Patches` \| `null`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:145](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L145)

Get the patches from the last state change. In batched mode this includes
every transition accumulated before the notification frame was flushed.

#### Returns

`Patches` \| `null`

***

### getSnapshot()

> **getSnapshot**(): [`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:149](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L149)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSnapshot`](../interfaces/IStore.md#getsnapshot)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:158](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L158)

Get current value directly (preserves structural sharing)

Returns the state reference directly to maintain structural sharing.
This enables selective re-rendering when combined with path-based subscriptions.
Use setCloningEnabled(true) if you need defensive copies.

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getValue`](../interfaces/IStore.md#getvalue)

***

### setValue()

> **setValue**(`value`, `options?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:165](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L165)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:205](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L205)

Update store value with function (for functional updates, supports draft mutations)

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`update`](../interfaces/IStore.md#update)

***

### getListenerCount()

> **getListenerCount**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:219](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L219)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getListenerCount`](../interfaces/IStore.md#getlistenercount)

***

### clearListeners()

> **clearListeners**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:223](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L223)

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:228](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L228)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`dispose`](../interfaces/IStore.md#dispose)

***

### registerCleanup()

> **registerCleanup**(`task`): () => `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:253](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L253)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:259](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L259)

Check if store is disposed

#### Returns

`boolean`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`isStoreDisposed`](../interfaces/IStore.md#isstoredisposed)

***

### undo()

> **undo**(`steps?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:270](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L270)

Undo the last change

#### Parameters

##### steps?

`number` = `1`

#### Returns

`void`

***

### redo()

> **redo**(`steps?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:284](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L284)

Redo the last undone change

#### Parameters

##### steps?

`number` = `1`

#### Returns

`void`

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:298](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L298)

Check if undo is possible

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:305](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L305)

Check if redo is possible

#### Returns

`boolean`

***

### goTo()

> **goTo**(`position`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:312](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L312)

Go to a specific position in history

#### Parameters

##### position

`number`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:320](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L320)

Reset to initial state

#### Returns

`void`

***

### getHistory()

> **getHistory**(): readonly `T`[]

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:328](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L328)

Get the complete history of states

#### Returns

readonly `T`[]

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:335](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L335)

Get current position in history

#### Returns

`number`

***

### getTimeTravelControls()

> **getTimeTravelControls**(): `TimeTravelControls`\<`T`, `false`\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:342](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L342)

Get time travel controls object

#### Returns

`TimeTravelControls`\<`T`, `false`\>

***

### notifyPath()

> **notifyPath**(`path`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:354](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L354)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:372](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L372)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:404](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L404)

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### isCloningEnabled()

> **isCloningEnabled**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:408](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L408)

#### Returns

`boolean`

***

### setCustomComparator()

> **setCustomComparator**(`comparator`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:412](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L412)

#### Parameters

##### comparator

(`a`, `b`) => `boolean`

#### Returns

`void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:57](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L57)

Unique identifier for the store

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`name`](../interfaces/IStore.md#name)
