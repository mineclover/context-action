# Real-time State Access Pattern

Pattern for avoiding closure traps by accessing current state in real-time.

## Prerequisites

See [Basic Store Setup](../setup/basic-store-setup.md) for store context configuration and naming conventions.

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
// Using Basic Store Setup pattern with proper configurations
const {
  Provider: UIStoreProvider,
  useStore: useUIStore,
  useStoreManager: useUIStoreManager
} = createStoreContext('UI', {
  isMounted: { 
    initialValue: false,
    strategy: 'shallow' as const,
    description: 'Component mount state tracking'
  },
  isProcessing: { 
    initialValue: false,
    strategy: 'shallow' as const,
    description: 'Processing operation state'
  }
});

function MyComponent() {
  const isMountedStore = useUIStore('isMounted');
  const isProcessingStore = useUIStore('isProcessing');
  
  const handleAction = useCallback(async () => {
    // Real-time state access - always get current values
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
  
  return (
    <div>
      <button onClick={handleAction}>Execute Action</button>
    </div>
  );
}

// App setup with Provider (following Basic Store Setup pattern)
function App() {
  return (
    <UIStoreProvider>
      <MyComponent />
    </UIStoreProvider>
  );
}
```

## Advanced Patterns

### Multiple Store Coordination

```typescript
function MultiStoreComponent() {
  const userStoreManager = useUserStoreManager();
  const settingsStoreManager = useSettingsStoreManager();
  const uiStoreManager = useUIStoreManager();
  
  useActionHandler('complexAction', useCallback(async (payload) => {
    // Get current state from each store manager
    const userState = userStoreManager.getStore('profile').getValue();
    const settingsState = settingsStoreManager.getStore('api').getValue();
    const uiState = uiStoreManager.getStore('loading').getValue();
    
    // Use all current states for decision making
    if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading) {
      // Execute complex logic
    }
  }, [userStoreManager, settingsStoreManager, uiStoreManager]));
}
```

### State Validation and Updates

```typescript
// Additional store configuration for data management
const {
  Provider: DataStoreProvider,
  useStore: useDataStore,
  useStoreManager: useDataStoreManager
} = createStoreContext('Data', {
  data: {
    initialValue: { version: 1, content: {} },
    strategy: 'shallow' as const,
    description: 'Application data with versioning'
  }
});

function DataManagementComponent() {
  const dataStore = useDataStore('data');
  
  useActionHandler('validateAndUpdate', useCallback(async (payload) => {
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
  }, [dataStore]));
}
```

## Key Benefits

- **No Stale Closures**: Always access current state
- **Race Condition Prevention**: Real-time checks prevent conflicts
- **Performance**: Avoid unnecessary re-renders from dependencies
- **Reliability**: Guaranteed fresh state values