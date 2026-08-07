[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:437](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L437)

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

Defined in: [packages/core/src/types.ts:439](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L439)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:442](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L442)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:445](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L445)

Whether to wait for async handlers to complete. Default: false

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:448](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L448)

Whether this handler should run once and then be removed. Default: false

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:451](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L451)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:454](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L454)

Throttle delay in milliseconds

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:457](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L457)

Replace existing handler with same ID. Default: true for backward compatibility

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:460](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L460)

Cleanup function to call when handler is unregistered

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:463](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L463)

Condition function to determine if handler should execute. Default: always execute

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`
