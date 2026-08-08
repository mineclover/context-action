[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig\<T\>

Defined in: [packages/core/src/types.ts:498](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L498)

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

Defined in: [packages/core/src/types.ts:500](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L500)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id?**: `string`

Defined in: [packages/core/src/types.ts:503](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L503)

Unique identifier for the handler. Auto-generated if not provided

***

### ~~blocking?~~

> `optional` **blocking?**: `boolean`

Defined in: [packages/core/src/types.ts:509](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L509)

#### Deprecated

Use `scheduling` and `errorPolicy`. `true` maps to
`await-before-next` + `fatal`; `false` maps to `start-and-continue` + `collect`.

***

### scheduling?

> `optional` **scheduling?**: [`HandlerScheduling`](../type-aliases/HandlerScheduling.md)

Defined in: [packages/core/src/types.ts:512](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L512)

Async scheduling in sequential mode. Default: `await-before-next`.

***

### errorPolicy?

> `optional` **errorPolicy?**: [`HandlerErrorPolicy`](../type-aliases/HandlerErrorPolicy.md)

Defined in: [packages/core/src/types.ts:515](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L515)

Error behavior for this handler. Default: `collect`.

***

### once?

> `optional` **once?**: `boolean`

Defined in: [packages/core/src/types.ts:518](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L518)

Whether this handler should run once and then be removed. Default: false

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/core/src/types.ts:521](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L521)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/core/src/types.ts:524](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L524)

Throttle delay in milliseconds

***

### replaceExisting?

> `optional` **replaceExisting?**: `boolean`

Defined in: [packages/core/src/types.ts:527](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L527)

Replace existing handler with same ID. Default: true for backward compatibility

***

### cleanup?

> `optional` **cleanup?**: () => `void`

Defined in: [packages/core/src/types.ts:530](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L530)

Cleanup function to call when handler is unregistered

#### Returns

`void`

***

### condition?

> `optional` **condition?**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:533](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L533)

Condition function to determine if handler should execute. Default: always execute

#### Parameters

##### payload

Type parameter **T**

#### Returns

`boolean`

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [packages/core/src/types.ts:536](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L536)

Optional metadata copied into execution outcomes for diagnostics.
