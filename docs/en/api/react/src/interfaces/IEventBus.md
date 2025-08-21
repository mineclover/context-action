[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IEventBus

# Interface: IEventBus

Defined in: [packages/react/src/stores/core/types.ts:151](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L151)

## Properties

### on()

> **on**: &lt;`T`&gt;(`event`, `handler`) => [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/types.ts:152](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L152)

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### event

`string`

##### handler

[`StoreEventHandler`](StoreEventHandler.md)&lt;`T`&gt;

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### emit()

> **emit**: &lt;`T`&gt;(`event`, `data?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:153](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L153)

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### event

`string`

##### data?

Type parameter **T**

#### Returns

`void`

***

### off()

> **off**: (`event`, `handler?`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:154](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L154)

#### Parameters

##### event

`string`

##### handler?

[`StoreEventHandler`](StoreEventHandler.md)&lt;`any`&gt;

#### Returns

`void`

***

### clear()

> **clear**: () => `void`

Defined in: [packages/react/src/stores/core/types.ts:155](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/stores/core/types.ts#L155)

#### Returns

`void`
