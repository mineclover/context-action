# ActionContextType Interface

## 1. Purpose

The `ActionContextType` interface defines the shape of the value that is stored in the React context created by `createActionContext`. It holds a reference to the `ActionRegister` instance for the context.

## 2. Structure

The `ActionContextType` interface has a single property:

```typescript
export interface ActionContextType<T extends {}> {
  // A React ref object pointing to the ActionRegister instance.
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
}
```

## 3. Usage Patterns

You typically don't interact with `ActionContextType` directly. It is used internally by the hooks returned from `createActionContext` (like `useActionDispatch` and `useActionHandler`) to access the `ActionRegister`.

However, you can use the `useActionContext` hook if you need direct access to the context value, for example, for advanced use cases or debugging.

### Accessing the Context Value

```typescript
import { useActionContext } from './AppActions'; // Assuming you created a context here

const MyAdvancedComponent = () => {
  const contextValue = useActionContext();

  // You can now access the actionRegisterRef
  // Note: The ref's `current` property might be null initially
  if (contextValue.actionRegisterRef.current) {
    // ... do something with the ActionRegister instance
  }

  return (
    // ...
  );
};
```

## 4. TypeDoc Link

[ActionContextType in ActionContext.types.ts](../../../packages/react/src/actions/ActionContext.types.ts)
