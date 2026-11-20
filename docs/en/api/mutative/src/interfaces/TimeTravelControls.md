[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / TimeTravelControls

# Interface: TimeTravelControls\<S, F, P\>

Defined in: [packages/mutative/src/types.ts:101](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L101)

@context-action/mutative

Mutative-based immutability and time-travel utilities.
Drop-in replacement for Immer with undo/redo capabilities.

## Extended by

- [`ManualTimeTravelControls`](ManualTimeTravelControls.md)

## Type Parameters

### Generic type S

Type parameter **S**

### Generic type F

`F` *extends* `boolean` = `false`

### Generic type P

`P` *extends* [`PatchesOption`](../type-aliases/PatchesOption.md) = `object`

## Properties

### position

> `readonly` **position**: `number`

Defined in: [packages/mutative/src/types.ts:107](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L107)

Current position in history

***

### getHistory

> **getHistory**: () => readonly [`Value`](../type-aliases/Value.md)\<`S`, `F`\>[]

Defined in: [packages/mutative/src/types.ts:110](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L110)

Get complete history of states

#### Returns

readonly [`Value`](../type-aliases/Value.md)\<`S`, `F`\>[]

***

### patches

> `readonly` **patches**: [`TravelPatches`](../type-aliases/TravelPatches.md)&lt;`P`&gt;

Defined in: [packages/mutative/src/types.ts:113](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L113)

All patches in history

***

### back

> **back**: (`amount?`) => `void`

Defined in: [packages/mutative/src/types.ts:116](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L116)

Go back in history

#### Parameters

##### amount?

`number`

#### Returns

`void`

***

### forward

> **forward**: (`amount?`) => `void`

Defined in: [packages/mutative/src/types.ts:119](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L119)

Go forward in history

#### Parameters

##### amount?

`number`

#### Returns

`void`

***

### reset

> **reset**: () => `void`

Defined in: [packages/mutative/src/types.ts:122](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L122)

Reset to initial state

#### Returns

`void`

***

### go

> **go**: (`position`) => `void`

Defined in: [packages/mutative/src/types.ts:125](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L125)

Go to specific position

#### Parameters

##### position

`number`

#### Returns

`void`

***

### canBack

> **canBack**: () => `boolean`

Defined in: [packages/mutative/src/types.ts:128](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L128)

Check if can go back

#### Returns

`boolean`

***

### canForward

> **canForward**: () => `boolean`

Defined in: [packages/mutative/src/types.ts:131](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L131)

Check if can go forward

#### Returns

`boolean`
