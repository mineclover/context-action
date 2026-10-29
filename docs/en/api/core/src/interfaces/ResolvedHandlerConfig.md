[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ResolvedHandlerConfig

# Interface: ResolvedHandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:599](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L599)

Internal handler configuration with defaults resolved.

Timing, cleanup, and condition values remain optional because registration
does not synthesize them when they are omitted at runtime.

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority

> **priority**: `number`

Defined in: [packages/core/src/types.ts:600](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L600)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:601](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L601)

***

### blocking

> **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:602](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L602)

***

### scheduling

> **scheduling**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:603](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L603)

***

### errorPolicy

> **errorPolicy**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:604](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L604)

***

### once

> **once**: `boolean`

Defined in: [packages/core/src/types.ts:605](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L605)

***

### replaceExisting

> **replaceExisting**: `boolean`

Defined in: [packages/core/src/types.ts:606](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L606)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:607](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L607)

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:608](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L608)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:609](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L609)

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:610](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L610)

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:611](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L611)
