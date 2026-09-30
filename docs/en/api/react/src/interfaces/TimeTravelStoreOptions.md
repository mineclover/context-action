[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreOptions

# Interface: TimeTravelStoreOptions\<T\>

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:43](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L43)

Configuration options for TimeTravelStore

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### maxHistory?

> `optional` **maxHistory?**: `number`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:45](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L45)

Maximum number of history entries

***

### mutable?

> `optional` **mutable?**: `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:52](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L52)

Enable mutable mode for structural sharing (default: true)

When true, unchanged parts of state keep the same reference,
enabling selective re-rendering with path-based subscriptions.

***

### isEqual?

> `optional` **isEqual?**: (`a`, `b`) => `boolean`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:54](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L54)

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

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:56](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L56)

Notification mode: 'batched' uses RAF, 'immediate' notifies synchronously (default: 'immediate')

***

### readMode?

> `optional` **readMode?**: `"reference"` \| `"safe"`

Defined in: [packages/react/src/stores/core/TimeTravelStore.ts:58](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/TimeTravelStore.ts#L58)

Public read policy. Reference preserves legacy structural-sharing reads.
