# createRefContext Function

## 1. Purpose

The `createRefContext` function is a factory for creating a ref context. It returns a `RefContextReturn` object, which contains a `Provider` component and a set of hooks for managing and interacting with refs.

## 2. Signature

The `createRefContext` function has two overloads:

### Simple Overload

```typescript
export function createRefContext<T extends Record<string, any>>(
  contextName: string,
  options?: CreateRefContextOptions
): RefContextReturn<T>;
```

### Overload with Ref Definitions

```typescript
export function createRefContext<T extends RefDefinitions>(
  contextName: string,
  refDefinitions: T,
  options?: CreateRefContextOptions
): RefContextReturn<InferRefTypes<T>>;
```

## 3. Usage Patterns

You use `createRefContext` to create a ref context that can be used throughout your application.

### Creating a Simple Ref Context

```typescript
import { createRefContext } from '@context-action/react';

export const { Provider, useRefHandler } = createRefContext<{
  myDiv: HTMLDivElement;
}>('AppRefs');
```

### Creating a Ref Context with Definitions

You can provide a set of ref definitions to `createRefContext` to pre-configure your refs.

```typescript
import { createRefContext } from '@context-action/react';

const refDefinitions = {
  myDiv: { name: 'myDiv' },
  myCanvas: { name: 'myCanvas', mountTimeout: 5000 },
};

export const { Provider, useRefHandler } = createRefContext(
  'AppRefs',
  refDefinitions
);
```

## 4. TypeDoc Link

[createRefContext in createRefContext.ts](../../../packages/react/src/refs/createRefContext.ts)
