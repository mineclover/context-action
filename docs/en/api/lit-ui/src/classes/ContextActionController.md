[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/lit-ui/src](../README.md) / ContextActionController

# Class: ContextActionController\<A\>

Defined in: [packages/lit-ui/src/context.ts:394](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L394)

ReactiveController that consumes an ActionRegister from the W3C Context hierarchy
across Shadow DOM boundaries and exposes typed dispatch methods.

## Implements

action-pipeline-system

## Implements

action-controller

## Memberof

core-concepts

## Type Parameters

### Generic type A

`A` *extends* `ActionPayloadMap` = `ActionPayloadMap`

Action payload map.

## Implements

- `ReactiveController`

## Accessors

### register

#### Get Signature

> **get** **register**(): `ActionRegister`\<`A`, \{ \}\> \| `undefined`

Defined in: [packages/lit-ui/src/context.ts:429](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L429)

The resolved ActionRegister instance, or undefined if no provider is present.

##### Returns

`ActionRegister`\<`A`, \{ \}\> \| `undefined`

***

### isPending

#### Get Signature

> **get** **isPending**(): `boolean`

Defined in: [packages/lit-ui/src/context.ts:434](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L434)

Whether an action dispatch is currently in progress.

##### Returns

`boolean`

***

### lastError

#### Get Signature

> **get** **lastError**(): `Error` \| `undefined`

Defined in: [packages/lit-ui/src/context.ts:439](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L439)

The last error thrown during an action dispatch, if any.

##### Returns

`Error` \| `undefined`

## Constructors

### Constructor

> **new ContextActionController**&lt;`A`&gt;(`host`, `options?`): `ContextActionController`&lt;`A`&gt;

Defined in: [packages/lit-ui/src/context.ts:403](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L403)

#### Parameters

##### host

`ReactiveControllerHost` & `HTMLElement`

##### options?

[`ContextActionControllerOptions`](../interfaces/ContextActionControllerOptions.md)&lt;`A`&gt;

#### Returns

`ContextActionController`&lt;`A`&gt;

## Methods

### dispatch()

> **dispatch**&lt;`K`&gt;(`action`, ...`args`): `Promise`&lt;`void`&gt;

Defined in: [packages/lit-ui/src/context.ts:470](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L470)

Dispatches an action through the context-injected ActionRegister pipeline.

#### Type Parameters

##### K

`K` *extends* `string`

Action name.

#### Parameters

##### action

Type parameter **K**

Name of the registered action.

##### args

...`DispatchArgs`\<`A`\[`K`\]\>

Action payload arguments.

#### Returns

`Promise`&lt;`void`&gt;

***

### dispatchWithResult()

> **dispatchWithResult**\<`K`, `R`\>(`action`, ...`args`): `Promise`&lt;`R`&gt;

Defined in: [packages/lit-ui/src/context.ts:502](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L502)

Dispatches an action and returns the pipeline execution result.

#### Type Parameters

##### K

`K` *extends* `string`

Action name.

##### R

`R` = `unknown`

Expected return value.

#### Parameters

##### action

Type parameter **K**

Name of the registered action.

##### args

...`DispatchArgs`\<`A`\[`K`\]\>

Action payload arguments.

#### Returns

`Promise`&lt;`R`&gt;

Pipeline result promise.

***

### hostConnected()

> **hostConnected**(): `void`

Defined in: [packages/lit-ui/src/context.ts:528](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L528)

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

Defined in: [packages/lit-ui/src/context.ts:529](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/context.ts#L529)

Called when the host is disconnected from the component tree. For custom
element hosts, this corresponds to the `disconnectedCallback()` lifecycle,
which is called the host or an ancestor component is disconnected from the
document.

#### Returns

`void`

#### Implementation of

`ReactiveController.hostDisconnected`
