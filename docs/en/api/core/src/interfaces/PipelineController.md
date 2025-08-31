[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / PipelineController

# Interface: PipelineController\<T, R\>

Defined in: [packages/core/src/types.ts:101](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L101)

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

### T

`T` = `any`

The payload type for this action

### R

`R` = `void`

The result type for this action

## Methods

### abort()

> **abort**(`reason?`): `void`

Defined in: [packages/core/src/types.ts:103](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L103)

Abort the pipeline execution with an optional reason

#### Parameters

##### reason?

`string`

#### Returns

`void`

***

### modifyPayload()

> **modifyPayload**(`modifier`): `void`

Defined in: [packages/core/src/types.ts:106](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L106)

Modify the payload that will be passed to subsequent handlers

#### Parameters

##### modifier

(`payload`) => `T`

#### Returns

`void`

***

### getPayload()

> **getPayload**(): `T`

Defined in: [packages/core/src/types.ts:109](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L109)

Get the current payload

#### Returns

`T`

***

### jumpToPriority()

> **jumpToPriority**(`priority`): `void`

Defined in: [packages/core/src/types.ts:112](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L112)

Jump to a specific priority level in the pipeline

#### Parameters

##### priority

`number`

#### Returns

`void`

***

### return()

> **return**(`result`): `void`

Defined in: [packages/core/src/types.ts:116](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L116)

Return a result and terminate the pipeline

#### Parameters

##### result

`R`

#### Returns

`void`

***

### setResult()

> **setResult**(`result`): `void`

Defined in: [packages/core/src/types.ts:119](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L119)

Set a result but continue pipeline execution

#### Parameters

##### result

`R`

#### Returns

`void`

***

### getResults()

> **getResults**(): `R`[]

Defined in: [packages/core/src/types.ts:122](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L122)

Get all results from previously executed handlers

#### Returns

`R`[]

***

### mergeResult()

> **mergeResult**(`merger`): `void`

Defined in: [packages/core/src/types.ts:125](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L125)

Merge current result with previous results using a custom merger function

#### Parameters

##### merger

(`previousResults`, `currentResult`) => `R`

#### Returns

`void`
