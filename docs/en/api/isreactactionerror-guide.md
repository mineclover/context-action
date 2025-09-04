# isReactActionError Function

## 1. Purpose

The `isReactActionError` function is a type guard that checks if a given error object is an instance of `ReactActionError`. This is particularly useful for safely handling errors that originate from the action pipeline within React components, allowing you to access the specific properties of `ReactActionError` (like `action`, `payload`, etc.) in a type-safe manner.

## 2. Signature

```typescript
export function isReactActionError(error: any): error is ReactActionError;
```

-   `error`: The error object to check.

## 3. Usage Patterns

You typically use `isReactActionError` in `catch` blocks or within React error boundaries to narrow down the type of an error.

### Type Guarding in a `try-catch` Block

```typescript
import { isReactActionError } from '@context-action/core';

try {
  // Some code that might dispatch an action and throw a ReactActionError
} catch (error) {
  if (isReactActionError(error)) {
    console.error(`Action "${error.action}" failed with payload:`, error.payload);
  } else {
    console.error('An unexpected error occurred:', error);
  }
}
```

### Using in a React Error Boundary

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { isReactActionError } from '@context-action/core';

interface MyErrorBoundaryProps {
  children: ReactNode;
}

interface MyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MyErrorBoundary extends Component<MyErrorBoundaryProps, MyErrorBoundaryState> {
  state: MyErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): MyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isReactActionError(error)) {
      console.error('Caught ReactActionError:', error.action, error.payload);
    } else {
      console.error('Caught other error:', error);
    }
    // You can also log errorInfo.componentStack here
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## 4. TypeDoc Link

[isReactActionError in react-helpers.ts](../../../packages/core/src/react-helpers.ts)
