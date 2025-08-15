[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcher

# Interface: ActionDispatcher()\<T\>

Defined in: [packages/core/src/types.ts:392](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L392)

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)

## Call Signature

> **ActionDispatcher**&lt;`K`&gt;(`action`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:394](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L394)

Dispatch an action without payload

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

`T`\[`K`\] *extends* `void` ? `K` : `never`

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`&lt;`void`&gt;

## Call Signature

> **ActionDispatcher**&lt;`K`&gt;(`action`, `payload`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:397](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L397)

Dispatch an action with payload

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

Type parameter **K**

#### payload

`T`\[`K`\]

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`&lt;`void`&gt;
