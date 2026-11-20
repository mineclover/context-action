[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / TimeTravel

# Class: TimeTravel\<S, F, A, P\>

Defined in: [packages/mutative/src/time-travel.ts:114](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L114)

TimeTravel - Undo/Redo state management with Mutative

## Example

```ts
const timeTravel = new TimeTravel({ count: 0 }, { maxHistory: 50 });

// Update state
timeTravel.setState((draft) => { draft.count++; });

// Undo/Redo
timeTravel.back();
timeTravel.forward();

// Get controls for UI
const controls = timeTravel.getControls();
```

## Type Parameters

### Generic type S

Type parameter **S**

### Generic type F

`F` *extends* `boolean` = `false`

### Generic type A

`A` *extends* `boolean` = `true`

### Generic type P

`P` *extends* [`PatchesOption`](../type-aliases/PatchesOption.md) = `object`

## Constructors

### Constructor

> **new TimeTravel**\<`S`, `F`, `A`, `P`\>(`initialState`, `options?`): `TimeTravel`\<`S`, `F`, `A`, `P`\>

Defined in: [packages/mutative/src/time-travel.ts:159](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L159)

#### Parameters

##### initialState

Type parameter **S**

##### options?

[`TimeTravelOptions`](../type-aliases/TimeTravelOptions.md)\<`F`, `A`, `P`\> = `...`

#### Returns

`TimeTravel`\<`S`, `F`, `A`, `P`\>

## Methods

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/mutative/src/time-travel.ts:338](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L338)

Subscribe to state changes

#### Parameters

##### listener

[`TimeTravelListener`](../type-aliases/TimeTravelListener.md)\<`S`, `P`\>

#### Returns

() => `void`

***

### getState()

> **getState**(): `S`

Defined in: [packages/mutative/src/time-travel.ts:349](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L349)

Get current state

#### Returns

Type parameter **S**

***

### setState()

> **setState**(`updater`): `void`

Defined in: [packages/mutative/src/time-travel.ts:354](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L354)

Update state with new value or updater function

#### Parameters

##### updater

[`Updater`](../type-aliases/Updater.md)&lt;`S`&gt;

#### Returns

`void`

***

### beginBatch()

> **beginBatch**(`metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:455](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L455)

#### Parameters

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

`void`

***

### endBatch()

> **endBatch**(): `void`

Defined in: [packages/mutative/src/time-travel.ts:475](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L475)

#### Returns

`void`

***

### cancelBatch()

> **cancelBatch**(): `void`

Defined in: [packages/mutative/src/time-travel.ts:532](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L532)

Restore the active batch without archiving its rejected changes.

#### Returns

`void`

***

### batch()

> **batch**&lt;`R`&gt;(`callback`, `metadata?`): `R`

Defined in: [packages/mutative/src/time-travel.ts:591](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L591)

Group synchronous or asynchronous updates into one history entry.

#### Type Parameters

##### R

Type parameter **R**

#### Parameters

##### callback

() => `R`

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

Type parameter **R**

***

### archive()

> **archive**(): `void`

Defined in: [packages/mutative/src/time-travel.ts:712](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L712)

Archive temporary patches (manual mode only)

#### Returns

`void`

***

### getHistory()

> **getHistory**(): readonly `S`[]

Defined in: [packages/mutative/src/time-travel.ts:751](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L751)

Get complete history of states

#### Returns

readonly `S`[]

***

### go()

> **go**(`nextPosition`, `metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:818](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L818)

Go to specific position in history

#### Parameters

##### nextPosition

`number`

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

`void`

***

### back()

> **back**(`amount?`, `metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:882](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L882)

Go back in history

#### Parameters

##### amount?

`number` = `1`

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

`void`

***

### forward()

> **forward**(`amount?`, `metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:895](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L895)

Go forward in history

#### Parameters

##### amount?

`number` = `1`

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

`void`

***

### reset()

> **reset**(`metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:905](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L905)

Reset to initial state

#### Parameters

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

`void`

***

### canBack()

> **canBack**(): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:949](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L949)

Check if can go back

#### Returns

`boolean`

***

### canForward()

> **canForward**(): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:956](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L956)

Check if can go forward

#### Returns

`boolean`

***

### canArchive()

> **canArchive**(): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:967](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L967)

Check if can archive (manual mode)

#### Returns

`boolean`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/mutative/src/time-travel.ts:974](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L974)

Get current position

#### Returns

`number`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/mutative/src/time-travel.ts:979](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L979)

Query retained history size without replaying states or cloning patches.

#### Returns

`number`

***

### getHistoryEntryId()

> **getHistoryEntryId**(): `number`

Defined in: [packages/mutative/src/time-travel.ts:988](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L988)

Stable identity of the current entry, independent of a bounded cursor.

#### Returns

`number`

***

### hasHistoryEntry()

> **hasHistoryEntry**(`entryId`): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:993](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L993)

Whether an entry remains available in the retained timeline.

#### Parameters

##### entryId

`number`

#### Returns

`boolean`

***

### goToHistoryEntry()

> **goToHistoryEntry**(`entryId`, `metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:998](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L998)

Replay an exact retained entry; reject trimmed or replaced branches.

#### Parameters

##### entryId

`number`

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

`void`

***

### getPatches()

> **getPatches**(): [`TravelPatches`](../type-aliases/TravelPatches.md)&lt;`P`&gt;

Defined in: [packages/mutative/src/time-travel.ts:1010](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L1010)

Get all patches

#### Returns

[`TravelPatches`](../type-aliases/TravelPatches.md)&lt;`P`&gt;

***

### getControls()

> **getControls**(): `A` *extends* `true` ? [`TimeTravelControls`](../interfaces/TimeTravelControls.md)\<`S`, `F`, `P`\> : [`ManualTimeTravelControls`](../interfaces/ManualTimeTravelControls.md)\<`S`, `F`, `P`\>

Defined in: [packages/mutative/src/time-travel.ts:1026](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L1026)

Get controls object for external use

#### Returns

`A` *extends* `true` ? [`TimeTravelControls`](../interfaces/TimeTravelControls.md)\<`S`, `F`, `P`\> : [`ManualTimeTravelControls`](../interfaces/ManualTimeTravelControls.md)\<`S`, `F`, `P`\>

## Properties

### mutable

> `readonly` **mutable**: `boolean`

Defined in: [packages/mutative/src/time-travel.ts:120](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L120)
