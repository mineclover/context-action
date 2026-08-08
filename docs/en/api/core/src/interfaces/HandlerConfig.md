[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:473](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L473)

Handler configuration interface for controlling handler behavior within the pipeline

Configuration options that control how handlers are executed,
including priority, timing controls, and execution behavior.

## Examples

**Basic Handler Configuration**

```typescript
register.register('searchUsers', searchHandler, {
  priority: 100,                    // Execute before lower priority handlers
  debounce: 300,                   // Wait 300ms after last call
  throttle: 1000,                  // Limit to once per second
  once: false                      // Can be executed multiple times
})
```

**Production Handler**

```typescript
register.register('processPayment', paymentHandler, {
  priority: 200,
  blocking: true,                  // Wait for completion
  id: 'payment-handler'           // Custom ID
})
```

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority?

> `optional` **priority?**: `number`

Defined in: [packages/core/src/types.ts:475](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L475)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:478](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L478)

Unique identifier for the handler. Auto-generated if not provided

***

### ~~blocking?~~

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:484](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L484)

#### Deprecated

Use `scheduling` and `errorPolicy`. `true` maps to
`await-before-next` + `fatal`; `false` maps to `start-and-continue` + `collect`.

***

### scheduling?

> `optional` **scheduling?**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:487](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L487)

Async scheduling in sequential mode. Default: `await-before-next`.

***

### errorPolicy?

> `optional` **errorPolicy?**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:490](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L490)

Error behavior for this handler. Default: `collect`.

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:493](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L493)

Whether this handler should run once and then be removed. Default: false

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:496](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L496)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:499](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L499)

Throttle delay in milliseconds

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:502](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L502)

Replace existing handler with same ID. Default: true for backward compatibility

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:505](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L505)

Cleanup function to call when handler is unregistered

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:508](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L508)

Condition function to determine if handler should execute. Default: always execute

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:511](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L511)

Optional metadata copied into execution outcomes for diagnostics.
