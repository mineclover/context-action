# ReactActionError Class

## 1. Purpose

The `ReactActionError` class is a custom error type that is used to represent errors that occur within the action pipeline. It extends the built-in `Error` class and adds additional context about the action that failed, such as the action name, payload, and handler ID.

## 2. Structure

The `ReactActionError` class has the following properties:

```typescript
export class ReactActionError extends Error {
  public readonly action: string;
  public readonly payload?: any;
  public readonly handlerId: string | undefined;
  public readonly timestamp: number;
  // ...
}
```

## 3. Usage Patterns

You typically don't create `ReactActionError` instances yourself. They are created internally by the library when an error occurs in an action handler. You can then use the `isReactActionError` type guard to check for this specific error type in your error handling logic, such as in an error boundary.

### Type Guarding in an Error Boundary

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { isReactActionError, ReactActionError } from '@context-action/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class MyErrorBoundary extends Component<Props, State> {
  // ...

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isReactActionError(error)) {
      console.log('Action failed:', error.action);
      console.log('Payload:', error.payload);
    }
    // ...
  }

  // ...
}
```

## 4. TypeDoc Link

[ReactActionError in react-helpers.ts](../../../packages/core/src/react-helpers.ts)
