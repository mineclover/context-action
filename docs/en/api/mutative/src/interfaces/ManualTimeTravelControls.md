[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/mutative/src](../README.md) / ManualTimeTravelControls

# Interface: ManualTimeTravelControls\<S, F, P\>

Defined in: [packages/mutative/src/types.ts:134](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L134)

@context-action/mutative

Mutative-based immutability and time-travel utilities.
Drop-in replacement for Immer with undo/redo capabilities.

## Extends

- [`TimeTravelControls`](TimeTravelControls.md)\<`S`, `F`, `P`\>

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

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`position`](TimeTravelControls.md#position)

***

### getHistory

> **getHistory**: () => readonly [`Value`](../type-aliases/Value.md)\<`S`, `F`\>[]

Defined in: [packages/mutative/src/types.ts:110](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L110)

Get complete history of states

#### Returns

readonly [`Value`](../type-aliases/Value.md)\<`S`, `F`\>[]

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`getHistory`](TimeTravelControls.md#gethistory)

***

### patches

> `readonly` **patches**: [`TravelPatches`](../type-aliases/TravelPatches.md)&lt;`P`&gt;

Defined in: [packages/mutative/src/types.ts:113](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L113)

All patches in history

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`patches`](TimeTravelControls.md#patches)

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

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`back`](TimeTravelControls.md#back)

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

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`forward`](TimeTravelControls.md#forward)

***

### reset

> **reset**: () => `void`

Defined in: [packages/mutative/src/types.ts:122](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L122)

Reset to initial state

#### Returns

`void`

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`reset`](TimeTravelControls.md#reset)

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

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`go`](TimeTravelControls.md#go)

***

### canBack

> **canBack**: () => `boolean`

Defined in: [packages/mutative/src/types.ts:128](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L128)

Check if can go back

#### Returns

`boolean`

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`canBack`](TimeTravelControls.md#canback)

***

### canForward

> **canForward**: () => `boolean`

Defined in: [packages/mutative/src/types.ts:131](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L131)

Check if can go forward

#### Returns

`boolean`

#### Inherited from

[`TimeTravelControls`](TimeTravelControls.md).[`canForward`](TimeTravelControls.md#canforward)

***

### archive

> **archive**: () => `void`

Defined in: [packages/mutative/src/types.ts:140](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L140)

Archive current temporary changes

#### Returns

`void`

***

### canArchive

> **canArchive**: () => `boolean`

Defined in: [packages/mutative/src/types.ts:143](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L143)

Check if can archive

#### Returns

`boolean`
