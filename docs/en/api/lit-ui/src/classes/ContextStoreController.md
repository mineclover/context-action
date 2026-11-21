[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / ContextStoreController

# Class: ContextStoreController\<T, Selected\>

Defined in: [packages/lit-ui/src/context.ts:220](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L220)

ReactiveController that consumes a Context-Action ReadableStore from the W3C Context
hierarchy across Shadow DOM boundaries, subscribes to state updates, and triggers host re-renders.

Key guarantees:
1. Attaches to host via `host.addController(this)`.
2. Uses `@lit/context` ContextConsumer to dynamically resolve store instances across Shadow DOM boundaries.
3. Supports selective projections with memoization (`equalityFn`).
4. Ensures ZERO memory leaks: completely terminates store subscription when `hostDisconnected()` runs.
5. Re-evaluates store state and resubscribes on `hostConnected()`.

## Implements

store-integration-pattern

## Implements

reactive-state-management

## Memberof

core-concepts

## Type Parameters

### Generic type T

`T` = `unknown`

Source store state type.

### Selected

`Selected` = `T`

Derived slice type.

## Implements

- `ReactiveController`

## Accessors

### value

#### Get Signature

> **get** **value**(): `Selected` \| `undefined`

Defined in: [packages/lit-ui/src/context.ts:258](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L258)

Current projected state derived from the injected store, or undefined if not yet provided.

##### Returns

`Selected` \| `undefined`

***

### store

#### Get Signature

> **get** **store**(): `ReadableStore`&lt;`T`&gt; \| `undefined`

Defined in: [packages/lit-ui/src/context.ts:263](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L263)

The resolved ReadableStore instance currently bound to this controller.

##### Returns

`ReadableStore`&lt;`T`&gt; \| `undefined`

***

### isResolved

#### Get Signature

> **get** **isResolved**(): `boolean`

Defined in: [packages/lit-ui/src/context.ts:268](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L268)

Indicates whether the context request has been satisfied by an ancestor provider.

##### Returns

`boolean`

## Constructors

### Constructor

> **new ContextStoreController**\<`T`, `Selected`\>(`host`, `options`): `ContextStoreController`\<`T`, `Selected`\>

Defined in: [packages/lit-ui/src/context.ts:230](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L230)

#### Parameters

##### host

`ReactiveControllerHost` & `HTMLElement`

##### options

[`ContextStoreControllerOptions`](../interfaces/ContextStoreControllerOptions.md)\<`T`, `Selected`\>

#### Returns

`ContextStoreController`\<`T`, `Selected`\>

## Methods

### hostConnected()

> **hostConnected**(): `void`

Defined in: [packages/lit-ui/src/context.ts:359](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L359)

Called when the host is connected to the component tree. For custom
element hosts, this corresponds to the `connectedCallback()` lifecycle,
which is only called when the component is connected to the document.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostConnected`

***

### hostDisconnected()

> **hostDisconnected**(): `void`

Defined in: [packages/lit-ui/src/context.ts:368](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L368)

Called when the host is disconnected from the component tree. For custom
element hosts, this corresponds to the `disconnectedCallback()` lifecycle,
which is called the host or an ancestor component is disconnected from the
document.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostDisconnected`
