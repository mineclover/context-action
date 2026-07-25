[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionMode

# Type Alias: ExecutionMode

> **ExecutionMode** = `"sequential"` \| `"parallel"` \| `"race"`

Defined in: [packages/core/src/types.ts:513](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L513)

Execution mode for action handler pipeline

Determines how multiple handlers for the same action are executed:
- `sequential`: Handlers execute one after another in priority order
- `parallel`: All handlers execute simultaneously
- `race`: First handler to complete wins; other started handlers keep running
  and remain tracked until they settle

## Example

```typescript
// Sequential execution (default)
register.setActionExecutionMode('updateUser', 'sequential')

// Parallel execution for independent operations
register.setActionExecutionMode('logEvent', 'parallel')

// Race execution for fastest response
register.setActionExecutionMode('fetchData', 'race')
```
