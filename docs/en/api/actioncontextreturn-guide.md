# ActionContextReturn Interface

## 1. Purpose

The `ActionContextReturn` interface defines the object returned by the `createActionContext` function. This object contains the React `Provider` component and a set of custom hooks for interacting with the action context.

## 2. Structure

The `ActionContextReturn` interface provides the following properties:

```typescript
export interface ActionContextReturn<T extends {}> {
  // The React Provider component to wrap your component tree.
  Provider: React.FC<{ children: ReactNode }>;

  // A hook to get the raw action context.
  useActionContext: () => ActionContextType<T>;

  // A hook to get the `dispatch` function for dispatching actions.
  useActionDispatch: () => ActionRegister<T>['dispatch'];

  // A hook to register an action handler from within a component.
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;

  // A hook to get the underlying ActionRegister instance.
  useActionRegister: () => ActionRegister<T> | null;

  // A hook that provides enhanced dispatching capabilities, including results and aborting.
  useActionDispatchWithResult: () => {
    dispatch: <K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<void>;
    dispatchWithResult: <K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<ExecutionResult<R>>;
    abortAll: () => void;
    resetAbortScope: () => void;
  };

  // The actual React Context object.
  context: React.Context<ActionContextType<T> | null>;
}
```

## 3. Usage Patterns

The `ActionContextReturn` object is destructured to access the `Provider` and hooks.

### Creating and Using an Action Context

First, create a context, then wrap your application or component with the `Provider`.

```typescript
// In your context file (e.g., AppActions.ts)
import { createActionContext } from '@context-action/react';

export const { Provider, useActionDispatch, useActionHandler } = createActionContext();

// In your main application file (e.g., App.tsx)
import { Provider as AppActionProvider } from './AppActions';

const App = () => (
  <AppActionProvider>
    {/* ... your components ... */}
  </AppActionProvider>
);
```

### Dispatching Actions and Registering Handlers

Components within the `Provider` can use the hooks to dispatch actions or register handlers.

```typescript
// In a component
import { useActionDispatch, useActionHandler } from './AppActions';

const MyComponent = () => {
  const dispatch = useActionDispatch();

  useActionHandler('myAction', (payload) => {
    console.log('myAction was dispatched with payload:', payload);
  });

  return (
    <button onClick={() => dispatch('myAction', { id: 1 })}>
      Dispatch Action
    </button>
  );
};
```

## 4. TypeDoc Link

[ActionContextReturn in ActionContext.types.ts](../../../packages/react/src/actions/ActionContext.types.ts)
