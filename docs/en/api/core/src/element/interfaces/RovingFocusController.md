[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / RovingFocusController

# Interface: RovingFocusController

Defined in: [packages/core/src/element/roving-focus.ts:21](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L21)

## Methods

### getTabIndex()

> **getTabIndex**(`itemId`): `-1` \| `0`

Defined in: [packages/core/src/element/roving-focus.ts:22](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L22)

#### Parameters

##### itemId

`string`

#### Returns

`-1` \| `0`

***

### handleKeyDown()

> **handleKeyDown**(`currentId`, `event`): `string` \| `null`

Defined in: [packages/core/src/element/roving-focus.ts:23](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/roving-focus.ts#L23)

#### Parameters

##### currentId

`string`

##### event

[`RovingFocusKeyEventLike`](RovingFocusKeyEventLike.md)

#### Returns

`string` \| `null`
