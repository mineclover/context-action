[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IEventBus

# Interface: IEventBus

Defined in: [packages/react/src/stores/core/types.ts:192](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L192)

## Properties

### on()

> **on**: &lt;`T`&gt;(`event`, `handler`) => [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/types.ts:193](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L193)

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

Defined in: [packages/react/src/stores/core/types.ts:194](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L194)

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

Defined in: [packages/react/src/stores/core/types.ts:195](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L195)

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

Defined in: [packages/react/src/stores/core/types.ts:196](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L196)

#### Returns

`void`
