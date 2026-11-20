[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ObserverConfig

# Interface: ObserverConfig\<T\>

Defined in: [packages/core/src/types.ts:258](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L258)

Scheduling and terminal-path selection for a post-result observer.

## Extends

- `Omit`\<[`HandlerConfig`](HandlerConfig.md)&lt;`T`&gt;, `"debounce"` \| `"throttle"` \| `"blocking"` \| `"errorPolicy"`\>

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### when?

> `optional` **when?**: `"success"` \| `"failure"` \| `"always"`

Defined in: [packages/core/src/types.ts:260](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L260)

Terminal path selection; consumed only by `registerObserver()`.

#### Overrides

[`HandlerConfig`](HandlerConfig.md).[`when`](HandlerConfig.md#when)

***

### priority?

> `optional` **priority?**: `number`

Defined in: [packages/core/src/types.ts:414](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L414)

Priority level (higher numbers execute first). Default: 0

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`priority`](EffectConfig.md#priority)

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:417](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L417)

Unique identifier for the handler. Auto-generated if not provided

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`id`](EffectConfig.md#id)

***

### scheduling?

> `optional` **scheduling?**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:427](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L427)

Async scheduling in sequential mode. Default: `await-before-next`.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`scheduling`](EffectConfig.md#scheduling)

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:434](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L434)

At most one invocation per registration, across dispatches/retries.
Skipped handlers are not consumed. Default: false.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`once`](EffectConfig.md#once)

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:443](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L443)

Replace existing handler with same ID. Default: true for backward compatibility

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`replaceExisting`](EffectConfig.md#replaceexisting)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:446](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L446)

Cleanup function to call when handler is unregistered

#### Returns

`void`

#### Inherited from

`Omit.cleanup`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:449](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L449)

Condition function to determine if handler should execute. Default: always execute

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

#### Inherited from

`Omit.condition`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:452](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L452)

Optional metadata copied into execution outcomes for diagnostics.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`metadata`](EffectConfig.md#metadata)
