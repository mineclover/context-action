# ActionDispatcher Interface

## 1. Purpose

The `ActionDispatcher` interface provides a type-safe way to dispatch actions. It uses conditional types to enforce that the correct payload is provided for each action, based on the `ActionPayloadMap`.

## 2. Structure

The `ActionDispatcher` interface is a function with multiple call signatures:

```typescript
export interface ActionDispatcher<T extends ActionPayloadMap> {
  // Dispatch an action with no payload.
  <K extends VoidActions<T>>(
    action: K,
    options?: DispatchOptions
  ): Promise<void>;

  // Dispatch an action with an optional undefined payload.
  <K extends VoidActions<T>>(
    action: K,
    payload?: undefined,
    options?: DispatchOptions
  ): Promise<void>;

  // Dispatch an action with a required payload.
  <K extends PayloadActions<T>>(
    action: K,
    payload: T[K],
    options?: DispatchOptions
  ): Promise<void>;
}
```

## 3. Usage Patterns

You typically get an `ActionDispatcher` instance from an `ActionRegister` or from the `useActionDispatch` hook.

### Dispatching Actions

```typescript
interface MyActions extends ActionPayloadMap {
  login: { user: string; pass: string };
  logout: void;
}

const register = new ActionRegister<MyActions>();
const dispatch: ActionDispatcher<MyActions> = register.dispatch.bind(register);

// Dispatch an action with a payload
dispatch('login', { user: 'test', pass: '123' });

// Dispatch an action without a payload
dispatch('logout');
```

## 4. TypeDoc Link

[ActionDispatcher in types.ts](../../../packages/core/src/types.ts)
