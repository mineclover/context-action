[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useComputedStore

# Function: useComputedStore()

> **useComputedStore**\<`T`, `R`\>(`store`, `compute`, `config`): `R`

Defined in: [packages/react/src/stores/hooks/useComputedStore.ts:139](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/hooks/useComputedStore.ts#L139)

Hook for computed store based on a single source store

Creates a derived value that automatically recalculates when the source store changes.
Includes performance optimizations like caching, debouncing, and intelligent re-computation
to prevent unnecessary work. Perfect for derived state patterns.

## Type Parameters

### Generic type T

Type parameter **T**

Type of the source store value

### Generic type R

Type parameter **R**

Type of the computed result

## Parameters

### store

[`Store`](../classes/Store.md)&lt;`T`&gt;

Source store to derive from

### compute

(`value`) => `R`

Function to compute derived value from store value

### config

`ComputedStoreConfig`&lt;`R`&gt; = `{}`

Optional configuration for performance and debugging

## Returns

Type parameter **R**

The computed value that updates when source store changes

## Examples

```typescript
const userStore = createStore('user', { 
  firstName: 'John', 
  lastName: 'Doe', 
  age: 30 
})

// Simple string computation
const fullName = useComputedStore(
  userStore,
  user => `${user.firstName} ${user.lastName}`
)

// Component re-renders only when fullName actually changes
function UserGreeting() {
  return <div>Hello, {fullName}!</div>
}
```

```typescript
const userSummary = useComputedStore(
  userStore,
  user => ({
    displayName: user.firstName,
    initials: `${user.firstName[0]}${user.lastName[0]}`,
    isAdult: user.age >= 18,
    category: user.age < 18 ? 'minor' : user.age < 65 ? 'adult' : 'senior'
  }),
  {
    equalityFn: shallowEqual,  // Prevent re-renders for same object shape
    debug: true,               // Log computation timing
    name: 'userSummary'        // Name for debugging
  }
)
```

```typescript
const expensiveComputation = useComputedStore(
  dataStore,
  data => performHeavyCalculation(data),
  {
    enableCache: true,         // Cache results for repeated inputs
    cacheSize: 100,           // Keep last 100 results
    debounceMs: 300,          // Wait 300ms after changes
    onError: (error) => {     // Handle computation errors
      console.error('Computation failed:', error)
      notifyUser('Calculation error occurred')
    }
  }
)
```
