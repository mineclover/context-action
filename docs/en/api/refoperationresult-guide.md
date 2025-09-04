# RefOperationResult Interface

## 1. Purpose

The `RefOperationResult` interface represents the outcome of an operation performed on a ref target using the `withTarget` function (from the `useRefHandler` hook). It provides information about whether the operation was successful, the result of the operation, any errors that occurred, and performance metrics.

## 2. Structure

The `RefOperationResult` interface has the following properties:

```typescript
export interface RefOperationResult<T = any> {
  // True if the operation was successful, false otherwise.
  success: boolean;

  // The result of the operation, if it was successful.
  result?: T;

  // The error that occurred, if the operation failed.
  error?: Error;

  // The duration of the operation in milliseconds.
  duration?: number;

  // The timestamp of when the operation was completed.
  timestamp: number;
}
```

## 3. Usage Patterns

You receive a `RefOperationResult` object when you call the `withTarget` function.

### Checking the Result of a Ref Operation

```typescript
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { withTarget } = useRefHandler('myDiv');

  const handleClick = async () => {
    const operationResult = await withTarget((div) => {
      // Perform some operation on the div
      return div.getBoundingClientRect();
    });

    if (operationResult.success) {
      console.log('Bounding rect:', operationResult.result);
      console.log(`Operation took ${operationResult.duration}ms`);
    } else {
      console.error('Operation failed:', operationResult.error);
    }
  };

  return <button onClick={handleClick}>Get Bounding Rect</button>;
};
```

## 4. TypeDoc Link

[RefOperationResult in types.ts](../../../packages/react/src/refs/types.ts)
