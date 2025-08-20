[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreValues

# Function: useStoreValues()

> **useStoreValues**\<`T`, `S`\>(`store`, `selectors`): `undefined` \| \{ \[K in string \| number \| symbol\]: ReturnType\<S\[K\]\> \}

Defined in: [packages/react/src/stores/hooks/useStoreValue.ts:347](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useStoreValue.ts#L347)

Hook for selecting multiple values from a store with optimized re-renders

Subscribes to multiple computed values from a single store using selector functions.
Optimizes performance by only triggering re-renders when the selected values change,
using shallow comparison to detect changes in the combined result object.

## Type Parameters

### Generic type T

Type parameter **T**

Type of the store value

### Generic type S

`S` *extends* `Record`\<`string`, (`value`) => `any`\>

Type of the selectors object mapping keys to selector functions

## Parameters

### store

The store to subscribe to (can be undefined for conditional usage)

`undefined` | `null` | [`Store`](../classes/Store.md)&lt;`T`&gt;

### selectors

Type parameter **S**

Object mapping result keys to selector functions

## Returns

`undefined` \| \{ \[K in string \| number \| symbol\]: ReturnType\<S\[K\]\> \}

Object with selected values, or undefined if store is undefined

## Examples

```typescript
const userStore = createStore('user', { 
  id: '1', 
  name: 'John', 
  email: 'john@example.com',
  settings: { theme: 'dark', notifications: true }
})

const { name, theme } = useStoreValues(userStore, {
  name: user => user.name,
  theme: user => user.settings.theme
})

// Component only re-renders when name or theme changes
// Changes to email or settings.notifications are ignored
```

```typescript
const appStore = createStore('app', {
  user: { name: 'John', role: 'admin' },
  ui: { sidebar: true, theme: 'dark' },
  data: { items: [], loading: false }
})

const { userName, isAdmin, itemCount, isDark } = useStoreValues(appStore, {
  userName: app => app.user.name,
  isAdmin: app => app.user.role === 'admin',
  itemCount: app => app.data.items.length,
  isDark: app => app.ui.theme === 'dark'
})
```

```typescript\n * // Safe to use with potentially undefined stores
const result = useStoreValues(maybeUndefinedStore, {\n *   value1: data => data.field1,\n *   value2: data => data.field2\n * })\n * \n * if (result) {\n *   const { value1, value2 } = result\n *   // Use selected values\n * }\n * ```\n * \n * @public\n
