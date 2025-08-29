# RefContext Mount State Patterns

## Overview

RefContext provides multiple patterns for handling mount state. Understanding the differences between these patterns is crucial for proper implementation.

## ✅ Recommended: Reactive Mount State Pattern

Use `useRefMountState` for truly reactive mount state subscription:

```typescript
const mountState = useRefMountState('container');
const { isMounted, mountedTarget } = mountState;

useEffect(() => {
  if (isMounted && mountedTarget) {
    console.log('Container mounted');
    // Perform mount-related actions
  } else {
    console.log('Container unmounted');
    // Cleanup or disable features
  }
}, [isMounted, mountedTarget]);
```

### Benefits
- **Automatic State Updates**: Mount/unmount state changes automatically trigger re-renders
- **No Manual Cleanup**: No need to manually set state to false on unmount
- **Type Safety**: Full TypeScript support with proper typing
- **Reactive**: Integrates naturally with React's reactivity model

## ⚠️ Common Pitfall: onMount Callback Pattern

The `onMount` callback pattern has a subtle but important limitation:

```typescript
// ⚠️ PROBLEMATIC PATTERN
const [isContainerMounted, setIsContainerMounted] = useState(false);

useEffect(() => {
  const unregister = containerRef.onMount((element) => {
    setIsContainerMounted(true); // ✅ Mount handled
  });
  
  return unregister; // ❌ Only unregisters callback, doesn't update state!
}, [containerRef]);

// Problem: When unmounted, isContainerMounted remains true!
```

### The Issue

The `unregister` function returned by `onMount`:
- ✅ Removes the callback from the internal callback set
- ❌ Does NOT update your local state
- ❌ Does NOT notify about unmount events

### Correct Usage with onMount

If you must use `onMount`, handle unmount manually:

```typescript
const [isContainerMounted, setIsContainerMounted] = useState(false);

useEffect(() => {
  const unregister = containerRef.onMount((element) => {
    setIsContainerMounted(true);
  });
  
  return () => {
    unregister();
    setIsContainerMounted(false); // ✅ Manually handle unmount
  };
}, [containerRef]);
```

## Pattern Comparison

| Pattern | Mount Detection | Unmount Detection | Reactivity | Recommended |
|---------|----------------|-------------------|------------|-------------|
| `useRefMountState` | ✅ Automatic | ✅ Automatic | ✅ Full | ✅ Yes |
| `onMount` callback | ✅ Manual | ❌ Not provided | ⚠️ Partial | ❌ No |
| `executeIfMounted` | N/A | N/A | ❌ None | ⚠️ Conditional |

## Best Practices

### 1. Always Use Reactive Patterns for State-Dependent UI

```typescript
// ✅ GOOD: Reactive mount state
const { isMounted, mountedTarget } = useRefMountState('container');

return (
  <div>
    {isMounted ? '✅ Mounted' : '❌ Not mounted'}
  </div>
);
```

### 2. Use onMount Only for One-Time Initialization

```typescript
// ✅ OK: One-time setup that doesn't affect React state
useEffect(() => {
  const unregister = ref.onMount((element) => {
    // Initialize third-party library
    initializeLibrary(element);
  });
  
  return unregister;
}, [ref]);
```

### 3. Combine Patterns When Needed

```typescript
// ✅ GOOD: Reactive state + initialization callback
const { isMounted } = useRefMountState('container');

useEffect(() => {
  const unregister = ref.onMount((element) => {
    // One-time initialization
    setupEventListeners(element);
  });
  
  return unregister;
}, [ref]);

// Use reactive state for UI
useEffect(() => {
  if (isMounted) {
    enableFeatures();
  } else {
    disableFeatures();
  }
}, [isMounted]);
```

## Migration Guide

### From onMount to useRefMountState

Before:
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  const unregister = ref.onMount(() => {
    setMounted(true);
  });
  return () => {
    unregister();
    setMounted(false); // Easy to forget!
  };
}, [ref]);
```

After:
```typescript
const { isMounted } = useRefMountState('refName');
// That's it! No manual state management needed
```

## Summary

- **Always prefer `useRefMountState`** for reactive mount state management
- **Be aware** that `onMount`'s unregister function doesn't handle unmount state
- **Use onMount** only for one-time initialization that doesn't affect React state
- **Combine patterns** when you need both reactive state and initialization callbacks