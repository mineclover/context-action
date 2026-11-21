[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / RovingFocusOptions

# Interface: RovingFocusOptions

Defined in: [packages/core/src/element/roving-focus.ts:13](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L13)

## Methods

### getItems()

> **getItems**(): readonly [`RovingFocusItem`](RovingFocusItem.md)[]

Defined in: [packages/core/src/element/roving-focus.ts:16](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L16)

#### Returns

readonly [`RovingFocusItem`](RovingFocusItem.md)[]

***

### getActiveId()

> **getActiveId**(): `string` \| `null` \| `undefined`

Defined in: [packages/core/src/element/roving-focus.ts:17](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L17)

#### Returns

`string` \| `null` \| `undefined`

## Properties

### orientation?

> `readonly` `optional` **orientation?**: [`RovingFocusOrientation`](../type-aliases/RovingFocusOrientation.md)

Defined in: [packages/core/src/element/roving-focus.ts:14](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L14)

***

### loop?

> `readonly` `optional` **loop?**: `boolean`

Defined in: [packages/core/src/element/roving-focus.ts:15](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L15)

***

### onFocusChange?

> `optional` **onFocusChange?**: (`nextId`) => `void`

Defined in: [packages/core/src/element/roving-focus.ts:18](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L18)

#### Parameters

##### nextId

`string`

#### Returns

`void`
