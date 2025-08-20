[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / PipelineController

# Interface: PipelineController\<T, R\>

Defined in: [packages/core/src/types.ts:128](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L128)

Pipeline controller interface for managing execution flow and payload modification

Provides action handlers with powerful control over the action pipeline execution,
including the ability to abort execution, modify payloads, jump to specific priorities,
and manage results. This is the primary interface for implementing business logic
within action handlers.

## Examples

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

`T` = `any`

The payload type for this action

### Generic type R

`R` = `void`

The result type for this action

## Methods

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/types.ts:130](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L130)

Abort the pipeline execution with an optional reason

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### modifyPayload()

> **modifyPayload**(`modifier`): `void`

Defined in: [packages/core/src/types.ts:133](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L133)

Modify the payload that will be passed to subsequent handlers

#### Parameters

##### modifier

(`payload`) => `T`

#### Returns

`void`

***

### getPayload()

> **getPayload**(): `T`

Defined in: [packages/core/src/types.ts:136](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L136)

Get the current payload

#### Returns

Type parameter **T**

***

### jumpToPriority()

> **jumpToPriority**(`priority`): `void`

Defined in: [packages/core/src/types.ts:139](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L139)

Jump to a specific priority level in the pipeline

#### Parameters

##### priority

`number`

#### Returns

`void`

***

### return()

> **return**(`result`): `void`

Defined in: [packages/core/src/types.ts:143](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L143)

Return a result and terminate the pipeline

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### setResult()

> **setResult**(`result`): `void`

Defined in: [packages/core/src/types.ts:146](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L146)

Set a result but continue pipeline execution

#### Parameters

##### result

Type parameter **R**

#### Returns

`void`

***

### getResults()

> **getResults**(): `R`[]

Defined in: [packages/core/src/types.ts:149](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L149)

Get all results from previously executed handlers

#### Returns

`R`[]

***

### mergeResult()

> **mergeResult**(`merger`): `void`

Defined in: [packages/core/src/types.ts:152](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L152)

Merge current result with previous results using a custom merger function

#### Parameters

##### merger

(`previousResults`, `currentResult`) => `R`

#### Returns

`void`
