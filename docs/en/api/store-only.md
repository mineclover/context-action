# Store Only Methods

Complete API reference for Store Only Pattern methods from `createDeclarativeStorePattern`.

## Overview

The Store Only Pattern provides type-safe state management without action dispatching. This pattern is ideal for data layers, simple state management, and scenarios where you need reactive state without complex business logic.

## Core Methods

### `createDeclarativeStorePattern<T>(contextName, storeConfig)`

Creates a declarative store pattern with type-safe state management.

**Parameters:**
- `contextName`: Unique identifier for the store context
- `storeConfig`: Configuration object defining stores and their initial values

**Returns:**
```typescript
{
  Provider: React.ComponentType,
  useStore: (storeName: keyof T) => Store<T[storeName]>,
  useStoreManager: () => StoreManager<T>,
  withProvider: (Component: React.ComponentType) => React.ComponentType
}
```

**Example:**
```typescript
const { Provider, useStore, useStoreManager, withProvider } = 
  createDeclarativeStorePattern('App', {
    user: { id: '', name: '', email: '' },
    settings: { theme: 'light', language: 'en' }
  });
```

## Store Instance Methods

### `store.getValue()`

Returns the current value of the store synchronously.

**Returns:** Current store value
**Use Case:** Reading current state in action handlers or effects

```typescript
const userStore = useStore('user');
const currentUser = userStore.getValue();
console.log('Current user:', currentUser);
```

### `store.setValue(newValue)`

Sets the entire store value, replacing the current state.

**Parameters:**
- `newValue`: Complete new value for the store

**Returns:** `void`

```typescript
const userStore = useStore('user');
userStore.setValue({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
});
```

### `store.update(updater)`

Updates the store using an updater function that receives the current value.

**Parameters:**
- `updater`: Function that receives current value and returns new value

**Returns:** `void`

```typescript
const userStore = useStore('user');
userStore.update(current => ({
  ...current,
  name: 'Updated Name'
}));
```

### `store.subscribe(callback)`

Subscribes to store changes with a callback function.

**Parameters:**
- `callback`: Function called when store value changes

**Returns:** Unsubscribe function

```typescript
const userStore = useStore('user');
const unsubscribe = userStore.subscribe((newValue, previousValue) => {
  console.log('User changed:', { newValue, previousValue });
});

// Cleanup
useEffect(() => unsubscribe, []);
```

### `store.reset()`

Resets the store to its initial value.

**Returns:** `void`

```typescript
const userStore = useStore('user');
userStore.reset(); // Back to initial state
```

## Store Configuration Options

### Basic Configuration

Simple value initialization:

```typescript
const config = {
  user: { id: '', name: '', email: '' },
  settings: { theme: 'light', language: 'en' }
};
```

### Advanced Configuration

With validators and custom initial values:

```typescript
const config = {
  user: {
    initialValue: { id: '', name: '', email: '' },
    validator: (value) => typeof value === 'object' && 'id' in value
  },
  settings: {
    initialValue: { theme: 'light', language: 'en' },
    validator: (value) => 
      typeof value === 'object' && 
      'theme' in value && 
      ['light', 'dark'].includes(value.theme)
  }
};
```

## React Integration Hooks

### `useStoreValue(store)`

Hook for reactive store subscriptions in components.

**Parameters:**
- `store`: Store instance from `useStore()`

**Returns:** Current store value (reactive)

```typescript
function UserComponent() {
  const userStore = useStore('user');
  const user = useStoreValue(userStore); // Reactive subscription
  
  return <div>Welcome {user.name}</div>;
}
```

### `useStore(storeName)`

Hook to get a store instance by name.

**Parameters:**
- `storeName`: Key of the store from configuration

**Returns:** Store instance with methods

```typescript
function UserComponent() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  
  // Use store methods
  const handleUpdate = () => {
    userStore.update(current => ({ ...current, name: 'New Name' }));
  };
  
  return <button onClick={handleUpdate}>Update User</button>;
}
```

### `useStoreManager()`

Hook to get the store manager for advanced operations.

**Returns:** StoreManager instance

