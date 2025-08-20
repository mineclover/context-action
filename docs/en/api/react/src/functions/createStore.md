[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createStore

# Function: createStore()

> **createStore**&lt;`T`&gt;(`name`, `initialValue`): [`Store`](../classes/Store.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/Store.ts:521](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/Store.ts#L521)

Factory function for creating type-safe Store instances

Creates a new Store instance with the specified name and initial value.
Provides type safety and integrates seamlessly with React hooks and
the Context-Action framework patterns.

## Type Parameters

### Generic type T

Type parameter **T**

The type of values stored in this store

## Parameters

### name

`string`

Unique identifier for the store (used for debugging)

### initialValue

Type parameter **T**

Initial value to store

## Returns

[`Store`](../classes/Store.md)&lt;`T`&gt;

Configured Store instance ready for use

## Examples

```typescript
// Object store
const userStore = createStore('user', {
  id: '',
  name: '',
  email: ''
})

// Primitive value stores
const countStore = createStore('count', 0)
const themeStore = createStore('theme', 'light' as 'light' | 'dark')
const itemsStore = createStore('items', [] as string[])
```

```typescript
// Create store
const userStore = createStore('user', { name: 'Guest' })

// Use in React component
function UserProfile() {
  const user = useStoreValue(userStore)
  
  const updateName = (name: string) => {
    userStore.update(current => ({ ...current, name }))
  }
  
  return <div>Hello, {user.name}!</div>
}
```

```typescript
const todoStore = createStore('todos', [] as Todo[])

// Set entire value
todoStore.setValue([{ id: 1, text: 'Learn TypeScript', done: false }])

// Update with function
todoStore.update(todos => [
  ...todos,
  { id: 2, text: 'Build app', done: false }
])

// Get current value
const currentTodos = todoStore.getValue()
```
