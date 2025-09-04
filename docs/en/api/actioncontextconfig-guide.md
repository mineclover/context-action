# ActionContextConfig Interface

## 1. Purpose

The `ActionContextConfig` interface provides configuration options for the `createActionContext` function. It extends the `ActionRegisterConfig` from the core package, allowing you to customize the behavior of the underlying `ActionRegister` instance created by the context.

## 2. Structure

The `ActionContextConfig` interface extends `ActionRegisterConfig` and adds a `name` property.

```typescript
import { ActionRegisterConfig } from '@context-action/core';

export interface ActionContextConfig extends ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string;
}
```

This means you can use all the properties of `ActionRegisterConfig` (like `registry`, `debug`, `defaultExecutionMode`, etc.) in addition to the `name`.

## 3. Usage Patterns

You pass an `ActionContextConfig` object to the `createActionContext` function.

### Naming a Context

Providing a `name` is useful for debugging, as it helps identify the specific action context in logs and developer tools.

```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useActionDispatch } = createActionContext({
  name: 'MyAppContext',
});
```

### Configuring the ActionRegister

You can pass any valid `ActionRegisterConfig` options to configure the behavior of the action register for this context.

```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useActionDispatch } = createActionContext({
  name: 'MyFeatureContext',
  registry: {
    defaultExecutionMode: 'parallel',
    debug: process.env.NODE_ENV === 'development',
  },
});
```

## 4. TypeDoc Link

[ActionContextConfig in ActionContext.types.ts](../../../packages/react/src/actions/ActionContext.types.ts)
