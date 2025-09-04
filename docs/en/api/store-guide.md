# Store Class Guide

Core reactive state management with memory leak prevention and React integration.

## Purpose
Central store implementation providing reactive subscriptions, immutable state management, and comprehensive resource cleanup.

## Class Structure

### Constructor
```typescript
new Store<T>(name: string, initialValue: T): Store<T>
```
- **Purpose**: Create named store with initial value
- **Usage**: Direct instantiation or via store context patterns

## Core Methods

### State Access
```typescript
getValue(): T                    // Action handlers - current value copy
getValueUnsafe(): T             // Performance - direct reference (use carefully)
getSnapshot(): Snapshot<T>      // React integration - immutable snapshot
```

### State Modification
```typescript
setValue(value: T, options?: StoreSetValueOptions<T>): void
update(updater: (current: T) => T): void
```

### Subscriptions
```typescript
subscribe(listener: Listener): Unsubscribe
getListenerCount(): number
clearListeners(): void
```

## Usage Patterns

### Basic Store Operations
```typescript
const userStore = new Store('user', { name: '', email: '' });

// Read current value (for action handlers)
const currentUser = userStore.getValue();

// Update entire value
userStore.setValue({ name: 'John', email: 'john@example.com' });

// Update with function
userStore.update(user => ({ ...user, name: 'Jane' }));
```

### React Integration
```typescript
function UserComponent() {
  const userStore = useAppStore('user');
  
  // Subscribe to changes (automatic re-render)
  const user = useStoreValue(userStore);
  
  const updateName = (name: string) => {
    userStore.update(current => ({ ...current, name }));
  };
  
  return <div>{user.name}</div>;
}
```

### Action Handler Integration
```typescript
// Store Integration Pattern: Read → Logic → Update
useActionHandler('updateProfile', async (payload, controller) => {
  // Step 1: Read current state
  const currentProfile = profileStore.getValue();
  
  // Step 2: Execute business logic
  const updatedProfile = {
    ...currentProfile,
    ...payload,
    lastUpdated: Date.now()
  };
  
  // Step 3: Update store
  profileStore.setValue(updatedProfile);
});
```

### Subscription Management
```typescript
const unsubscribe = userStore.subscribe(() => {
  console.log('User changed:', userStore.getValue());
});

// Manual cleanup
unsubscribe();

// Automatic cleanup with React
useEffect(() => {
  const unsubscribe = userStore.subscribe(handleUserChange);
  return unsubscribe; // Cleanup on unmount
}, [userStore]);
```

## Advanced Features

### Memory Management
```typescript
// Register cleanup tasks
const timer = setInterval(() => updateStats(), 1000);
const unregisterCleanup = userStore.registerCleanup(() => {
  clearInterval(timer);
  console.log('Timer cleared');
});

// Cleanup tasks run automatically on dispose
userStore.dispose();
```

### Performance Optimization
```typescript
// Disable cloning for performance-critical stores
userStore.setCloningEnabled(false);

// Custom comparison logic
userStore.setCustomComparator((oldValue, newValue) => {
  return oldValue.id === newValue.id && oldValue.version === newValue.version;
});

// Comparison options
userStore.setComparisonOptions({
  strategy: 'shallow', // 'deep' | 'reference' | 'shallow'
  maxDepth: 2
});
```

### Notification Control
```typescript
// For testing/debugging
userStore.setNotificationMode('immediate'); // or 'batched'

// Check current mode
const mode = userStore.getNotificationMode();
```

## Store Creation Patterns

### Context Pattern (Recommended)
```typescript
const AppStores = createStoreContext('App', {
  user: { name: '', email: '' },
  settings: { theme: 'light', notifications: true }
});

function Component() {
  const userStore = AppStores.useStore('user');
  // Store instance is managed by context
}
```

### Direct Creation
```typescript
const userStore = new Store('user', { name: '', email: '' });

// Manual disposal required
useEffect(() => {
  return () => userStore.dispose();
}, []);
```

