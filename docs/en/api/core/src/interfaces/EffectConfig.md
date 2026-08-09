[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / EffectConfig

# Interface: EffectConfig\<T\>

Defined in: [packages/core/src/types.ts:417](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L417)

Configuration for the supported `registerEffect()` convenience API.
New code with a statically known role may call `registerGuard()` or
`registerObserver()` directly.

## Extends

- [`HandlerConfig`](HandlerConfig.md)&lt;`T`&gt;

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### effectKind

> **effectKind**: `"guard"` \| `"observer"`

Defined in: [packages/core/src/types.ts:419](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L419)

Select the explicit phase that owns this legacy effect.

***

### priority?

> `optional` **priority?**: `number`

Defined in: [packages/core/src/types.ts:549](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L549)

Priority level (higher numbers execute first). Default: 0

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`priority`](HandlerConfig.md#priority)

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:552](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L552)

Unique identifier for the handler. Auto-generated if not provided

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`id`](HandlerConfig.md#id)

***

### blocking?

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:559](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L559)

Supported 1.x shorthand for scheduling and error policy. `true` maps to
`await-before-next` + `fatal`; `false` maps to `start-and-continue` + `collect`.
Explicit `scheduling` or `errorPolicy` takes precedence for that field.

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`blocking`](HandlerConfig.md#blocking)

***

### scheduling?

> `optional` **scheduling?**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:562](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L562)

Async scheduling in sequential mode. Default: `await-before-next`.

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`scheduling`](HandlerConfig.md#scheduling)

***

### errorPolicy?

> `optional` **errorPolicy?**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:565](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L565)

Error behavior for this handler. Default: `collect`.

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`errorPolicy`](HandlerConfig.md#errorpolicy)

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:568](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L568)

Whether this handler should run once and then be removed. Default: false

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`once`](HandlerConfig.md#once)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:571](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L571)

Debounce delay in milliseconds

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`debounce`](HandlerConfig.md#debounce)

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:574](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L574)

Throttle delay in milliseconds

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`throttle`](HandlerConfig.md#throttle)

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:577](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L577)

Replace existing handler with same ID. Default: true for backward compatibility

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`replaceExisting`](HandlerConfig.md#replaceexisting)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:580](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L580)

Cleanup function to call when handler is unregistered

#### Returns

`void`

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`cleanup`](HandlerConfig.md#cleanup)

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:583](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L583)

Condition function to determine if handler should execute. Default: always execute

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`condition`](HandlerConfig.md#condition)

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:586](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L586)

Optional metadata copied into execution outcomes for diagnostics.

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`metadata`](HandlerConfig.md#metadata)

***

### when?

> `optional` **when?**: `"success"` \| `"failure"` \| `"always"`

Defined in: [packages/core/src/types.ts:589](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L589)

Terminal path selection; consumed only by `registerObserver()`.

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`when`](HandlerConfig.md#when)
