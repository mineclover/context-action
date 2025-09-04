# StoreErrorBoundaryProps Interface

## 1. Purpose

The `StoreErrorBoundaryProps` interface defines the props accepted by the `StoreErrorBoundary` component. These props allow you to configure the error boundary's behavior, including providing a fallback UI and handling errors.

## 2. Structure

The `StoreErrorBoundaryProps` interface has the following properties:

```typescript
export interface StoreErrorBoundaryProps {
  // The components that this error boundary will wrap.
  children: ReactNode;

  // A fallback UI to render when an error is caught.
  // Can be a ReactNode or a function that returns a ReactNode.
  fallback?: ReactNode | ((error: ContextActionError, errorInfo: ErrorInfo) => ReactNode);

  // A callback function that is called when an error is caught.
  onError?: (error: ContextActionError, errorInfo: ErrorInfo) => void;

  // If true, the error boundary will reset when its props change.
  resetOnPropsChange?: boolean;

  // An array of keys to watch for changes. If any of these keys change,
  // the error boundary will reset.
  resetKeys?: Array<string | number>;
}
```

## 3. Usage Patterns

The props are passed to the `StoreErrorBoundary` component.

### Providing a Fallback Component

You can provide a custom component to be rendered as a fallback UI.

```typescript
import { StoreErrorBoundary, StoreErrorBoundaryProps } from '@context-action/react';

const MyFallbackComponent: React.FC<{ error: Error }> = ({ error }) => (
  <div>
    <h1>An error occurred!</h1>
    <p>{error.message}</p>
  </div>
);

const App = () => (
  <StoreErrorBoundary fallback={<MyFallbackComponent />}>
    {/* ... */}
  </StoreErrorBoundary>
);
```

### Handling Errors

You can use the `onError` prop to log errors to a reporting service.

```typescript
import { StoreErrorBoundary, StoreErrorBoundaryProps } from '@context-action/react';

const handleError = (error, errorInfo) => {
  // logErrorToMyService(error, errorInfo);
};

const App = () => (
  <StoreErrorBoundary onError={handleError}>
    {/* ... */}
  </StoreErrorBoundary>
);
```

## 4. TypeDoc Link

[StoreErrorBoundaryProps in StoreErrorBoundary.tsx](../../../packages/react/src/stores/components/StoreErrorBoundary.tsx)
