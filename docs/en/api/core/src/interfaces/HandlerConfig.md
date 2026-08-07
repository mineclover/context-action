[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:456](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L456)

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

Defined in: [packages/core/src/types.ts:458](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L458)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:461](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L461)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:464](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L464)

Whether to wait for async handlers to complete. Default: false

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:467](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L467)

Whether this handler should run once and then be removed. Default: false

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:470](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L470)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:473](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L473)

Throttle delay in milliseconds

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:476](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L476)

Replace existing handler with same ID. Default: true for backward compatibility

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:479](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L479)

Cleanup function to call when handler is unregistered

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:482](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L482)

Condition function to determine if handler should execute. Default: always execute

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:485](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L485)

Optional metadata copied into execution outcomes for diagnostics.
