# createStore Function

## 1. Purpose

The `createStore` function is a factory for creating instances of the `Store` class. It provides a simple and type-safe way to create a new store with a given name and initial value.

## 2. Signature

```typescript
export function createStore<T>(name: string, initialValue: T): Store<T>;
```

## 3. Usage Patterns

You use `createStore` to create a new store instance.

### Creating a Simple Store

```typescript
import { createStore } from '@context-action/react';

const userStore = createStore('user', { name: 'Guest', age: 0 });
const themeStore = createStore('theme', 'light');
```

## 4. TypeDoc Link

[createStore in Store.ts](../../../packages/react/src/stores/core/Store.ts)
