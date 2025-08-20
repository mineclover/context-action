[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / executeRace

# Function: executeRace()

> **executeRace**\<`T`, `R`\>(`context`, `createController`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/execution-modes.ts:345](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/execution-modes.ts#L345)

Execute handlers in race mode (first to complete wins)

Executes all qualifying handlers simultaneously using Promise.race, where
the first handler to complete determines the pipeline result. Other handlers
are effectively cancelled. Useful for scenarios where you want the fastest
response from multiple equivalent handlers.

## Type Parameters

### Generic type T

Type parameter **T**

The payload type for the action

### Generic type R

`R` = `void`

The result type for handlers

## Parameters

### context

`PipelineContext`\<`T`, `R`\>

Pipeline execution context containing handlers and state

### createController

(`registration`, `index`) => [`PipelineController`](../interfaces/PipelineController.md)\<`T`, `R`\>

Factory function for creating pipeline controllers

## Returns

`Promise`&lt;`void`&gt;

## Throws

When the winning handler fails and is blocking

## Examples

```typescript
// This is called internally by ActionRegister.dispatch()
// when executionMode is 'race'

// Multiple data sources racing for fastest response:
// - Database handler (might be slow)
// - Cache handler (usually fast)
// - API handler (variable speed)
// 
// Whichever completes first wins

await executeRace(context, (registration, index) => ({
  return: (result) => { 
    context.terminated = true
    context.terminationResult = result 
  },
  // ... other controller methods
}))
```

```typescript
// Race between multiple data sources
register.setActionExecutionMode('fetchUserData', 'race')

// These handlers race for fastest response:
register.register('fetchUserData', cacheHandler)     // Usually fastest
register.register('fetchUserData', databaseHandler)  // Reliable fallback
register.register('fetchUserData', apiHandler)       // External source

// First to complete wins, others are ignored
const result = await register.dispatchWithResult('fetchUserData', { id: '123' })
```
