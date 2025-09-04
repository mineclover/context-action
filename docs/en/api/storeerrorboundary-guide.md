# StoreErrorBoundary Class

## 1. Purpose

The `StoreErrorBoundary` is a React component that acts as an error boundary for errors occurring within the `@context-action/react` store system. It catches errors thrown by stores or components connected to them, and displays a fallback UI instead of crashing the entire component tree.

## 2. Structure

The `StoreErrorBoundary` is a class-based React component that takes the following props:

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

You can wrap `StoreErrorBoundary` around any part of your component tree where you expect store-related errors might occur.

### Basic Usage

Wrap the component around a part of your UI that uses stores.

```typescript
import { StoreErrorBoundary } from '@context-action/react';
import MyComponentThatUsesStores from './MyComponentThatUsesStores';

const App = () => (
  <div>
    <h1>My Application</h1>
    <StoreErrorBoundary>
      <MyComponentThatUsesStores />
    </StoreErrorBoundary>
  </div>
);
```

### Providing a Custom Fallback UI

You can provide a custom component or JSX to be rendered when an error occurs.

```typescript
const CustomFallback = ({ error, errorInfo }) => (
  <div>
    <h2>Something went wrong!</h2>
    <p>{error.message}</p>
  </div>
);

const App = () => (
  <StoreErrorBoundary fallback={CustomFallback}>
    <MyComponentThatUsesStores />
  </StoreErrorBoundary>
);
```

### Resetting the Error Boundary

You can automatically reset the error boundary by passing `resetOnPropsChange` or `resetKeys`.

```typescript
const App = ({ userId }) => (
  <StoreErrorBoundary resetKeys={[userId]}>
    <UserProfile userId={userId} />
  </StoreErrorBoundary>
);
```
In this example, if the `userId` prop changes, the `StoreErrorBoundary` will reset its state, allowing the `UserProfile` component to re-render.

## 4. TypeDoc Link

[StoreErrorBoundary in StoreErrorBoundary.tsx](../../../packages/react/src/stores/components/StoreErrorBoundary.tsx)
