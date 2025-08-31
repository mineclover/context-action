[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig

Defined in: [packages/core/src/types.ts:225](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L225)

Handler configuration interface for controlling handler behavior within the pipeline

Configuration options that control how handlers are executed,
including priority, timing controls, and execution behavior.

## Examples

```typescript
register.register('searchUsers', searchHandler, {
  priority: 100,                    // Execute before lower priority handlers
  debounce: 300,                   // Wait 300ms after last call
  throttle: 1000,                  // Limit to once per second
  once: false                      // Can be executed multiple times
})
```

```typescript
register.register('processPayment', paymentHandler, {
  priority: 200,
  blocking: true,                  // Wait for completion
  id: 'payment-handler'           // Custom ID
})
```

## Properties

### priority?

> `optional` **priority**: `number`

Defined in: [packages/core/src/types.ts:227](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L227)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id**: `string`

Defined in: [packages/core/src/types.ts:230](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L230)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:233](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L233)

Whether to wait for async handlers to complete. Default: false

***

### once?

> `optional` **once**: `boolean`

Defined in: [packages/core/src/types.ts:236](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L236)

Whether this handler should run once and then be removed. Default: false

***

### debounce?

> `optional` **debounce**: `number`

Defined in: [packages/core/src/types.ts:239](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L239)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle**: `number`

Defined in: [packages/core/src/types.ts:242](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L242)

Throttle delay in milliseconds

***

### replaceExisting?

> `optional` **replaceExisting**: `boolean`

Defined in: [packages/core/src/types.ts:245](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L245)

Replace existing handler with same ID. Default: false for backward compatibility

***

### cleanup()?

> `optional` **cleanup**: () => `void`

Defined in: [packages/core/src/types.ts:248](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L248)

Cleanup function to call when handler is unregistered

#### Returns

`void`
