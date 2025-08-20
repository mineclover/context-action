[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IEventBus

# Interface: IEventBus

Defined in: [packages/react/src/stores/core/types.ts:188](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L188)

## Properties

### on()

> **on**: &lt;`T`&gt;(`event`, `handler`) => [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/types.ts:189](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L189)

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

Defined in: [packages/react/src/stores/core/types.ts:190](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L190)

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

Defined in: [packages/react/src/stores/core/types.ts:191](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L191)

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

Defined in: [packages/react/src/stores/core/types.ts:192](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/types.ts#L192)

#### Returns

`void`
