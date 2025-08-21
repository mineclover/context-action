# Real-time State Access Pattern

Pattern for avoiding closure traps by accessing current state in real-time.

## The Problem: Closure Traps

```typescript
// ❌ Problematic - stale closure
const [isMounted, setIsMounted] = useState(false);

const actionHandler = useCallback(async () => {
  // This value might be stale!
  if (!isMounted) {
    await waitForRefs('element');
  }
}, [waitForRefs, isMounted]); // Dependency on stale state
```

## The Solution: Real-time Access

```typescript
// ✅ Correct - real-time state access
const actionHandler = useCallback(async () => {
  // Always get the current state
  const currentState = stateStore.getValue();
  
  if (!currentState.isMounted) {
    await waitForRefs('element');
  }
  
  // Continue with operation
}, [stateStore, waitForRefs]); // No dependency on reactive state
```

## Complete Example

```typescript
const {
  stores,
  Provider: StoreProvider
} = createDeclarativeStorePattern('App', {
  isMounted: { initialValue: false },
  isProcessing: { initialValue: false }
});

function MyComponent() {
  const isMountedStore = stores.getStore('isMounted');
  const isProcessingStore = stores.getStore('isProcessing');
  
  const handleAction = useCallback(async () => {
    // Real-time state access
    const currentMounted = isMountedStore.getValue();
    const currentProcessing = isProcessingStore.getValue();
    
    if (currentProcessing) return; // Prevent double execution
    
    isProcessingStore.setValue(true);
    
    if (!currentMounted) {
      await waitForRefs('criticalElement');
    }
    
    // Perform action
    console.log('Action completed');
    
    isProcessingStore.setValue(false);
  }, [isMountedStore, isProcessingStore, waitForRefs]);
}
```

## Advanced Patterns

### Multiple Store Coordination

```typescript
useActionHandler('complexAction', async (payload) => {
  const userState = userStore.getValue();
  const settingsState = settingsStore.getValue();
  const uiState = uiStore.getValue();
  
  // Use all current states for decision making
  if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading) {
    // Execute complex logic
  }
});
```

### State Validation and Updates

```typescript
useActionHandler('validateAndUpdate', async (payload) => {
  const current = dataStore.getValue();
  
  // Validate current state
  if (current.version !== payload.expectedVersion) {
    throw new Error('Version mismatch');
  }
  
  // Update with current state as base
  dataStore.setValue({
    ...current,
    ...payload.updates,
    version: current.version + 1
  });
});
```

## Key Benefits

- **No Stale Closures**: Always access current state
- **Race Condition Prevention**: Real-time checks prevent conflicts
- **Performance**: Avoid unnecessary re-renders from dependencies
- **Reliability**: Guaranteed fresh state values