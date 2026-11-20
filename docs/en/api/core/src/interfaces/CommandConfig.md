[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / CommandConfig

# Interface: CommandConfig\<T\>

Defined in: [packages/core/src/types.ts:285](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L285)

Configuration accepted by a Phase 2 void command handler.

## Extends

- `Omit`\<[`HandlerConfig`](HandlerConfig.md)&lt;`T`&gt;, `"when"`\>

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

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

### blocking?

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:424](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L424)

Supported 1.x shorthand for scheduling and error policy. `true` maps to
`await-before-next` + `fatal`; `false` maps to `start-and-continue` + `collect`.
Explicit `scheduling` or `errorPolicy` takes precedence for that field.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`blocking`](EffectConfig.md#blocking)

***

### scheduling?

> `optional` **scheduling?**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:427](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L427)

Async scheduling in sequential mode. Default: `await-before-next`.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`scheduling`](EffectConfig.md#scheduling)

***

### errorPolicy?

> `optional` **errorPolicy?**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:430](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L430)

Error behavior for this handler. Default: `collect`.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`errorPolicy`](EffectConfig.md#errorpolicy)

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:434](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L434)

At most one invocation per registration, across dispatches/retries.
Skipped handlers are not consumed. Default: false.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`once`](EffectConfig.md#once)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:437](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L437)

Debounce delay in milliseconds

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`debounce`](EffectConfig.md#debounce)

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:440](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L440)

Throttle delay in milliseconds

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`throttle`](EffectConfig.md#throttle)

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
