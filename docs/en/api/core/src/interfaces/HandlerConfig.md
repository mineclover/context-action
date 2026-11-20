[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:412](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L412)

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

## Extended by

- [`EffectConfig`](EffectConfig.md)

## Type Parameters

### Generic type T

`T` = `unknown`

## Properties

### priority?

> `optional` **priority?**: `number`

Defined in: [packages/core/src/types.ts:414](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L414)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:417](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L417)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:424](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L424)

Supported 1.x shorthand for scheduling and error policy. `true` maps to
`await-before-next` + `fatal`; `false` maps to `start-and-continue` + `collect`.
Explicit `scheduling` or `errorPolicy` takes precedence for that field.

***

### scheduling?

> `optional` **scheduling?**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:427](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L427)

Async scheduling in sequential mode. Default: `await-before-next`.

***

### errorPolicy?

> `optional` **errorPolicy?**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:430](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L430)

Error behavior for this handler. Default: `collect`.

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:434](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L434)

At most one invocation per registration, across dispatches/retries.
Skipped handlers are not consumed. Default: false.

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:437](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L437)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:440](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L440)

Throttle delay in milliseconds

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:443](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L443)

Replace existing handler with same ID. Default: true for backward compatibility

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:446](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L446)

Cleanup function to call when handler is unregistered

#### Returns

`void`

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

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:452](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L452)

Optional metadata copied into execution outcomes for diagnostics.

***

### when?

> `optional` **when?**: `"success"` \| `"failure"` \| `"always"`

Defined in: [packages/core/src/types.ts:455](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L455)

Terminal path selection; consumed only by `registerObserver()`.
