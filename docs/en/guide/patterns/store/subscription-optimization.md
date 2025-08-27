# Subscription Optimization

Patterns for optimizing store subscriptions to reduce unnecessary re-renders and improve performance through selective and conditional subscriptions.

## Selective Subscriptions

Choose what data to subscribe to carefully:

```tsx
// Only subscribe to specific fields
const userName = useStoreValue(userStore, user => user.name);
const userEmail = useStoreValue(userStore, user => user.email);

// Better: Group related subscriptions
const userBasicInfo = useStoreValue(userStore, user => ({
  name: user.name,
  email: user.email
}));
```

## Conditional Subscriptions

Only subscribe when the data is actually needed:

```tsx
const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(false);

// Only subscribe when needed
const liveData = useStoreValue(
  enableRealTimeUpdates ? dataStore : null,
  data => data?.liveMetrics
);
```

## Debounced Subscriptions

Debounce rapid changes to prevent excessive updates:

```tsx
// Debounce rapid store changes
const debouncedValue = useStoreValue(fastChangingStore, undefined, {
  debounce: 300  // Wait 300ms after last change
});

// Use with search or input scenarios
const searchResults = useStoreValue(searchStore, search => search.query, {
  debounce: 500
});
```

## Subscription Strategy Guidelines

### When to Group Subscriptions
- **Related Data**: When fields are logically related and often used together
- **Update Patterns**: When fields typically change together
- **Component Needs**: When a component needs multiple related fields

### When to Split Subscriptions
- **Independent Updates**: When fields change independently
- **Selective Rendering**: When only specific changes should trigger re-renders
- **Performance Critical**: When minimizing re-renders is crucial

### Debouncing Strategy
- **Fast-Changing Data**: Use debouncing for frequently updated stores
- **User Input**: Apply debouncing to search inputs and form fields
- **Real-Time Data**: Consider debouncing for live data feeds
- **Reasonable Delays**: Choose debounce values based on user experience (200-500ms typical)

## Best Practices

### ✅ Do
- Group related subscriptions when they're used together
- Use conditional subscriptions to avoid unnecessary work
- Apply debouncing to fast-changing data sources
- Profile subscription performance in development

### ❌ Avoid
- Subscribing to entire large objects when only parts are needed
- Creating multiple subscriptions for closely related data
- Over-debouncing critical updates
- Ignoring subscription cleanup

## Related Patterns

- [Memoization Patterns](./memoization-patterns.md) - Prevent unnecessary re-computations
- [Comparison Strategies](./comparison-strategies.md) - Choose the right comparison method
- [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
- [Memory Management](./memory-management.md) - Efficient resource usage