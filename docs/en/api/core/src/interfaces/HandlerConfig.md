[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig

Defined in: [packages/core/src/types.ts:275](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L275)

Handler configuration interface for controlling handler behavior within the pipeline

Comprehensive configuration options that control how handlers are executed,
including priority, timing controls, validation, metadata, and advanced features
like retries and dependencies.

## Examples

```typescript
register.register('searchUsers', searchHandler, {
  priority: 100,                    // Execute before lower priority handlers
  debounce: 300,                   // Wait 300ms after last call
  throttle: 1000,                  // Limit to once per second
  tags: ['search', 'user'],        // Categorization tags
  category: 'query',               // Logical grouping
  description: 'Search users by query',
  once: false                      // Can be executed multiple times
})
```

```typescript
register.register('processPayment', paymentHandler, {
  priority: 200,
  timeout: 5000,                   // 5 second timeout
  retries: 3,                      // Retry up to 3 times on failure
  environment: 'production',       // Only in production
  dependencies: ['validateCard'],  // Requires validateCard handler
  conflicts: ['refundPayment'],    // Cannot coexist with refund handler
  validation: (payload) => payload.amount > 0 && payload.currency,
  metrics: {
    collectTiming: true,
    collectErrors: true,
    customMetrics: { paymentProvider: 'stripe' }
  }
})
```

```typescript
register.register('debugLog', debugHandler, {
  priority: 10,
  condition: () => process.env.NODE_ENV === 'development',
  tags: ['debug', 'logging'],
  category: 'development'
})
```

## Properties

### priority?

> `optional` **priority**: `number`

Defined in: [packages/core/src/types.ts:277](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L277)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id**: `string`

Defined in: [packages/core/src/types.ts:280](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L280)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:283](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L283)

Whether to wait for async handlers to complete. Default: false

***

### once?

> `optional` **once**: `boolean`

Defined in: [packages/core/src/types.ts:286](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L286)

Whether this handler should run once and then be removed. Default: false

***

### condition()?

> `optional` **condition**: (`payload?`) => `boolean`

Defined in: [packages/core/src/types.ts:289](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L289)

Condition function to determine if handler should run

#### Parameters

##### payload?

`any`

#### Returns

`boolean`

***

### debounce?

> `optional` **debounce**: `number`

Defined in: [packages/core/src/types.ts:292](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L292)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle**: `number`

Defined in: [packages/core/src/types.ts:295](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L295)

Throttle delay in milliseconds

***

### validation()?

> `optional` **validation**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:298](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L298)

Validation function that must return true for handler to execute

#### Parameters

##### payload

`any`

#### Returns

`boolean`

***

### middleware?

> `optional` **middleware**: `boolean`

Defined in: [packages/core/src/types.ts:301](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L301)

Mark this handler as middleware

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/types.ts:305](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L305)

Tags for categorizing and filtering handlers

***

### category?

> `optional` **category**: `string`

Defined in: [packages/core/src/types.ts:308](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L308)

Category for grouping related handlers

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:311](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L311)

Human-readable description of what this handler does

***

### version?

> `optional` **version**: `string`

Defined in: [packages/core/src/types.ts:314](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L314)

Version identifier for this handler

***

### returnType?

> `optional` **returnType**: `"merge"` \| `"value"` \| `"collect"`

Defined in: [packages/core/src/types.ts:317](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L317)

How to handle the result from this handler

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/core/src/types.ts:320](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L320)

Timeout for this specific handler in milliseconds

***

### retries?

> `optional` **retries**: `number`

Defined in: [packages/core/src/types.ts:323](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L323)

Number of retries if handler fails

***

### dependencies?

> `optional` **dependencies**: `string`[]

Defined in: [packages/core/src/types.ts:326](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L326)

Other handler IDs that this handler depends on

***

### conflicts?

> `optional` **conflicts**: `string`[]

Defined in: [packages/core/src/types.ts:329](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L329)

Handler IDs that conflict with this handler

***

### environment?

> `optional` **environment**: `"development"` \| `"production"` \| `"test"`

Defined in: [packages/core/src/types.ts:332](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L332)

Environment where this handler should run

***

### feature?

> `optional` **feature**: `string`

Defined in: [packages/core/src/types.ts:335](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L335)

Feature flag to control handler availability

***

### metrics?

> `optional` **metrics**: `object`

Defined in: [packages/core/src/types.ts:338](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L338)

Metrics collection configuration

#### collectTiming?

> `optional` **collectTiming**: `boolean`

Whether to collect timing information

#### collectErrors?

> `optional` **collectErrors**: `boolean`

Whether to collect error information

#### customMetrics?

> `optional` **customMetrics**: `Record`\<`string`, `any`\>

Custom metrics to collect

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/types.ts:350](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L350)

Custom metadata for this handler
