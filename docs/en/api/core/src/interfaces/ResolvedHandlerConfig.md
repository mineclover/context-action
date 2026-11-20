[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ResolvedHandlerConfig

# Interface: ResolvedHandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:464](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L464)

Internal handler configuration with defaults resolved.

Timing, cleanup, and condition values remain optional because registration
does not synthesize them when they are omitted at runtime.

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority

> **priority**: `number`

Defined in: [packages/core/src/types.ts:465](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L465)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:466](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L466)

***

### blocking

> **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:467](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L467)

***

### scheduling

> **scheduling**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:468](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L468)

***

### errorPolicy

> **errorPolicy**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:469](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L469)

***

### once

> **once**: `boolean`

Defined in: [packages/core/src/types.ts:470](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L470)

***

### replaceExisting

> **replaceExisting**: `boolean`

Defined in: [packages/core/src/types.ts:471](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L471)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:472](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L472)

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:473](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L473)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:474](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L474)

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:475](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L475)

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:476](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L476)
