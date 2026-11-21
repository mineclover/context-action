[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / PointerGestureOptions

# Interface: PointerGestureOptions

Defined in: [packages/core/src/element/pointer-gesture-session.ts:42](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L42)

## Properties

### onStart?

> `optional` **onStart?**: (`snapshot`) => `boolean` \| `void`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:44](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L44)

#### Parameters

##### snapshot

[`PointerGestureSnapshot`](PointerGestureSnapshot.md)

#### Returns

`boolean` \| `void`

***

### onMove?

> `optional` **onMove?**: (`snapshot`) => `void`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:45](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L45)

#### Parameters

##### snapshot

[`PointerGestureSnapshot`](PointerGestureSnapshot.md)

#### Returns

`void`

***

### onCommit?

> `optional` **onCommit?**: (`snapshot`) => `void`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:46](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L46)

#### Parameters

##### snapshot

[`PointerGestureSnapshot`](PointerGestureSnapshot.md)

#### Returns

`void`

***

### onCancel?

> `optional` **onCancel?**: (`snapshot`, `reason?`) => `void`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:47](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L47)

#### Parameters

##### snapshot

[`PointerGestureSnapshot`](PointerGestureSnapshot.md)

##### reason?

`string`

#### Returns

`void`
