[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useStoreSelector

# Function: useStoreSelector()

> **useStoreSelector**\<`T`, `R`\>(`store`, `selector`, `equalityFn`): `R`

Defined in: [packages/react/src/stores/hooks/useStoreSelector.ts:148](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useStoreSelector.ts#L148)

Hook for selective store subscription with performance optimization

Subscribes to specific parts of store data using a selector function,
triggering re-renders only when the selected value actually changes.
Essential for preventing unnecessary re-renders in complex applications.

## Type Parameters

### Generic type T

Type parameter **T**

Type of the store value

### Generic type R

Type parameter **R**

Type of the value returned by the selector

## Parameters

### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

Store instance to subscribe to

### selector

(`value`) => `R`

Function to extract needed data from store value

### equalityFn

(`a`, `b`) => `boolean`

Function to compare previous and new values (default: Object.is)

## Returns

Type parameter **R**

The value returned by the selector function

## Examples

```typescript
interface User {
  id: string
  profile: { name: string; email: string; avatar?: string }
  preferences: { theme: 'light' | 'dark'; language: string }
  metadata: { lastLogin: Date; createdAt: Date }
}

const userStore = createStore<User>('user', initialUser)

// Subscribe only to profile.name - ignores other user changes
const userName = useStoreSelector(
  userStore, 
  user => user.profile.name
)

// Component re-renders only when name changes
```

```typescript
// Subscribe to entire profile object with shallow equality
const userProfile = useStoreSelector(
  userStore, 
  user => user.profile,
  shallowEqual
)

// Re-renders only when profile properties change
// (name, email, avatar), not when preferences or metadata change
```

```typescript
const userDisplayInfo = useStoreSelector(
  userStore,
  user => ({
    displayName: user.profile.name || 'Anonymous',
    isNewUser: Date.now() - user.metadata.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000,
    avatarUrl: user.profile.avatar || '/default-avatar.png'
  }),
  shallowEqual
)
```

```typescript
const expensiveComputation = useStoreSelector(
  userStore,
  user => {
    if (!user.profile.name) return null
    
    // Expensive calculation only when name exists
    return processUserData(user)
  }
)
```
