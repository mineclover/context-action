[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStore

# Class: TimeTravelStore\<T\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:80](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L80)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:104](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L104)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:152](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L152)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:165](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L165)

Subscribe with patches information for path-based optimization

#### Parameters

##### listener

Type parameter **PatchAwareListener**

#### Returns

Type parameter **Unsubscribe**

***

### getLastPatches()

> **getLastPatches**(): `Patches` \| `null`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:179](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L179)

Get the patches from the last state change. In batched mode this includes
every transition accumulated before the notification frame was flushed.

#### Returns

`Patches` \| `null`

***

### getLastTransitionMeta()

> **getLastTransitionMeta**(): `TimeTravelTransitionMeta` \| `undefined`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:183](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L183)

#### Returns

`TimeTravelTransitionMeta` \| `undefined`

***

### getSnapshot()

> **getSnapshot**(): [`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:187](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L187)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSnapshot`](../interfaces/IStore.md#getsnapshot)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:198](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L198)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:206](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L206)

Return a defensive copy without changing structural-sharing reads.

#### Returns

Type parameter **T**

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSafeValue`](../interfaces/IStore.md#getsafevalue)

***

### setValue()

> **setValue**(`value`, `options?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:210](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L210)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:250](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L250)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:265](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L265)

Group multiple updates into one timeline entry and notification.

#### Parameters

##### metadata?

Type parameter **TimeTravelTransitionMeta**

##### options?

###### deferNotification?

`boolean`

#### Returns

`void`

***

### endBatch()

> **endBatch**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:274](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L274)

#### Returns

`void`

***

### resumeNotifications()

> **resumeNotifications**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:280](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L280)

#### Returns

`void`

***

### flushNotifications()

> **flushNotifications**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:284](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L284)

#### Returns

`void`

***

### batch()

> **batch**&lt;`R`&gt;(`callback`, `metadata?`): `R`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:291](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L291)

Group multiple updates into one timeline entry and notification.

#### Type Parameters

##### R

Type parameter **R**

#### Parameters

##### callback

() => `R`

##### metadata?

Type parameter **TimeTravelTransitionMeta**

#### Returns

Type parameter **R**

***

### getListenerCount()

> **getListenerCount**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:299](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L299)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getListenerCount`](../interfaces/IStore.md#getlistenercount)

***

### clearListeners()

> **clearListeners**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:303](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L303)

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:308](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L308)

Enhanced disposal with comprehensive cleanup

#### Returns

`void`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`dispose`](../interfaces/IStore.md#dispose)

***

### registerCleanup()

> **registerCleanup**(`task`): () => `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:337](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L337)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:343](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L343)

Check if store is disposed

#### Returns

`boolean`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`isStoreDisposed`](../interfaces/IStore.md#isstoredisposed)

***

### undo()

> **undo**(`steps?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:354](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L354)

Undo the last change

#### Parameters

##### steps?

`number` = `1`

#### Returns

`void`

***

### redo()

> **redo**(`steps?`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:369](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L369)

Redo the last undone change

#### Parameters

##### steps?

`number` = `1`

#### Returns

`void`

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:384](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L384)

Check if undo is possible

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:392](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L392)

Check if redo is possible

#### Returns

`boolean`

***

### goTo()

> **goTo**(`position`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:400](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L400)

Go to a specific position in history

#### Parameters

##### position

`number`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:409](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L409)

Reset to initial state

#### Returns

`void`

***

### getHistory()

> **getHistory**(): readonly `T`[]

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:417](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L417)

Get the complete history of states

#### Returns

readonly `T`[]

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:425](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L425)

Get current position in history

#### Returns

`number`

***

### getTimeTravelControls()

> **getTimeTravelControls**(): `TimeTravelControls`\<`T`, `false`\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:433](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L433)

Get time travel controls object

#### Returns

`TimeTravelControls`\<`T`, `false`\>

***

### notifyPath()

> **notifyPath**(`path`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:456](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L456)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:474](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L474)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:506](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L506)

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### isCloningEnabled()

> **isCloningEnabled**(): `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:510](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L510)

#### Returns

`boolean`

***

### setCustomComparator()

> **setCustomComparator**(`comparator`): `void`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:514](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L514)

#### Parameters

##### comparator

(`a`, `b`) => `boolean`

#### Returns

`void`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:81](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L81)

Unique identifier for the store

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`name`](../interfaces/IStore.md#name)
