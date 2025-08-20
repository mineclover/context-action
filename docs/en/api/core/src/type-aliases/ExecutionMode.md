[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionMode

# Type Alias: ExecutionMode

> **ExecutionMode** = `"sequential"` \| `"parallel"` \| `"race"`

Defined in: [packages/core/src/types.ts:399](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L399)

Execution mode for action handler pipeline

Determines how multiple handlers for the same action are executed:
- `sequential`: Handlers execute one after another in priority order
- `parallel`: All handlers execute simultaneously
- `race`: First handler to complete wins, others are cancelled

## Example

```typescript
// Sequential execution (default)
register.setActionExecutionMode('updateUser', 'sequential')

// Parallel execution for independent operations
register.setActionExecutionMode('logEvent', 'parallel')

// Race execution for fastest response
register.setActionExecutionMode('fetchData', 'race')
```
