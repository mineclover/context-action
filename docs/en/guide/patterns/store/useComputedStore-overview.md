# useComputedStore Pattern Overview

Comprehensive guide to computed value patterns using `useComputedStore` for derived state, performance optimization, and reactive calculations.

## Pattern Categories

### [Basic Computed Patterns](./useComputedStore-basic.md)
Fundamental patterns for computed values:

- **Simple Derived State**: Computing values from a single store
- **Multi-Store Computations**: Combining data from multiple stores
- **Data Formatting**: Converting raw data to display format
- **String Concatenation**: Combining multiple fields

### Advanced Computed Patterns
Complex computation scenarios (see original [useComputedStore-patterns.md](./useComputedStore-patterns.md)):

- **Conditional Computations**: Dynamic calculations based on conditions
- **Complex Object Transformations**: Advanced data manipulation
- **Chained Computations**: Dependent computed values
- **Computed Store Instances**: Reusable computed store creation

### Performance Optimization
Optimization techniques for computed values:

- **Caching with Custom Keys**: Efficient result caching
- **Memoized Dependencies**: Optimizing expensive computations
- **Selective Updates**: Controlling when computations run
- **Comparison Strategies**: Choosing the right comparison method

### Async Computed Patterns
Asynchronous computation patterns:

- **Basic Async Computation**: Simple async derived values
- **Complex Async Dependencies**: Managing multiple async operations
- **Loading States**: Handling async computation states
- **Error Handling**: Managing async computation errors

## Quick Reference

### Basic Usage
```tsx
const computedValue = useComputedStore(
  [store1, store2],           // Dependencies
  ([data1, data2]) => {       // Computation function
    return data1 + data2;
  }
);
```

### With Options
```tsx
const computedValue = useComputedStore(
  [store1, store2],
  ([data1, data2]) => data1 + data2,
  {
    comparison: 'shallow',     // Comparison strategy
    cacheKey: 'my-computation' // Custom cache key
  }
);
```

## Common Use Cases

### 1. Data Formatting
```tsx
const formattedUser = useComputedStore(
  [userStore],
  ([user]) => `${user.firstName} ${user.lastName}`
);
```

### 2. Cross-Store Calculations  
```tsx
const orderTotal = useComputedStore(
  [cartStore, discountStore],
  ([cart, discount]) => cart.total * (1 - discount.percentage)
);
```

### 3. Conditional Logic
```tsx
const userPermissions = useComputedStore(
  [userStore, settingsStore],
  ([user, settings]) => {
    if (user.role === 'admin') return settings.adminPermissions;
    return settings.userPermissions;
  }
);
```

## Performance Considerations

### Optimization Priority
1. **Use Basic Patterns First**: Start with simple computations
2. **Add Caching**: Use custom keys for expensive computations
3. **Optimize Dependencies**: Minimize dependency array changes
4. **Consider Async**: Move expensive operations to async patterns

### When to Split Computations
- **Complex Logic**: Break down into smaller, focused computations
- **Multiple Outputs**: Create separate computed values for different outputs
- **Performance Issues**: Split expensive operations into cached sub-computations
- **Reusability**: Extract common computations into reusable patterns

## Error Handling

### Safe Computations
Always handle potential errors in computation functions:

```tsx
const safeComputation = useComputedStore(
  [dataStore],
  ([data]) => {
    try {
      return expensiveCalculation(data);
    } catch (error) {
      console.error('Computation failed:', error);
      return defaultValue;
    }
  }
);
```

## Best Practices Summary

### ✅ Universal Do's
- Keep computation functions pure (no side effects)
- Use appropriate comparison strategies for performance
- Handle errors gracefully with fallback values
- Cache expensive computations with custom keys
- Use descriptive names for computed values

### ❌ Universal Avoid's
- Performing side effects in computation functions
- Creating circular dependencies between computed values
- Ignoring error handling in computations
- Over-computing simple data access
- Complex nested computations without optimization

## Related Patterns

- [Basic Computed Patterns](./useComputedStore-basic.md) - Start here for fundamental patterns
- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [Memoization Patterns](./memoization-patterns.md) - Performance optimization
- [Error Handling & Recovery](./error-handling-recovery.md) - Robust error handling

## Migration Guide

### From Full Document
The comprehensive [useComputedStore-patterns.md](./useComputedStore-patterns.md) contains all patterns in detail. Use this overview to navigate to specific sections:

- **Getting Started**: [Basic Computed Patterns](./useComputedStore-basic.md)
- **Complex Scenarios**: Original document sections 86-518
- **Async Operations**: Original document sections 519-710  
- **Real Examples**: Original document sections 711-1091
- **Error Handling**: Original document sections 1092-1299