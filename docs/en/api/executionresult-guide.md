# ExecutionResult Interface

## 1. Purpose

The `ExecutionResult` interface represents the result of an action dispatch. It contains comprehensive information about the execution, including whether it was successful, any results returned by handlers, and detailed metadata about the execution process.

## 2. Structure

The `ExecutionResult` interface has the following properties:

```typescript
export interface ExecutionResult<R = void> {
  success: boolean;
  aborted: boolean;
  abortReason: string | undefined;
  terminated: boolean;
  result: R | undefined;
  successResults: R[];
  results: Array<R | undefined>;
  failedResults: Array<{
    handlerId: string;
    error: Error;
    expectedType: string;
  }>;
  execution: {
    duration: number;
    handlersExecuted: number;
    handlersSkipped: number;
    handlersFailed: number;
    startTime: number;
    endTime: number;
  };
  handlers: Array<{
    id: string;
    executed: boolean;
    duration: number | undefined;
    result: R | undefined;
    error: Error | undefined;
    metadata: Record<string, any> | undefined;
  }>;
  errors: HandlerError[];
}
```

## 3. Usage Patterns

You receive an `ExecutionResult` object when you use the `dispatchWithResult` method of an `ActionRegister`.

### Checking the Result of a Dispatch

```typescript
const result = await actionRegister.dispatchWithResult('my-action', { id: 1 });

if (result.success) {
  console.log('Action succeeded!');
  console.log('Result:', result.result);
} else {
  console.error('Action failed:', result.abortReason);
}
```

### Analyzing Handler Performance

The `execution` and `handlers` properties provide detailed information for performance analysis.

```typescript
const result = await actionRegister.dispatchWithResult('my-action');

console.log(`Execution took ${result.execution.duration}ms`);

for (const handler of result.handlers) {
  if (handler.duration && handler.duration > 10) {
    console.warn(`Handler ${handler.id} is slow: ${handler.duration}ms`);
  }
}
```

## 4. TypeDoc Link

[ExecutionResult in types.ts](../../../packages/core/src/types.ts)