### Factory Pattern
```typescript
function createUserStore(initialUser: User) {
  const store = new Store('user', initialUser);
  
  // Configure store
  store.setComparisonOptions({ strategy: 'shallow' });
  
  // Register cleanup
  store.registerCleanup(() => {
    console.log('User store disposed');
  });
  
  return store;
}
```

## State Update Strategies

### Immutable Updates (Default)
```typescript
// setValue with cloning (safe)
userStore.setValue({ ...user, name: 'Updated' });

// update with Immer integration
userStore.update(draft => {
  draft.name = 'Updated'; // Immer handles immutability
});
```

### Performance Updates
```typescript
// Disable cloning for trusted updates
userStore.setCloningEnabled(false);
userStore.setValue(newUserObject); // Direct reference (faster)

// Re-enable for safety
userStore.setCloningEnabled(true);
```

### Conditional Updates
```typescript
userStore.setValue(newUser, {
  skipNotification: false,          // Control notifications
  forceUpdate: false,              // Force update even if values are equal
  customComparator: (old, new) => old.id !== new.id
});
```

## Integration Patterns

### With Action Handlers
```typescript
// Read current state in handlers
const handleUserUpdate = async (payload: UserUpdate) => {
  const currentUser = userStore.getValue();
  const updatedUser = { ...currentUser, ...payload };
  userStore.setValue(updatedUser);
};
```

### With React Components
```typescript
function UserProfile() {
  const userStore = AppStores.useStore('user');
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <input 
        value={user.name}
        onChange={(e) => userStore.update(u => ({ ...u, name: e.target.value }))}
      />
    </div>
  );
}
```

### With Custom Hooks
```typescript
function useUserActions() {
  const userStore = AppStores.useStore('user');
  
  return {
    updateName: (name: string) => userStore.update(u => ({ ...u, name })),
    updateEmail: (email: string) => userStore.update(u => ({ ...u, email })),
    reset: () => userStore.setValue({ name: '', email: '' })
  };
}
```

## Resource Management

### Automatic Cleanup
```typescript
const store = new Store('data', []);

// Register resources for cleanup
const interval = setInterval(() => fetchData(), 5000);
store.registerCleanup(() => clearInterval(interval));

const websocket = new WebSocket('ws://...');
store.registerCleanup(() => websocket.close());

// All cleanup tasks run on dispose
store.dispose(); // Clears interval, closes websocket, removes listeners
```

### Memory Leak Prevention
```typescript
// Check if store is disposed
if (store.isStoreDisposed()) {
  console.warn('Store already disposed');
  return;
}

// Monitor listener count
console.log('Active listeners:', store.getListenerCount());

// Clear all listeners manually
store.clearListeners();
```

### React Component Integration
```typescript
function DataComponent() {
  const [store] = useState(() => new Store('local', initialData));
  
  // Auto-dispose on unmount
  useEffect(() => {
    return () => store.dispose();
  }, [store]);
  
  const data = useStoreValue(store);
  return <div>{data.length} items</div>;
}
```

## Performance Considerations

- **getValue()**: Creates copy (safe for handlers)
- **getValueUnsafe()**: Direct reference (performance-critical only)
- **update()**: Uses Immer for safe mutations
- **setValue()**: Configurable cloning and comparison
- **subscribe()**: Efficient listener management with cleanup
- **dispose()**: Complete resource cleanup

## Error Handling

```typescript
// Safe subscription with error handling
const unsubscribe = store.subscribe(() => {
  try {
    handleStoreChange(store.getValue());
  } catch (error) {
    console.error('Store change handler error:', error);
  }
});

// Check disposal before operations
function updateStore(value: T) {
  if (store.isStoreDisposed()) {
    console.warn('Cannot update disposed store');
    return;
  }
  
  store.setValue(value);
}
```

## Links

- **TypeDoc**: [Store.md](./react/src/classes/Store.md)
- **useStoreValue Guide**: [useStoreValue Guide](./usestorevalue-guide.md)
- **Store Patterns**: [Store Patterns](/en/guide/patterns/store/)