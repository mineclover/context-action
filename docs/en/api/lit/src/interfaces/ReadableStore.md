[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit/src](../README.md) / ReadableStore

# Interface: ReadableStore\<T\>

Defined in: [packages/lit/src/types.ts:29](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L29)

Minimal structural interface for stores readable by Lit controllers.
Decoupled from React, allowing seamless interoperability with
`@context-action/react` stores, `@context-action/preact` sources, or custom reactive containers.

## Implements

store-interface

## Memberof

api-terms

## Type Parameters

### Generic type T

`T` = `unknown`

The type of state managed by the store.

## Methods

### getValue()

> **getValue**(): `T`

Defined in: [packages/lit/src/types.ts:33](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L33)

Retrieves the current state value synchronously.

#### Returns

Type parameter **T**

***

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/lit/src/types.ts:40](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L40)

Subscribes a listener to receive notifications when state changes.

#### Parameters

##### listener

[`Listener`](../type-aliases/Listener.md)

Callback invoked when the store value updates.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function to terminate the subscription.

***

### getSnapshot()?

> `optional` **getSnapshot**(): `unknown`

Defined in: [packages/lit/src/types.ts:45](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L45)

Optional snapshot retrieval function (e.g. for React useSyncExternalStore or metadata snapshots).

#### Returns

`unknown`

## Properties

### name?

> `readonly` `optional` **name?**: `string`

Defined in: [packages/lit/src/types.ts:50](https://github.com/mineclover/context-action/blob/main/packages/lit/src/types.ts#L50)

Optional human-readable store name for debugging and diagnostics.
