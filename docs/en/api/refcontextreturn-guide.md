# RefContextReturn Interface

## 1. Purpose

The `RefContextReturn` interface defines the object returned by the `createRefContext` function. This object provides the React `Provider` component and a collection of custom hooks for managing and interacting with refs within the context.

## 2. Structure

The `RefContextReturn` interface provides the following properties:

```typescript
export interface RefContextReturn<T> {
  // The React Provider component to wrap your component tree.
  Provider: React.FC<{ children: ReactNode }>;

  // A hook to get a handler for a specific ref.
  useRefHandler: <K extends keyof T>(refName: K) => { ... };

  // A hook to wait for multiple refs to be mounted.
  useWaitForRefs: () => <K extends keyof T>(...refNames: K[]) => Promise<Pick<T, K>>;

  // A hook to get all currently mounted refs.
  useGetAllRefs: () => () => Partial<T>;

  // A hook to poll for a ref until it is mounted.
  useRefPolling: () => <K extends keyof T>(...) => { ... };

  // A hook to get the mount state of a ref.
  useRefMountState: <K extends keyof T>(refName: K) => { ... };

  // A hook to subscribe to changes in a ref's mount state.
  useOnMountStateChange: <K extends keyof T>(...) => void;

  // A hook to get a function that checks the mount state of a ref.
  useRefMountChecker: <K extends keyof T>(refName: K) => () => { ... };

  // The name of the context.
  contextName: string;

  // The definitions of the refs in the context, if provided.
  refDefinitions?: T extends RefDefinitions ? T : undefined;
}
```
*(Note: The return types of the hooks are complex and are simplified here for brevity. Please refer to the source code for full details.)*

## 3. Usage Patterns

The `RefContextReturn` object is destructured to access the `Provider` and the various hooks for interacting with refs.

### Creating and Using a Ref Context

First, create a context. Then, wrap your component tree with the `Provider`.

```typescript
// In your context file (e.g., AppRefs.ts)
import { createRefContext } from '@context-action/react';

export const { Provider, useRefHandler } = createRefContext<{
  myDiv: HTMLDivElement;
}>('AppRefs');

// In your main application file (e.g., App.tsx)
import { Provider as AppRefProvider } from './AppRefs';

const App = () => (
  <AppRefProvider>
    {/* ... your components ... */}
  </AppRefProvider>
);
```

### Attaching a Ref in a Component

Use the `useRefHandler` hook to get a `setRef` function that you can attach to a component or DOM element.

```typescript
// In a component
import { useRefHandler } from './AppRefs';

const MyComponent = () => {
  const { setRef, isMounted } = useRefHandler('myDiv');

  return (
    <div ref={setRef}>
      My Div is {isMounted ? 'mounted' : 'not mounted'}.
    </div>
  );
};
```

## 4. TypeDoc Link

[RefContextReturn in createRefContext.ts](../../../packages/react/src/refs/createRefContext.ts)
