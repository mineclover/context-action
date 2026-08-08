[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ResolvedHandlerConfig

# Interface: ResolvedHandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:545](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L545)

Internal handler configuration with defaults resolved.

Timing, cleanup, and condition values remain optional because registration
does not synthesize them when they are omitted at runtime.

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority

> **priority**: `number`

Defined in: [packages/core/src/types.ts:546](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L546)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:547](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L547)

***

### blocking

> **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:548](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L548)

***

### scheduling

> **scheduling**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:549](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L549)

***

### errorPolicy

> **errorPolicy**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:550](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L550)

***

### once

> **once**: `boolean`

Defined in: [packages/core/src/types.ts:551](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L551)

***

### replaceExisting

> **replaceExisting**: `boolean`

Defined in: [packages/core/src/types.ts:552](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L552)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:553](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L553)

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:554](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L554)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:555](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L555)

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:556](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L556)

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:557](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L557)
