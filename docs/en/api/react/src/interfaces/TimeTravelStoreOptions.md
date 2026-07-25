[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreOptions

# Interface: TimeTravelStoreOptions\<T\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:21](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L21)

Configuration options for TimeTravelStore

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### maxHistory?

> `optional` **maxHistory?**: `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:23](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L23)

Maximum number of history entries

***

### mutable?

> `optional` **mutable?**: `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:30](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L30)

Enable mutable mode for structural sharing (default: true)

When true, unchanged parts of state keep the same reference,
enabling selective re-rendering with path-based subscriptions.

***

### isEqual?

> `optional` **isEqual?**: (`a`, `b`) => `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:32](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L32)

Custom equality function

#### Parameters

##### a

Type parameter **T**

##### b

Type parameter **T**

#### Returns

`boolean`

***

### notificationMode?

> `optional` **notificationMode?**: `"batched"` \| `"immediate"`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:34](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/react/src/stores/core/TimeTravelStore.ts#L34)

Notification mode: 'batched' uses RAF, 'immediate' notifies synchronously (default: 'immediate')
