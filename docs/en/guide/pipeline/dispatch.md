# Dispatch Methods

Different ways to trigger action pipelines with varying levels of control and result collection.

## Core Dispatch Methods

### Basic Dispatch

Simple action execution without result collection:

```typescript
interface UserActions extends ActionPayloadMap {
  updateProfile: { userId: string; data: UserProfile };
  sendNotification: { message: string; type: 'info' | 'success' | 'error' };
}

const userRegister = new ActionRegister<UserActions>();

// Basic dispatch - fire and continue
await userRegister.dispatch('updateProfile', {
  userId: '123',
  data: { name: 'John Doe', email: 'john@example.com' }
});

// Returns void (no result collection)
```

### Dispatch with Result Collection

Comprehensive execution with detailed results:

```typescript
const result = await userRegister.dispatchWithResult('updateProfile', 
  {
    userId: '123',
    data: { name: 'John Doe', email: 'john@example.com' }
  },
  { 
    result: { collect: true },  // Enable result collection
    timeout: 5000              // Optional timeout
  }
);

console.log(result);
// {
//   success: true,
//   aborted: false,
//   terminated: false,
//   results: [
//     { step: 'validation', success: true },
//     { step: 'update', userId: '123', updated: true },
//     { step: 'notification', sent: true }
//   ],
//   execution: {
//     handlersExecuted: 3,
//     startTime: 1640995200000,
//     endTime: 1640995200500,
//     duration: 500
//   }
// }
```

## React Integration Dispatch

### useActionDispatch Hook

Basic dispatching in React components:

```typescript
import { useActionDispatch } from './UserActionContext';

function UserComponent() {
  const dispatch = useActionDispatch();
  
  const handleUpdate = async () => {
    // Simple dispatch
    await dispatch('updateProfile', {
      userId: '123',
      data: { name: 'Updated Name' }
    });
  };
  
  return <button onClick={handleUpdate}>Update Profile</button>;
}
```

### useActionDispatchWithResult Hook

Result collection in React components:

```typescript
import { useActionDispatchWithResult } from './UserActionContext';

function AdvancedUserComponent() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  
  const handleComplexUpdate = async () => {
    try {
      const result = await dispatchWithResult('updateProfile', 
        {
          userId: '123',
          data: { name: 'Complex Update' }
        },
        { result: { collect: true } }
      );
      
      if (result.success) {
        console.log('Update successful:', result.results);
      } else {
        console.error('Update failed:', result.errors);
      }
      
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };
  
  return <button onClick={handleComplexUpdate}>Complex Update</button>;
}
```

## Dispatch Options

### Timeout Configuration

Prevent indefinite hanging with timeouts:

```typescript
// Dispatch with timeout
const result = await actionRegister.dispatchWithResult('longOperation', 
  { data: 'large-dataset' },
  { 
        result: { collect: true },
    timeout: 10000  // 10 second timeout
  }
);

if (result.terminated) {
  console.log('Operation timed out');
}
```

### Result Collection Options

Control what results are collected:

```typescript
// Collect all results
const fullResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { collect: true }
});

// Errors are always available on result.errors and result.failedResults.
const successResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { collect: true }
});

// Collect results with metadata
const detailedResult = await actionRegister.dispatchWithResult('operation', payload, {
  result: { collect: true }
});
console.log(detailedResult.handlers); // Per-handler status, timing, and metadata
```

## Advanced Dispatch Patterns

### Conditional Dispatching

```typescript
function ConditionalDispatcher() {
  const dispatch = useActionDispatch();
  
  const handleUserAction = async (action: string, data: any) => {
    // Conditional dispatch based on user permissions
    const user = getCurrentUser();
    
    if (user.role === 'admin') {
      await dispatch('adminAction', { action, data, adminId: user.id });
    } else if (user.role === 'user') {
      await dispatch('userAction', { action, data, userId: user.id });
    } else {
      await dispatch('guestAction', { action, data });
    }
  };
  
  return <button onClick={() => handleUserAction('update', {})}>Action</button>;
}
```

### Batch Dispatching

```typescript
function BatchDispatcher() {
  const dispatch = useActionDispatch();
  
  const handleBatchOperation = async (items: any[]) => {
    // Sequential batch processing
    for (const item of items) {
      await dispatch('processItem', { item, batchId: generateId() });
    }
    
    // Final batch completion
    await dispatch('completeBatch', { 
      itemCount: items.length,
      completedAt: Date.now()
    });
  };
  
  // Parallel batch processing
  const handleParallelBatch = async (items: any[]) => {
    const batchId = generateId();
    
    // Dispatch all items in parallel
    const promises = items.map(item => 
      dispatch('processItem', { item, batchId })
    );
    
    await Promise.all(promises);
    
    // Completion after all parallel operations
    await dispatch('completeBatch', { 
      itemCount: items.length,
      batchId,
      mode: 'parallel'
    });
  };
  
  return (
    <div>
      <button onClick={() => handleBatchOperation(items)}>
        Sequential Batch
      </button>
      <button onClick={() => handleParallelBatch(items)}>
        Parallel Batch
      </button>
    </div>
  );
}
```

### Error Handling in Dispatch

