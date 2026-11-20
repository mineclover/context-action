[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ResolvedHandlerConfig

# Interface: ResolvedHandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:615](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L615)

Internal handler configuration with defaults resolved.

Timing, cleanup, and condition values remain optional because registration
does not synthesize them when they are omitted at runtime.

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority

> **priority**: `number`

Defined in: [packages/core/src/types.ts:616](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L616)

***

### id

> **id**: `string`

Defined in: [packages/core/src/types.ts:617](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L617)

***

### blocking

> **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:618](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L618)

***

### scheduling

> **scheduling**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:619](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L619)

***

### errorPolicy

> **errorPolicy**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:620](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L620)

***

### once

> **once**: `boolean`

Defined in: [packages/core/src/types.ts:621](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L621)

***

### replaceExisting

> **replaceExisting**: `boolean`

Defined in: [packages/core/src/types.ts:622](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L622)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:623](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L623)

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:624](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L624)

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:625](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L625)

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:626](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L626)

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:627](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L627)
