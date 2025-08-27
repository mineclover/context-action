[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig

Defined in: [packages/core/src/types.ts:248](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L248)

Handler configuration interface for controlling handler behavior within the pipeline

Comprehensive configuration options that control how handlers are executed,
including priority, timing controls, validation, metadata, and advanced features
like retries and dependencies.

## Examples

```typescript
register.register('searchUsers', searchHandler, {
  priority: 100,                    // Execute before lower priority handlers
  id: 'search-handler',            // Unique identifier
  debounce: 300,                   // Wait 300ms after last call
  throttle: 1000,                  // Limit to once per second
  replaceExisting: true,           // Replace handler with same ID (great for React HMR)
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

Defined in: [packages/core/src/types.ts:250](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L250)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id**: `string`

Defined in: [packages/core/src/types.ts:253](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L253)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:256](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L256)

Whether to wait for async handlers to complete. Default: false

***

### once?

> `optional` **once**: `boolean`

Defined in: [packages/core/src/types.ts:259](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L259)

Whether this handler should run once and then be removed. Default: false

***

### replaceExisting?

> `optional` **replaceExisting**: `boolean`

Defined in: [packages/core/src/types.ts:262](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L262)

Whether to replace an existing handler with the same ID. Great for React HMR support. Default: false

***

### condition()?

> `optional` **condition**: (`payload?`) => `boolean`

Defined in: [packages/core/src/types.ts:262](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L262)

Condition function to determine if handler should run

#### Parameters

##### payload?

`any`

#### Returns

`boolean`

***

### debounce?

> `optional` **debounce**: `number`

Defined in: [packages/core/src/types.ts:265](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L265)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle**: `number`

Defined in: [packages/core/src/types.ts:268](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L268)

Throttle delay in milliseconds

***

### validation()?

> `optional` **validation**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:271](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L271)

Validation function that must return true for handler to execute

#### Parameters

##### payload

`any`

#### Returns

`boolean`

***

### middleware?

> `optional` **middleware**: `boolean`

Defined in: [packages/core/src/types.ts:274](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L274)

Mark this handler as middleware

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/types.ts:278](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L278)

Tags for categorizing and filtering handlers

***

### category?

> `optional` **category**: `string`

Defined in: [packages/core/src/types.ts:281](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L281)

Category for grouping related handlers

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:284](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L284)

Human-readable description of what this handler does

***

### version?

> `optional` **version**: `string`

Defined in: [packages/core/src/types.ts:287](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L287)

Version identifier for this handler

***

### returnType?

> `optional` **returnType**: `"merge"` \| `"value"` \| `"collect"`

Defined in: [packages/core/src/types.ts:290](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L290)

How to handle the result from this handler

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/core/src/types.ts:293](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L293)

Timeout for this specific handler in milliseconds

***

### retries?

> `optional` **retries**: `number`

Defined in: [packages/core/src/types.ts:296](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L296)

Number of retries if handler fails

***

### dependencies?

> `optional` **dependencies**: `string`[]

Defined in: [packages/core/src/types.ts:299](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L299)

Other handler IDs that this handler depends on

***

### conflicts?

> `optional` **conflicts**: `string`[]

Defined in: [packages/core/src/types.ts:302](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L302)

Handler IDs that conflict with this handler

***

### environment?

> `optional` **environment**: `"development"` \| `"production"` \| `"test"`

Defined in: [packages/core/src/types.ts:305](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L305)

Environment where this handler should run

***

### feature?

> `optional` **feature**: `string`

Defined in: [packages/core/src/types.ts:308](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L308)

Feature flag to control handler availability

***

### metrics?

> `optional` **metrics**: `object`

Defined in: [packages/core/src/types.ts:311](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L311)

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

Defined in: [packages/core/src/types.ts:323](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L323)

Custom metadata for this handler
