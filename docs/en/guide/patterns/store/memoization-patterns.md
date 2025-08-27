# Memoization Patterns

Optimization patterns using React's memoization hooks to prevent unnecessary re-renders and expensive computations in store subscriptions.

## Stable Selectors with useCallback

Use `useCallback` to create stable selector functions that prevent unnecessary re-renders:

```tsx
import { useCallback } from 'react';

// ✅ Good: Stable selector prevents unnecessary re-renders
const userName = useStoreValue(userStore, useCallback(
  user => user.name,
  [] // No dependencies needed for stable selector
));

// ❌ Avoid: New selector function on every render
const userName = useStoreValue(userStore, user => user.name);
```

## Complex Selector Memoization

For complex data transformations, memoize the selector to avoid expensive computations on every render:

```tsx
const processedUserData = useStoreValue(
  userStore,
  useCallback(user => ({
    displayName: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName[0]}${user.lastName[0]}`,
    status: user.isActive ? 'online' : 'offline',
    joinedDate: new Date(user.createdAt).toLocaleDateString()
  }), [])
);
```

## Memoized Computed Store Dependencies

Use `useMemo` for expensive computation functions in `useComputedStore`:

```tsx
const memoizedComputation = useComputedStore(
  [userStore, settingsStore],
  useMemo(() => ([user, settings]) => {
    // Expensive computation here
    return performComplexCalculation(user, settings);
  }, []),
  {
    comparison: 'shallow'
  }
);
```

## Best Practices

### ✅ Do
- Use `useCallback` for all selector functions
- Memoize complex data transformations
- Keep dependency arrays minimal and accurate
- Profile performance before and after memoization

### ❌ Avoid
- Creating new functions in selectors on every render
- Over-memoizing simple operations
- Including unnecessary dependencies in memoization arrays
- Premature optimization without measurement

## Related Patterns

- [Subscription Optimization](./subscription-optimization.md) - Optimize subscription patterns
- [Comparison Strategies](./comparison-strategies.md) - Choose the right comparison method
- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [useComputedStore Patterns](./useComputedStore-patterns.md) - Computed value patterns