```typescript
function AdminPanel() {
  const storeManager = useStoreManager();
  
  const resetAllStores = () => {
    storeManager.resetAll();
  };
  
  const exportState = () => {
    const state = storeManager.exportState();
    console.log('Current state:', state);
  };
  
  return (
    <div>
      <button onClick={resetAllStores}>Reset All</button>
      <button onClick={exportState}>Export State</button>
    </div>
  );
}
```

## Store Configuration Patterns

### Simple Value Pattern

Direct value assignment for simple types:

```typescript
const simpleConfig = {
  counter: 0,
  username: '',
  isLoggedIn: false,
  theme: 'light'
};
```

### Object Pattern

Complex objects with initial state:

```typescript
const objectConfig = {
  user: {
    id: '',
    profile: {
      name: '',
      email: '',
      avatar: null as string | null
    },
    preferences: {
      notifications: true,
      theme: 'light'
    }
  }
};
```

### Validated Pattern

Stores with validation functions:

```typescript
const validatedConfig = {
  settings: {
    initialValue: { theme: 'light', fontSize: 14 },
    validator: (value) => {
      return typeof value === 'object' &&
        'theme' in value &&
        'fontSize' in value &&
        ['light', 'dark'].includes(value.theme) &&
        typeof value.fontSize === 'number' &&
        value.fontSize >= 10 && value.fontSize <= 24;
    }
  }
};
```

## Advanced Store Operations

### Conditional Updates

```typescript
function ConditionalUpdater() {
  const userStore = useStore('user');
  
  const updateIfLoggedIn = () => {
    const current = userStore.getValue();
    if (current.isAuthenticated) {
      userStore.update(user => ({
        ...user,
        lastActivity: Date.now()
      }));
    }
  };
  
  return <button onClick={updateIfLoggedIn}>Update Activity</button>;
}
```

### Computed Values

```typescript
function ComputedValues() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  // Computed values based on multiple stores
  const displayName = user.name || user.email?.split('@')[0] || 'Anonymous';
  const isDarkTheme = settings.theme === 'dark';
  
  return (
    <div className={isDarkTheme ? 'dark' : 'light'}>
      Welcome {displayName}
    </div>
  );
}
```

### Store Synchronization

```typescript
function StoreSynchronizer() {
  const userStore = useStore('user');
  const cacheStore = useStore('cache');
  
  // Sync user changes to cache
  useEffect(() => {
    return userStore.subscribe((newUser) => {
      cacheStore.update(cache => ({
        ...cache,
        lastUser: newUser,
        lastUpdated: Date.now()
      }));
    });
  }, [userStore, cacheStore]);
  
  return null;
}
```

## Performance Optimization

### Selective Subscriptions

```typescript
function OptimizedComponent() {
  const userStore = useStore('user');
  
  // Only subscribe to specific changes
  const userName = useStoreValue(userStore, user => user.name);
  const userEmail = useStoreValue(userStore, user => user.email);
  
  // Component only re-renders when name or email changes
  return <div>{userName} ({userEmail})</div>;
}
```

### Batched Updates

```typescript
function BatchedUpdates() {
  const userStore = useStore('user');
  
  const updateUserProfile = () => {
    // Single update with all changes
    userStore.update(current => ({
      ...current,
      name: 'New Name',
      email: 'new@email.com',
      lastUpdated: Date.now()
    }));
  };
  
  return <button onClick={updateUserProfile}>Update Profile</button>;
}
```

## Error Handling

### Validation Errors

```typescript
function ValidatedStore() {
  const settingsStore = useStore('settings');
  
  const updateTheme = (theme: string) => {
    try {
      settingsStore.update(current => ({
        ...current,
        theme: theme as 'light' | 'dark'
      }));
    } catch (error) {
      console.error('Theme update failed:', error);
      // Handle validation error
    }
  };
  
  return <button onClick={() => updateTheme('dark')}>Dark Theme</button>;
}
```

## Related

- **[Store Manager API](./store-manager)** - Store manager methods and operations
- **[Declarative Store Pattern](./declarative-store-pattern)** - Pattern implementation details
- **[Store Only Example](../examples/store-only)** - Complete usage examples