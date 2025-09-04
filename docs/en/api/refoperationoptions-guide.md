# RefOperationOptions Interface

## 1. Purpose

The `RefOperationOptions` interface provides a set of options to control the behavior of an operation performed on a ref target using the `withTarget` function. These options allow for fine-grained control over timeouts, retries, cancellation, and more.

## 2. Structure

The `RefOperationOptions` interface has the following properties:

```typescript
export interface RefOperationOptions {
  // The timeout for the operation in milliseconds.
  timeout?: number;

  // The number of times to retry the operation if it fails.
  retries?: number;

  // An AbortSignal to cancel the operation.
  signal?: AbortSignal;

  // The priority of the operation.
  priority?: number;

  // A unique identifier for the operation.
  operationId?: string;

  // Additional metadata for the operation.
  metadata?: Record<string, any>;
}
```

## 3. Usage Patterns

You pass a `RefOperationOptions` object to the `withTarget` function.

### Setting a Timeout

This is useful for preventing an operation from running for too long.

```typescript
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { withTarget } = useRefHandler('myDiv');

  const handleClick = async () => {
    const operationResult = await withTarget(
      (div) => {
        // A long-running operation
      },
      { timeout: 1000 } // 1 second
    );

    if (!operationResult.success) {
      console.error('Operation timed out:', operationResult.error);
    }
  };

  return <button onClick={handleClick}>Run Operation with Timeout</button>;
};
```

### Cancelling an Operation

You can use an `AbortController` to cancel an operation that is in progress.

```typescript
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { withTarget } = useRefHandler('myDiv');
  const abortController = new AbortController();

  const handleStart = () => {
    withTarget(
      (div) => {
        // A long-running operation
      },
      { signal: abortController.signal }
    );
  };

  const handleCancel = () => {
    abortController.abort();
  };

  return (
    <div>
      <button onClick={handleStart}>Start Operation</button>
      <button onClick={handleCancel}>Cancel Operation</button>
    </div>
  );
};
```

## 4. TypeDoc Link

[RefOperationOptions in types.ts](../../../packages/react/src/refs/types.ts)
