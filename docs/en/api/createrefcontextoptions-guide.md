# CreateRefContextOptions Interface

## 1. Purpose

The `CreateRefContextOptions` interface provides configuration options for the `createRefContext` function. It allows you to set a default mount timeout for all refs within the context and to disable timeouts altogether.

## 2. Structure

The `CreateRefContextOptions` interface has the following properties:

```typescript
export interface CreateRefContextOptions {
  // A default mount timeout in milliseconds for all refs in the context.
  // If undefined, there is no timeout.
  defaultMountTimeout?: number;

  // If true, all timeouts for individual refs will be disabled.
  disableTimeout?: boolean;
}
```

## 3. Usage Patterns

You pass a `CreateRefContextOptions` object to the `createRefContext` function.

### Setting a Default Timeout

This is useful for ensuring that all refs in a context have a consistent timeout behavior.

```typescript
import { createRefContext } from '@context-action/react';

const { Provider, useRefHandler } = createRefContext(
  'AppRefs',
  {
    defaultMountTimeout: 5000, // 5 seconds
  }
);
```

### Disabling Timeouts

In some cases, you may want to disable timeouts entirely, for example, in tests or for refs that are expected to take a long time to mount.

```typescript
import { createRefContext } from '@context-action/react';

const { Provider, useRefHandler } = createRefContext(
  'TestRefs',
  {
    disableTimeout: true,
  }
);
```

## 4. TypeDoc Link

[CreateRefContextOptions in createRefContext.ts](../../../packages/react/src/refs/createRefContext.ts)
