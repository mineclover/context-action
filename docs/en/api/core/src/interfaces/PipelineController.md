[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / PipelineController

# Interface: PipelineController\<T, R\>

Defined in: [packages/core/src/types.ts:276](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L276)

Pipeline controller interface for managing execution flow and payload modification

Provides action handlers with powerful control over the action pipeline execution,
including the ability to abort execution, modify payloads, jump to specific priorities,
and manage results. This is the primary interface for implementing business logic
within action handlers.

## Examples

**Basic Pipeline Control**

```typescript
register.register('validateAndProcess', async (payload, controller) => {
  // Input validation
  if (!payload.email.includes('@')) {
    controller.abort('Invalid email format')
    return
  }
  
  // Process and modify payload for next handlers
  controller.modifyPayload(data => ({
    ...data,
    processed: true,
    timestamp: Date.now(),
    normalized: data.email.toLowerCase()
  }))
  
  // Set intermediate result
  controller.setResult({ validated: true, userId: payload.id })
})
```

**Early Return with Result**

```typescript
register.register('checkCache', async (payload, controller) => {
  const cached = await cache.get(payload.key)
  
  if (cached) {
    // Return early and skip remaining handlers
    controller.return({ source: 'cache', data: cached })
    return
  }
  
  // Continue to next handlers if not cached
})
```

**Priority Jumping**

```typescript
register.register('securityCheck', async (payload, controller) => {
  if (payload.requiresElevatedPermissions) {
    // Jump to high-priority security handlers
    controller.jumpToPriority(1000)
  }
}, { priority: 50 })
```

## Type Parameters

### Generic type T

`T` = `unknown`

The payload type for this action

### Generic type R

`R` = `void`

The result type for this action

## Methods

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/types.ts:287](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L287)

Abort the pipeline execution with an optional reason

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### modifyPayload()

> **modifyPayload**(`modifier`): `void`

Defined in: [packages/core/src/types.ts:290](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L290)

Modify the payload that will be passed to subsequent handlers

#### Parameters

##### modifier

(`payload`) => `T`

#### Returns

`void`

***

### getPayload()

> **getPayload**(): `T`

Defined in: [packages/core/src/types.ts:293](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L293)

Get the current payload

#### Returns

Type parameter **T**

***

### jumpToPriority()

> **jumpToPriority**(`priority`): `void`

Defined in: [packages/core/src/types.ts:324](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L324)

Jump to a specific priority level in the pipeline

⚠️ **WARNING**: Backward jumps (to higher priority handlers) can cause infinite loops!
Always use with a `condition` in the target handler to prevent re-execution.

The system will automatically abort after 10 jumps (configurable) to prevent infinite loops.

#### Parameters

##### priority

`number`

The priority level to jump to (finds first handler with priority <= this value)

#### Returns

`void`

#### Example

**Safe retry pattern with condition**

```typescript
let retryCount = 0;

register.register('process', (payload, controller) => {
  retryCount++;
  if (shouldRetry() && retryCount < 3) {
    controller.jumpToPriority(100); // Jump back to validation
  }
}, { priority: 50 });

register.register('validate', (payload) => {
  // Validation logic
}, {
  priority: 100,
  condition: () => retryCount === 0 // Only run on first attempt
});
```

***

### return()

> **return**(`result`): `void`

Defined in: [packages/core/src/types.ts:328](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L328)

Return a result and terminate the pipeline

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### setResult()

> **setResult**(`result`): `void`

Defined in: [packages/core/src/types.ts:331](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L331)

Set a result but continue pipeline execution

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### getResults()

> **getResults**(): `R`[]

Defined in: [packages/core/src/types.ts:334](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L334)

Get all results from previously executed handlers

#### Returns

`R`[]

***

### mergeResult()

> **mergeResult**(`merger`): `void`

Defined in: [packages/core/src/types.ts:337](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L337)

Merge current result with previous results using a custom merger function

#### Parameters

##### merger

(`previousResults`, `currentResult`) => `R`

#### Returns

`void`

## Properties

### signal?

> `readonly` `optional` **signal?**: `AbortSignal`

Defined in: [packages/core/src/types.ts:284](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L284)

Signal for the current dispatch lifecycle.

Handlers should observe this signal when they can stop cooperatively. It is
aborted by caller cancellation, timeout, provider teardown, or registry
shutdown.
