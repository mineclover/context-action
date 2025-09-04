# UnregisterFunction Type Alias

## 1. Purpose

The `UnregisterFunction` type alias represents the function that is returned when you register an action handler. Calling this function will unregister the handler from the action pipeline, preventing it from being executed in the future.

## 2. Structure

`UnregisterFunction` is a simple function type that takes no arguments and returns nothing.

```typescript
export type UnregisterFunction = () => void;
```

## 3. Usage Patterns

You get an `UnregisterFunction` when you call `register` on an `ActionRegister` instance.

### Unregistering a Handler

```typescript
import { ActionRegister } from '@context-action/core';

const register = new ActionRegister();

const userHandler = (payload) => {
  console.log('User updated:', payload);
};

// Register the handler and get the unregister function
const unregister = register.register('updateUser', userHandler);

// ... later in your code, when you want to remove the handler
unregister();
```

## 4. TypeDoc Link

[UnregisterFunction in types.ts](../../../packages/core/src/types.ts)
