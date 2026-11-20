[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / TimeTravel

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

Defined in: [packages/mutative/src/time-travel.ts:158](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L158)

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

Defined in: [packages/mutative/src/time-travel.ts:337](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L337)

Subscribe to state changes

#### Parameters

##### listener

[`TimeTravelListener`](../type-aliases/TimeTravelListener.md)\<`S`, `P`\>

#### Returns

() => `void`

***

### getState()

> **getState**(): `S`

Defined in: [packages/mutative/src/time-travel.ts:348](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L348)

Get current state

#### Returns

Type parameter **S**

***

### setState()

> **setState**(`updater`): `void`

Defined in: [packages/mutative/src/time-travel.ts:353](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L353)

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

Defined in: [packages/mutative/src/time-travel.ts:473](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L473)

#### Returns

`void`

***

### cancelBatch()

> **cancelBatch**(): `void`

Defined in: [packages/mutative/src/time-travel.ts:524](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L524)

Restore the active batch without archiving its rejected changes.

#### Returns

`void`

***

### batch()

> **batch**&lt;`R`&gt;(`callback`, `metadata?`): `R`

Defined in: [packages/mutative/src/time-travel.ts:578](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L578)

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

Defined in: [packages/mutative/src/time-travel.ts:696](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L696)

Archive temporary patches (manual mode only)

#### Returns

`void`

***

### getHistory()

> **getHistory**(): readonly `S`[]

Defined in: [packages/mutative/src/time-travel.ts:735](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L735)

Get complete history of states

#### Returns

readonly `S`[]

***

### go()

> **go**(`nextPosition`, `metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:802](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L802)

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

Defined in: [packages/mutative/src/time-travel.ts:868](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L868)

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

Defined in: [packages/mutative/src/time-travel.ts:881](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L881)

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

Defined in: [packages/mutative/src/time-travel.ts:891](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L891)

Reset to initial state

#### Parameters

##### metadata?

[`TimeTravelTransitionMeta`](../interfaces/TimeTravelTransitionMeta.md)

#### Returns

`void`

***

### canBack()

> **canBack**(): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:932](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L932)

Check if can go back

#### Returns

`boolean`

***

### canForward()

> **canForward**(): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:939](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L939)

Check if can go forward

#### Returns

`boolean`

***

### canArchive()

> **canArchive**(): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:950](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L950)

Check if can archive (manual mode)

#### Returns

`boolean`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/mutative/src/time-travel.ts:957](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L957)

Get current position

#### Returns

`number`

***

### getHistoryLength()

> **getHistoryLength**(): `number`

Defined in: [packages/mutative/src/time-travel.ts:962](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L962)

Query retained history size without replaying states or cloning patches.

#### Returns

`number`

***

### getHistoryEntryId()

> **getHistoryEntryId**(): `number`

Defined in: [packages/mutative/src/time-travel.ts:971](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L971)

Stable identity of the current entry, independent of a bounded cursor.

#### Returns

`number`

***

### hasHistoryEntry()

> **hasHistoryEntry**(`entryId`): `boolean`

Defined in: [packages/mutative/src/time-travel.ts:976](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L976)

Whether an entry remains available in the retained timeline.

#### Parameters

##### entryId

`number`

#### Returns

`boolean`

***

### goToHistoryEntry()

> **goToHistoryEntry**(`entryId`, `metadata?`): `void`

Defined in: [packages/mutative/src/time-travel.ts:981](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L981)

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

Defined in: [packages/mutative/src/time-travel.ts:990](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L990)

Get all patches

#### Returns

[`TravelPatches`](../type-aliases/TravelPatches.md)&lt;`P`&gt;

***

### getControls()

> **getControls**(): `A` *extends* `true` ? [`TimeTravelControls`](../interfaces/TimeTravelControls.md)\<`S`, `F`, `P`\> : [`ManualTimeTravelControls`](../interfaces/ManualTimeTravelControls.md)\<`S`, `F`, `P`\>

Defined in: [packages/mutative/src/time-travel.ts:1006](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L1006)

Get controls object for external use

#### Returns

`A` *extends* `true` ? [`TimeTravelControls`](../interfaces/TimeTravelControls.md)\<`S`, `F`, `P`\> : [`ManualTimeTravelControls`](../interfaces/ManualTimeTravelControls.md)\<`S`, `F`, `P`\>

## Properties

### mutable

> `readonly` **mutable**: `boolean`

Defined in: [packages/mutative/src/time-travel.ts:120](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/time-travel.ts#L120)
