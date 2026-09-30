[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionHandlerStats

# Interface: ActionHandlerStats\<T\>

Defined in: [packages/core/src/types.ts:1428](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1428)

Handler statistics interface for registry monitoring and debugging

Provides detailed statistics about handlers for a specific action,
including handler organization and basic execution data.

## Example

```typescript
const stats = register.getActionStats('updateUser')

if (stats) {
  console.log(`Action: ${stats.action}`)
  console.log(`Handler count: ${stats.handlerCount}`)

  stats.handlersByPriority.forEach(group => {
    console.log(`Priority ${group.priority}:`, group.handlers.length, 'handlers')
  })

  if (stats.executionStats) {
    console.log(`Success rate: ${stats.executionStats.successRate}%`)
    console.log(`Average duration: ${stats.executionStats.averageDuration}ms`)
  }
}
```

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](../type-aliases/ActionPayloadMap.md)

The action payload map interface

## Properties

### action

> **action**: keyof `T`

Defined in: [packages/core/src/types.ts:1430](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1430)

Action name

***

### handlerCount

> **handlerCount**: `number`

Defined in: [packages/core/src/types.ts:1433](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1433)

Number of handlers for this action

***

### totalHandlers

> **totalHandlers**: `number`

Defined in: [packages/core/src/types.ts:1436](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1436)

Total number of handlers for this action (alias for handlerCount)

***

### lastRegistered?

> `optional` **lastRegistered?**: `Date`

Defined in: [packages/core/src/types.ts:1439](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1439)

When the last handler was registered

***

### handlersByPriority

> **handlersByPriority**: `object`[]

Defined in: [packages/core/src/types.ts:1442](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1442)

Handler configurations grouped by priority

#### priority

> **priority**: `number`

#### handlers

> **handlers**: `object`[]

***

### executionStats?

> `optional` **executionStats?**: `undefined`

Defined in: [packages/core/src/types.ts:1450](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1450)

Execution statistics - removed in favor of simplified architecture
