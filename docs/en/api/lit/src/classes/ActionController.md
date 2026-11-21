[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit/src](../README.md) / ActionController

# Class: ActionController\<A, TResultMap\>

Defined in: [packages/lit/src/action-controller.ts:88](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L88)

Lit ReactiveController that wraps a Context-Action ActionRegister.

Bridges action pipeline orchestration to Lit web components by providing:
- Strongly-typed action dispatches (`dispatch`, `dispatchWithResult`).
- Coalesced pending state tracking (`isPending`) triggering `host.requestUpdate()`
  strictly on 0 <-> >0 active count transitions.
- Automatic abort cancellation of in-flight dispatches on `hostDisconnected()`.

## Implements

action-controller

## Implements

action-pipeline-system

## Memberof

core-concepts

## Type Parameters

### Generic type A

`A` *extends* `ActionPayloadMap` = `Record`\<`string`, `any`\>

Action payload mapping interface extending ActionPayloadMap.

### TResultMap

`TResultMap` *extends* `ActionResultMap`&lt;`A`&gt; = \{ \}

Action-to-result mapping interface extending ActionResultMap&lt;A&gt;.

## Implements

- `ReactiveController`

## Accessors

### register

#### Get Signature

> **get** **register**(): `ActionRegister`\<`A`, `TResultMap`\>

Defined in: [packages/lit/src/action-controller.ts:129](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L129)

Reference to the underlying ActionRegister instance.

##### Returns

`ActionRegister`\<`A`, `TResultMap`\>

***

### isPending

#### Get Signature

> **get** **isPending**(): `boolean`

Defined in: [packages/lit/src/action-controller.ts:136](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L136)

True if one or more action dispatches are currently in flight; false otherwise.

##### Returns

`boolean`

***

### activeCount

#### Get Signature

> **get** **activeCount**(): `number`

Defined in: [packages/lit/src/action-controller.ts:143](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L143)

Current number of concurrent in-flight dispatches.

##### Returns

`number`

## Constructors

### Constructor

> **new ActionController**\<`A`, `TResultMap`\>(`host`, `register`, `_options?`): `ActionController`\<`A`, `TResultMap`\>

Defined in: [packages/lit/src/action-controller.ts:105](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L105)

Creates an instance of ActionController and registers it with the host element.

#### Parameters

##### host

`ReactiveControllerHost`

The Lit element or ReactiveControllerHost managing this controller.

##### register

`ActionRegister`\<`A`, `TResultMap`\>

The Context-Action ActionRegister instance to delegate dispatches to.

##### \_options?

[`ActionControllerOptions`](../type-aliases/ActionControllerOptions.md)

Optional configuration options.

#### Returns

`ActionController`\<`A`, `TResultMap`\>

## Methods

### hostConnected()

> **hostConnected**(): `void`

Defined in: [packages/lit/src/action-controller.ts:176](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L176)

Lit lifecycle hook: invoked when the host element connects to the DOM.
Recreates the internal AbortController if it was aborted during a previous disconnection.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostConnected`

***

### hostDisconnected()

> **hostDisconnected**(): `void`

Defined in: [packages/lit/src/action-controller.ts:186](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L186)

Lit lifecycle hook: invoked when the host element disconnects from the DOM.
Aborts all in-flight dispatches associated with this element.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostDisconnected`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/lit/src/action-controller.ts:195](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L195)

Disposes the controller, aborting any in-flight dispatches and unregistering from the host.

#### Returns

`void`

***

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/lit/src/action-controller.ts:210](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L210)

Manually aborts all currently active in-flight dispatches and resets the controller.

#### Parameters

##### reason?

`unknown`

Optional cancellation reason.

#### Returns

`void`

***

### dispatch()

> **dispatch**&lt;`K`&gt;(`action`, ...`args`): `Promise`&lt;`void`&gt;

Defined in: [packages/lit/src/action-controller.ts:225](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L225)

Dispatches an action through the action pipeline.

Automatically tracks `isPending` state and links the dispatch to the element's lifecycle
cancellation token.

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

Action key to dispatch.

##### args

...`DispatchArgs`\<`A`\[`K`\]\>

Action payload and optional dispatch options tuple.

#### Returns

`Promise`&lt;`void`&gt;

A promise that resolves when all non-blocking handlers settle.

***

### dispatchWithResult()

#### Call Signature

> **dispatchWithResult**&lt;`K`&gt;(`action`, ...`args`): `Promise`\<`ExecutionResult`\<`ActionResult`\<`TResultMap`, `K`\>\>\>

Defined in: [packages/lit/src/action-controller.ts:267](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L267)

Dispatches an action through the action pipeline and aggregates handler results.

Automatically tracks `isPending` state and links the dispatch to the element's lifecycle
cancellation token.

##### Type Parameters

###### K

`K` *extends* `string`

##### Parameters

###### action

Type parameter **K**

Action key to dispatch.

###### args

...`DispatchArgs`\<`A`\[`K`\]\>

Action payload and optional dispatch options tuple.

##### Returns

`Promise`\<`ExecutionResult`\<`ActionResult`\<`TResultMap`, `K`\>\>\>

Detailed ExecutionResult containing execution status and collected results.

#### Call Signature

> **dispatchWithResult**\<`K`, `R`\>(`action`, ...`args`): `Promise`\<`ExecutionResult`&lt;`R`&gt;\>

Defined in: [packages/lit/src/action-controller.ts:271](https://github.com/mineclover/context-action/blob/main/packages/lit/src/action-controller.ts#L271)

Dispatches an action through the action pipeline and aggregates handler results.

Automatically tracks `isPending` state and links the dispatch to the element's lifecycle
cancellation token.

##### Type Parameters

###### K

`K` *extends* `string`

###### R

`R` = `unknown`

##### Parameters

###### action

Type parameter **K**

Action key to dispatch.

###### args

...`DispatchArgs`\<`A`\[`K`\]\>

Action payload and optional dispatch options tuple.

##### Returns

`Promise`\<`ExecutionResult`&lt;`R`&gt;\>

Detailed ExecutionResult containing execution status and collected results.
