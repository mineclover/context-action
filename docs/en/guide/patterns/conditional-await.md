# Conditional Await Pattern

Core behavior of useWaitForRefs that conditionally waits or returns immediately.

## Basic Pattern

```typescript
const waitForRefs = useWaitForRefs();

// Will either wait or return immediately
await waitForRefs('targetElement');

// Expected behavior:
// - Unmounted: waits until element is mounted
// - Mounted: returns immediately
```

## Use Cases

### Simple Wait
```typescript
const handleClick = useCallback(async () => {
  await waitForRefs('targetElement');
  console.log('Element is now available');
}, [waitForRefs]);
```

### Conditional Logic
```typescript
const handleAction = useCallback(async () => {
  const currentState = stateStore.getValue();
  
  if (!currentState.isReady) {
    await waitForRefs('readyElement');
  }
  
  // Proceed with action
}, [waitForRefs, stateStore]);
```

## Key Benefits

- **Automatic Detection**: No manual checking required
- **Performance**: Zero delay when element is already mounted
- **Reliability**: Guaranteed element availability after await