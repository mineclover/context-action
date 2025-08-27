# Comparison Strategies

Optimization patterns for choosing the right comparison strategy in store subscriptions to balance performance and accuracy.

## Reference Comparison (Fastest)

Use reference comparison for primitive values or when exact object reference matters:

```tsx
// For primitive values or when exact reference matters
const primitiveValue = useStoreValue(store, undefined, {
  comparison: 'reference' // Default, fastest
});
```

**Best for:**
- Primitive values (string, number, boolean)
- When object references are carefully managed
- Maximum performance requirements

## Shallow Comparison (Balanced)

Use shallow comparison for objects with shallow changes:

```tsx
// For objects with shallow changes
const shallowData = useStoreValue(settingsStore, undefined, {
  comparison: 'shallow' // Good balance of performance and accuracy
});
```

**Best for:**
- Objects with first-level property changes
- Configuration objects
- Most common use cases where deep nesting isn't a concern

## Deep Comparison (Most Accurate)

Use deep comparison only when necessary for complex nested objects:

```tsx
// Only when necessary for complex nested objects
const deepData = useStoreValue(complexStore, undefined, {
  comparison: 'deep' // Most thorough, use sparingly
});
```

**Best for:**
- Complex nested object structures
- When accuracy is more important than performance
- Data with unpredictable nesting levels

## Custom Comparison

Create custom comparators for specific business logic:

```tsx
const customComparison = useStoreValue(userStore, user => user.profile, {
  customComparator: (prev, next) => {
    // Only update if specific fields changed
    return prev.name === next.name && prev.avatar === next.avatar;
  }
});
```

**Best for:**
- Specific business logic requirements
- When only certain fields matter for updates
- Performance optimization for known data structures

## Circular Reference Safe Comparison

Handle circular references safely in custom comparators:

```tsx
// ✅ CORRECT: Safe handling of circular references
const circularSafeComparison = useStoreValue(complexStore, undefined, {
  customComparator: (prev, next) => {
    const seenObjects = new WeakSet();
    
    try {
      // Use JSON.stringify for simple circular reference detection
      const prevStr = JSON.stringify(prev, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seenObjects.has(value)) return '[Circular]';
          seenObjects.add(value);
        }
        return value;
      });
      
      const nextStr = JSON.stringify(next, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seenObjects.has(value)) return '[Circular]';
          seenObjects.add(value);
        }
        return value;
      });
      
      return prevStr === nextStr;
    } catch {
      // Fallback to reference comparison for complex circular structures
      return Object.is(prev, next);
    }
  }
});
```

## Performance Characteristics

### Comparison Strategy Performance

| Strategy | Speed | Accuracy | Memory | Use Case |
|----------|--------|----------|---------|-----------|
| Reference | ⚡⚡⚡ | ✅ (primitives) | ⚡⚡⚡ | Primitives, managed references |
| Shallow | ⚡⚡ | ✅✅ | ⚡⚡ | Objects with shallow changes |
| Deep | ⚡ | ✅✅✅ | ⚡ | Complex nested structures |
| Custom | ⚡⚡ | ✅✅ | ⚡⚡ | Specific business logic |

### Choosing the Right Strategy

1. **Start with Reference**: Default for most primitive values
2. **Upgrade to Shallow**: When objects have shallow property changes
3. **Consider Custom**: For specific business logic or known data patterns
4. **Use Deep Sparingly**: Only when nested changes must trigger updates

## Best Practices

### ✅ Do
- Start with reference comparison and upgrade as needed
- Use shallow comparison for most object scenarios
- Profile comparison performance in development
- Consider custom comparators for specific business logic

### ❌ Avoid
- Using deep comparison unnecessarily
- Creating expensive custom comparators
- Ignoring circular reference handling in custom comparators
- Over-optimizing comparison strategies

## Related Patterns

- [Memoization Patterns](./memoization-patterns.md) - Prevent unnecessary computations
- [Subscription Optimization](./subscription-optimization.md) - Optimize subscription patterns
- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [Memory Management](./memory-management.md) - Efficient resource usage