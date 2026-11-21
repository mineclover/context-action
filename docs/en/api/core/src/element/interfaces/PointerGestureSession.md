[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / PointerGestureSession

# Interface: PointerGestureSession

Defined in: [packages/core/src/element/pointer-gesture-session.ts:50](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L50)

## Methods

### start()

> **start**(`event`): `boolean`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:51](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L51)

#### Parameters

##### event

[`PointerGestureEventLike`](PointerGestureEventLike.md)

#### Returns

`boolean`

***

### move()

> **move**(`event`): `boolean`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:52](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L52)

#### Parameters

##### event

[`PointerGestureEventLike`](PointerGestureEventLike.md)

#### Returns

`boolean`

***

### commit()

> **commit**(`event?`): `boolean`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:53](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L53)

#### Parameters

##### event?

[`PointerGestureEventLike`](PointerGestureEventLike.md)

#### Returns

`boolean`

***

### cancel()

> **cancel**(`reason?`): `boolean`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:54](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L54)

#### Parameters

##### reason?

`string`

#### Returns

`boolean`

***

### handleKeyDown()

> **handleKeyDown**(`event`): `boolean`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:55](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L55)

#### Parameters

##### event

[`PointerGestureKeyEventLike`](PointerGestureKeyEventLike.md)

#### Returns

`boolean`

***

### isActive()

> **isActive**(): `boolean`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:56](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L56)

#### Returns

`boolean`

***

### getSnapshot()

> **getSnapshot**(): [`PointerGestureSnapshot`](PointerGestureSnapshot.md)

Defined in: [packages/core/src/element/pointer-gesture-session.ts:57](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L57)

#### Returns

[`PointerGestureSnapshot`](PointerGestureSnapshot.md)

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/core/src/element/pointer-gesture-session.ts:58](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/pointer-gesture-session.ts#L58)

#### Returns

`void`
