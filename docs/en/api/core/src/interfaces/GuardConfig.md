[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / GuardConfig

# Interface: GuardConfig\<T\>

Defined in: [packages/core/src/types.ts:417](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L417)

Configuration accepted by an admission guard. Guard failures always deny
admission, so scheduling and error-policy controls are intentionally not
configurable.

## Extends

- `Omit`\<[`HandlerConfig`](HandlerConfig.md)&lt;`T`&gt;, `"blocking"` \| `"scheduling"` \| `"errorPolicy"` \| `"debounce"` \| `"throttle"` \| `"when"`\>

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority?

> `optional` **priority?**: `number`

Defined in: [packages/core/src/types.ts:565](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L565)

Priority level (higher numbers execute first). Default: 0

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`priority`](EffectConfig.md#priority)

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:568](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L568)

Unique identifier for the handler. Auto-generated if not provided

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`id`](EffectConfig.md#id)

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:585](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L585)

At most one invocation per registration, across dispatches/retries.
Skipped handlers are not consumed. Default: false.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`once`](EffectConfig.md#once)

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:594](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L594)

Replace existing handler with same ID. Default: true for backward compatibility

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`replaceExisting`](EffectConfig.md#replaceexisting)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:597](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L597)

Cleanup function to call when handler is unregistered

#### Returns

`void`

#### Inherited from

`Omit.cleanup`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:600](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L600)

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

Defined in: [packages/core/src/types.ts:603](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L603)

Optional metadata copied into execution outcomes for diagnostics.

#### Inherited from

[`EffectConfig`](EffectConfig.md).[`metadata`](EffectConfig.md#metadata)
