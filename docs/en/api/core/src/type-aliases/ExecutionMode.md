[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ExecutionMode

# Type Alias: ExecutionMode

> **ExecutionMode** = `"sequential"` \| `"parallel"` \| `"race"`

Defined in: [packages/core/src/types.ts:297](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/types.ts#L297)

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
