# RefTarget Type

## 1. Purpose

The `RefTarget` type is a generic type alias that represents any object that can be used as a ref target. It is intentionally defined as `any` to be as flexible as possible, allowing it to be used for DOM elements, Three.js objects, or any other kind of object that you might want to manage with a ref.

## 2. Structure

`RefTarget` is a type alias for `any`.

```typescript
export type RefTarget = any;
```

## 3. Usage Patterns

You don't typically use `RefTarget` directly. Instead, you provide a more specific type when you create a ref context. The `RefTarget` type serves as a base constraint for other generic types within the ref system.

### Example of a more specific type

When creating a ref context, you would define the specific types of your refs.

```typescript
import { createRefContext } from '@context-action/react';

const { Provider, useRefHandler } = createRefContext<{
  myDiv: HTMLDivElement;
  myCanvas: HTMLCanvasElement;
}>('AppRefs');
```

In this example, `HTMLDivElement` and `HTMLCanvasElement` are the specific "ref targets".

## 4. TypeDoc Link

[RefTarget in types.ts](../../../packages/react/src/refs/types.ts)
