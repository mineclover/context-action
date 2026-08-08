[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ResolvedHandlerConfig

# Interface: ResolvedHandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:520](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L520)

Internal handler configuration with defaults resolved.

Timing, cleanup, and condition values remain optional because registration
does not synthesize them when they are omitted at runtime.

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority

> **priority**: `number`

Defined in: [packages/core/src/types.ts:521](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L521)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:522](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L522)

***

### blocking

> **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:523](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L523)

***

### scheduling

> **scheduling**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:524](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L524)

***

### errorPolicy

> **errorPolicy**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:525](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L525)

***

### once

> **once**: `boolean`

Defined in: [packages/core/src/types.ts:526](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L526)

***

### replaceExisting

> **replaceExisting**: `boolean`

Defined in: [packages/core/src/types.ts:527](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L527)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:528](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L528)

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:529](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L529)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:530](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L530)

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:531](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L531)

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:532](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L532)
