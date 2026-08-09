[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / GuardConfig

# Interface: GuardConfig\<T\>

Defined in: [packages/core/src/types.ts:411](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L411)

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

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:568](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L568)

Whether this handler should run once and then be removed. Default: false

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`once`](HandlerConfig.md#once)

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

`Omit.cleanup`

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

`Omit.condition`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:586](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L586)

Optional metadata copied into execution outcomes for diagnostics.

#### Inherited from

[`HandlerConfig`](HandlerConfig.md).[`metadata`](HandlerConfig.md#metadata)
