[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit/src](../README.md) / StoreController

# Class: StoreController\<T, Selected\>

Defined in: [packages/lit/src/store-controller.ts:35](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L35)

ReactiveController that subscribes a Lit host element to a Context-Action store.

Key guarantees:
1. Attaches to host via `host.addController(this)`.
2. Cleanly subscribes on connection or instantiation, refreshing snapshot immediately to close race gaps.
3. Supports fine-grained selective projections with memoization (`equalityFn`), suppressing `host.requestUpdate()`.
4. Ensures zero memory leaks by immediately and completely unsubscribing on `hostDisconnected()`.
5. Automatically resubscribes and synchronizes state on `hostConnected()`.
6. Completely decoupled from the DOM.

## Implements

store-integration-pattern

## Memberof

core-concepts

## Type Parameters

### Generic type T

`T` = `unknown`

The raw state type managed by the store.

### Selected

`Selected` = `T`

The projected state type exposed by the controller (defaults to `T`).

## Implements

- `ReactiveController`

## Accessors

### value

#### Get Signature

> **get** **value**(): `Selected`

Defined in: [packages/lit/src/store-controller.ts:95](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L95)

The current projected slice of store state.

##### Returns

`Selected`

***

### isSubscribed

#### Get Signature

> **get** **isSubscribed**(): `boolean`

Defined in: [packages/lit/src/store-controller.ts:102](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L102)

Whether the controller currently holds an active store subscription.

##### Returns

`boolean`

## Constructors

### Constructor

> **new StoreController**\<`T`, `Selected`\>(`host`, `store`, `options?`): `StoreController`\<`T`, `Selected`\>

Defined in: [packages/lit/src/store-controller.ts:45](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L45)

#### Parameters

##### host

`ReactiveControllerHost`

##### store

[`ReadableStore`](../interfaces/ReadableStore.md)&lt;`T`&gt;

##### options?

[`StoreControllerOptions`](../interfaces/StoreControllerOptions.md)\<`T`, `Selected`\>

#### Returns

`StoreController`\<`T`, `Selected`\>

## Methods

### subscribe()

> **subscribe**(): `void`

Defined in: [packages/lit/src/store-controller.ts:147](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L147)

Subscribes to the store and closes the read/subscribe race gap.
Safe to call multiple times (idempotent).

#### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(): `void`

Defined in: [packages/lit/src/store-controller.ts:175](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L175)

Unsubscribes from the store. Safe to call multiple times (idempotent).
Guarantees zero memory leaks by removing listeners from the store.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/lit/src/store-controller.ts:202](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L202)

Disposes the controller, unsubscribing from the store and unregistering from the host.

#### Returns

`void`

***

### hostConnected()

> **hostConnected**(): `void`

Defined in: [packages/lit/src/store-controller.ts:214](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L214)

Lifecycle hook: invoked when host connects to the DOM.
Automatically resubscribes to the store and refreshes the snapshot.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostConnected`

***

### hostDisconnected()

> **hostDisconnected**(): `void`

Defined in: [packages/lit/src/store-controller.ts:222](https://github.com/mineclover/context-action/blob/main/packages/lit/src/store-controller.ts#L222)

Lifecycle hook: invoked when host disconnects from the DOM.
Immediately unbinds all store subscriptions to ensure zero memory leaks.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostDisconnected`
