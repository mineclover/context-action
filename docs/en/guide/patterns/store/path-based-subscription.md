# Path-Based Subscription

Optimized subscription pattern that uses JSON patches to determine when to re-render, providing fine-grained control over component updates.

## Overview

Traditional selectors run on every state change and compare results. Path-based subscription instead analyzes JSON patches to determine if subscribed paths are affected, avoiding unnecessary selector execution.

```
# Selector Approach
State Change → Run Selector → Compare Result → (if different) Re-render

# Path-Based Approach
State Change → Check Patch Paths → (if path affected) Get Value → Re-render
```

## Core APIs

### useStorePath

Subscribe to a specific path in the store. Only re-renders when that path changes.

```tsx
import { useStorePath } from '@context-action/react';

function UserName() {
  // Only re-renders when user.name changes
  const name = useStorePath(store, ['user', 'name']);
  return <span>{name}</span>;
}

function UserAge() {
  // Only re-renders when user.age changes
  const age = useStorePath(store, ['user', 'age']);
  return <span>{age}</span>;
}
```

### useStoreSelectorWithPaths

Combine selector transformation with path-based optimization.

```tsx
import { useStoreSelectorWithPaths } from '@context-action/react';

function FullName() {
  // Selector runs only when firstName or lastName changes
  const fullName = useStoreSelectorWithPaths(
    store,
    (state) => `${state.user.firstName} ${state.user.lastName}`,
    { dependsOn: [['user', 'firstName'], ['user', 'lastName']] }
  );
  return <span>{fullName}</span>;
}
```

## Comparison with Selectors

| Feature | useStoreSelector | useStorePath | useStoreSelectorWithPaths |
|---------|------------------|--------------|---------------------------|
| **Selector Execution** | Every change | Path match only | Path match only |
| **Comparison Target** | Selector result | Patch paths | Patch paths |
| **Derived Values** | ✅ Yes | ❌ No | ✅ Yes |
| **Performance** | Depends on selector | Fast (string compare) | Best of both |

## When to Use Each

### useStorePath
Best for direct property access without transformation:

```tsx
// Simple path access
const theme = useStorePath(settingsStore, ['theme']);
const count = useStorePath(counterStore, ['count']);

// Array access
const firstItem = useStorePath(listStore, ['items', 0]);

// Nested access
const city = useStorePath(userStore, ['address', 'city']);
```

### useStoreSelector
Best for complex transformations where path hints aren't practical:

```tsx
// Complex filtering/mapping
const activeUsers = useStoreSelector(store,
  (s) => s.users.filter(u => u.isActive)
);

// Aggregations
const totalPrice = useStoreSelector(store,
  (s) => s.items.reduce((sum, item) => sum + item.price, 0)
);
```

### useStoreSelectorWithPaths
Best for derived values with known dependencies:

```tsx
// Derived value with specific dependencies
const displayName = useStoreSelectorWithPaths(
  store,
  (s) => s.user.nickname || `${s.user.firstName} ${s.user.lastName}`,
  { dependsOn: [['user', 'nickname'], ['user', 'firstName'], ['user', 'lastName']] }
);

// Computed value from multiple paths
const cartSummary = useStoreSelectorWithPaths(
  store,
  (s) => ({
    count: s.cart.items.length,
    total: s.cart.total,
    hasDiscount: s.cart.discount > 0
  }),
  { dependsOn: [['cart', 'items'], ['cart', 'total'], ['cart', 'discount']] }
);
```

## How Path Matching Works

A patch affects a subscribed path when:
1. **Exact match**: Patch path equals subscribed path
2. **Parent changed**: Patch path is prefix of subscribed path
3. **Child changed**: Subscribed path is prefix of patch path

```tsx
const store = createStore('app', {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' }
  }
});

// Subscribing to ['user', 'profile', 'name']
// ✅ Affected by: patch to ['user', 'profile', 'name'] (exact)
// ✅ Affected by: patch to ['user', 'profile'] (parent)
// ✅ Affected by: patch to ['user'] (ancestor)
// ❌ NOT affected by: patch to ['user', 'settings'] (sibling)
// ❌ NOT affected by: patch to ['user', 'profile', 'age'] (sibling)
```

## Custom Equality

Both hooks support custom equality functions:

```tsx
// With custom equality for complex objects
const position = useStorePath(store, ['player', 'position'], {
  equalityFn: (a, b) => a?.x === b?.x && a?.y === b?.y
});

// Shallow equality for objects
const config = useStoreSelectorWithPaths(
  store,
  (s) => s.config,
  {
    dependsOn: [['config']],
    equalityFn: shallowEqual
  }
);
```

## Store API: subscribeWithPatches

The underlying Store API that powers path-based hooks:

```typescript
import { createStore, type PatchAwareListener } from '@context-action/react';

const store = createStore('app', { count: 0, user: { name: 'John' } });

// Subscribe with patch awareness
const unsubscribe = store.subscribeWithPatches((patches) => {
  console.log('Patches:', patches);
  // [{ op: 'replace', path: ['count'], value: 1 }]
});

store.setValue({ ...store.getValue(), count: 1 });

// Get last patches
const lastPatches = store.getLastPatches();
```

## Performance Benefits

### Before (Selector Only)
```tsx
// Selector runs on EVERY state change
function ExpensiveComponent() {
  const result = useStoreSelector(store, (s) => {
    // This expensive computation runs every time ANY state changes
    return expensiveComputation(s.data);
  });
}
```

### After (Path-Based)
```tsx
// Selector only runs when 'data' path changes
function OptimizedComponent() {
  const result = useStoreSelectorWithPaths(
    store,
    (s) => expensiveComputation(s.data),
    { dependsOn: [['data']] }
  );
}
```

## Best Practices

### Do
- Use `useStorePath` for simple property access
- Use `useStoreSelectorWithPaths` when you need both transformation and optimization
- Specify precise `dependsOn` paths for better filtering
- Use array indices for specific array element subscriptions

### Avoid
- Using `useStorePath` when you need derived/computed values
- Omitting `dependsOn` when paths are known (falls back to every-change behavior)
- Over-specifying paths (subscribe to parent if multiple children are needed)

## Related Patterns

- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [Subscription Optimization](./subscription-optimization.md) - General optimization strategies
- [Memoization Patterns](./memoization-patterns.md) - Prevent unnecessary re-computations
- [Comparison Strategies](./comparison-strategies.md) - Choose the right comparison method
