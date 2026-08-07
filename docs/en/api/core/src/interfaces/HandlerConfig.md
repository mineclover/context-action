[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:466](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L466)

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

Defined in: [packages/core/src/types.ts:468](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L468)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:471](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L471)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:474](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L474)

Whether to wait for async handlers to complete. Default: false

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:477](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L477)

Whether this handler should run once and then be removed. Default: false

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:480](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L480)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:483](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L483)

Throttle delay in milliseconds

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:486](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L486)

Replace existing handler with same ID. Default: true for backward compatibility

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:489](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L489)

Cleanup function to call when handler is unregistered

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:492](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L492)

Condition function to determine if handler should execute. Default: always execute

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:495](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L495)

Optional metadata copied into execution outcomes for diagnostics.