```typescript
function ErrorHandlingDispatcher() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  
  const handleRiskyOperation = async () => {
    try {
      const result = await dispatchWithResult('riskyOperation', 
        { data: 'sensitive-data' },
        { 
          result: { collect: true },
          timeout: 5000
        }
      );
      
      if (result.aborted) {
        console.log('Operation was aborted:', result.abortReason);
        // Handle abortion gracefully
      } else if (result.terminated) {
        console.log('Operation timed out');
        // Handle timeout
      } else if (result.success) {
        console.log('Operation completed:', result.results);
        // Handle success
      } else {
        console.log('Operation failed with errors');
        // Handle general failure
      }
      
    } catch (error) {
      console.error('Dispatch failed:', error);
      // Handle dispatch-level errors
    }
  };
  
  return <button onClick={handleRiskyOperation}>Risky Operation</button>;
}
```

## Dispatch Result Structure

### Success Result

```typescript
interface DispatchResult<T = any> {
  success: true;
  aborted: false;
  terminated: false;
  results: T[];           // All handler return values
  errors: never[];        // Empty for successful operations
  execution: {
    handlersExecuted: number;
    startTime: number;
    endTime: number;
    duration: number;
    mode: 'sequential' | 'parallel' | 'race';
  };
  metadata?: {
    handlerIds: string[];
    priorities: number[];
    payload: any;           // Final payload state
  };
}
```

### Aborted Result

```typescript
interface AbortedResult {
  success: false;
  aborted: true;
  terminated: false;
  abortReason: string;     // Reason provided to controller.abort()
  abortedBy: string;       // Handler ID that caused abort
  results: any[];          // Results from handlers that executed before abort
  errors: Error[];
  execution: {
    handlersExecuted: number;
    startTime: number;
    endTime: number;
    duration: number;
  };
}
```

### Timeout Result

```typescript
interface TimeoutResult {
  success: false;
  aborted: false;
  terminated: true;
  timeoutMs: number;       // Configured timeout value
  results: any[];          // Partial results before timeout
  errors: Error[];
  execution: {
    handlersExecuted: number;
    startTime: number;
    endTime: number;
    duration: number;
  };
}
```

## Performance Optimization

### Efficient Dispatching

```typescript
// ✅ Good - reuse action register instance
const register = new ActionRegister<MyActions>();

function OptimizedComponent() {
  const handleMultipleActions = async () => {
    // Reuse the same register for multiple dispatches
    await register.dispatch('action1', { data: 'a' });
    await register.dispatch('action2', { data: 'b' });
    await register.dispatch('action3', { data: 'c' });
  };
}

// ❌ Avoid - creating new registers repeatedly
function InfficientComponent() {
  const handleAction = async () => {
    const newRegister = new ActionRegister<MyActions>(); // Expensive!
    await newRegister.dispatch('action', { data: 'test' });
  };
}
```

### Batch Result Collection

```typescript
function BatchResultCollector() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  
  const handleBatchWithResults = async (operations: Operation[]) => {
    const results = await Promise.all(
      operations.map(op => 
        dispatchWithResult('processOperation', 
          { operation: op },
          { result: { collect: true } }
        )
      )
    );
    
    // Analyze batch results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Batch complete: ${successful.length} success, ${failed.length} failed`);
    
    return {
      successful: successful.length,
      failed: failed.length,
      results: results
    };
  };
  
  return <button onClick={() => handleBatchWithResults(operations)}>
    Process Batch
  </button>;
}
```

## Dispatch Patterns by Use Case

### 1. Fire-and-Forget (Analytics)

```typescript
// No result needed, just trigger
await dispatch('trackEvent', { event: 'button_click', data: eventData });
```

### 2. Validation Pipeline (Result Collection)

```typescript
// Need to know if validation passed
const result = await dispatchWithResult('validateData', 
  { data: formData },
  { result: { collect: true } }
);

if (result.success) {
  proceedWithValidData();
} else {
  showValidationErrors(result.errors);
}
```

### 3. Multi-Step Operation (Progress Tracking)

```typescript
// Track progress through complex operation
const result = await dispatchWithResult('complexOperation', 
  { operation: 'data-migration' },
  { 
    result: { collect: true }
  }
);

// Show progress to user
result.results.forEach(step => {
  console.log(`Step ${step.step}: ${step.success ? '✅' : '❌'}`);
});
```

## Live Example: Result Collection with Dispatch

See comprehensive dispatch patterns in the [UseActionWithResult Demo](https://mineclover.github.io/context-action/example/react/useActionWithResult):

```typescript
// Sequential workflow execution with result collection
const executeWorkflow = async () => {
  const result = await dispatchWithResult('processWorkflow', 
    { data: workflowData },
    { result: { collect: true } }
  );
  
  // Handle different dispatch outcomes
  if (result.success) {
    setWorkflowResults(result.results);
  } else if (result.aborted) {
    setError(`Workflow aborted: ${result.abortReason}`);
  }
};
```

This example demonstrates real-world usage of `dispatchWithResult` with comprehensive error handling and UI integration.

## Related

- **[Priority System](./priority.md)** - Control execution order with priorities
- **[Blocking Operations](./blocking.md)** - Control execution flow
- **[Abort Mechanisms](./abort.md)** - Stop pipeline execution when needed
- **[Result Handling](./result-handling.md)** - Process and use dispatch results
