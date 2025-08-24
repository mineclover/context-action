# useStoreManager API

The `useStoreManager` hook provides low-level access to the internal StoreManager instance for advanced store management scenarios in the Declarative Store Pattern.

## Basic Usage

### Getting Store Manager

```tsx
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';

const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { initialValue: { name: '', email: '' } },
  settings: { initialValue: { theme: 'light', notifications: true } },
  cart: { initialValue: { items: [], total: 0 } }
});

function MyComponent() {
  const manager = useAppStoreManager();
  
  // Get store instances directly
  const userStore = manager.getStore('user');
  const settingsStore = manager.getStore('settings');
  
  // Component logic here
}
```

### Store Operations

```tsx
function UserManager() {
  const manager = useAppStoreManager();
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  
  const updateUserName = (newName: string) => {
    const userStore = manager.getStore('user');
    const currentUser = userStore.getValue();
    userStore.setValue({ ...currentUser, name: newName });
  };
  
  const updateUserEmail = (newEmail: string) => {
    const userStore = manager.getStore('user');
    userStore.update(current => ({ ...current, email: newEmail }));
  };
  
  return (
    <div>
      <input 
        value={user.name}
        onChange={e => updateUserName(e.target.value)}
      />
      <input 
        value={user.email}
        onChange={e => updateUserEmail(e.target.value)}
      />
    </div>
  );
}
```

## API Reference

### manager.getStore(storeName)

Get a typed store instance by name. This is the primary method for accessing stores.

```tsx
const manager = useAppStoreManager();

// Get store instances with full type safety
const userStore = manager.getStore('user');     // Store<User>
const settingsStore = manager.getStore('settings'); // Store<Settings>
const cartStore = manager.getStore('cart');     // Store<Cart>

// Use store methods directly
const currentUser = userStore.getValue();
userStore.setValue(newUser);
userStore.update(user => ({ ...user, name: 'John' }));
```

### Store Instance Methods

Once you have a store instance, you can use these methods:

```tsx
const userStore = manager.getStore('user');

// Get current value
const currentUser = userStore.getValue();

// Set new value directly
userStore.setValue({ name: 'John', email: 'john@example.com' });

// Update with function
userStore.update(current => ({
  ...current,
  lastLoginAt: new Date()
}));

// Subscribe to changes
const unsubscribe = userStore.subscribe((newValue, previousValue) => {
  console.log('User changed:', { newValue, previousValue });
});

// Reset to initial value
userStore.reset();
```

### Manager Utility Methods

```tsx
const manager = useAppStoreManager();

// Get manager info
const info = manager.getInfo();
console.log(info); // { name: 'App', storeCount: 3, availableStores: ['user', 'settings', 'cart'] }

// Clear all stores (advanced use case)
manager.clear();
```

## Advanced Patterns

### Bulk Store Operations

```tsx
function BulkOperations() {
  const manager = useAppStoreManager();
  
  const handleBulkUpdate = async () => {
    // Update multiple stores in sequence
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const cartStore = manager.getStore('cart');
    
    userStore.setValue({ name: 'John Doe', email: 'john@example.com' });
    settingsStore.update(current => ({ ...current, theme: 'dark' }));
    cartStore.update(current => ({ 
      ...current, 
      items: [...current.items, newItem] 
    }));
  };
  
  const handleResetAll = () => {
    // Reset all stores to initial values
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const cartStore = manager.getStore('cart');
    
    userStore.reset();
    settingsStore.reset();
    cartStore.reset();
  };
  
  return (
    <div>
      <button onClick={handleBulkUpdate}>Update All</button>
      <button onClick={handleResetAll}>Reset All</button>
    </div>
  );
}
```

### Conditional Store Updates

```tsx
function ConditionalUpdates() {
  const manager = useAppStoreManager();
  
  const updateUserIfValid = (newUser: User) => {
    const userStore = manager.getStore('user');
    const currentUser = userStore.getValue();
    
    // Only update if user is different
    if (JSON.stringify(currentUser) !== JSON.stringify(newUser)) {
      userStore.setValue(newUser);
    }
  };
  
  const updateSettingsIfAllowed = (newSettings: Settings) => {
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const user = userStore.getValue();
    
    // Only update if user has permission
    if (user.role === 'admin') {
      settingsStore.setValue(newSettings);
    }
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Store Manager with Validation

```tsx
function ValidatedStoreManager() {
  const manager = useAppStoreManager();
  
  const updateUserWithValidation = (updates: Partial<User>) => {
    const userStore = manager.getStore('user');
    const currentUser = userStore.getValue();
    const newUser = { ...currentUser, ...updates };
    
    // Validate before updating
    if (isValidUser(newUser)) {
      userStore.setValue(newUser);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid user data' };
    }
  };
  
  const updateSettingsWithDefaults = (settings: Partial<Settings>) => {
    const settingsStore = manager.getStore('settings');
    settingsStore.update(current => ({
      // Apply defaults first
      theme: 'light',
      notifications: true,
      language: 'en',
      // Then apply updates
      ...current,
      ...settings
    }));
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## Integration with Actions

Store Manager works seamlessly with Action Context for complex business logic:

```tsx
// Action handler using Store Manager
function UserActions() {
  const manager = useAppStoreManager();
  
  useEventActionHandler('updateUserProfile', async (payload) => {
    const userStore = manager.getStore('user');
    const settingsStore = manager.getStore('settings');
    const currentUser = userStore.getValue();
    
    // Business logic
    const updatedUser = await processUserUpdate(currentUser, payload);
    
    // Update stores
    userStore.setValue(updatedUser);
    settingsStore.update(settings => ({
      ...settings,
      lastUpdatedBy: updatedUser.id
    }));
  });
  
  return null; // This is a logic-only component
}
```

## Performance Considerations

### Batch Updates

```tsx
function OptimizedUpdates() {
  const manager = useAppStoreManager();
  
  const handleBatchUpdate = () => {
    // These updates happen in sequence but are optimized
    React.unstable_batchedUpdates(() => {
      const userStore = manager.getStore('user');
      const settingsStore = manager.getStore('settings');
      const cartStore = manager.getStore('cart');
      
      userStore.setValue(newUser);
      settingsStore.setValue(newSettings);
      cartStore.setValue(newCart);
    });
  };
  
  return (
    <button onClick={handleBatchUpdate}>
      Update Multiple Stores
    </button>
  );
}
```

### Memoized Updates

```tsx
function MemoizedUpdates() {
  const manager = useAppStoreManager();
  
  const updateUserMemoized = useCallback((updates: Partial<User>) => {
    const userStore = manager.getStore('user');
    userStore.update(current => ({ ...current, ...updates }));
  }, [manager]);
  
  const resetUserMemoized = useCallback(() => {
    const userStore = manager.getStore('user');
    userStore.reset();
  }, [manager]);
  
  return (
    <UserForm 
      onUpdate={updateUserMemoized}
      onReset={resetUserMemoized}
    />
  );
}
```

## Error Handling

### Safe Store Operations

```tsx
function SafeStoreManager() {
  const manager = useAppStoreManager();
  
  const safeUpdateStore = <K extends keyof StoreTypes>(
    storeName: K, 
    value: StoreTypes[K]
  ) => {
    try {
      const store = manager.getStore(storeName);
      store.setValue(value);
      return { success: true };
    } catch (error) {
      console.error(`Failed to update store ${String(storeName)}:`, error);
      return { success: false, error };
    }
  };
  
  const safeGetStoreValue = <K extends keyof StoreTypes>(storeName: K) => {
    try {
      const store = manager.getStore(storeName);
      return { success: true, value: store.getValue() };
    } catch (error) {
      console.error(`Failed to get store ${String(storeName)}:`, error);
      return { success: false, error };
    }
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## TypeScript Support

Store Manager provides full type safety:

```tsx
interface User {
  name: string;
  email: string;
}

interface Settings {
  theme: 'light' | 'dark';
  notifications: boolean;
}

interface Cart {
  items: Array<{ id: string; name: string; price: number }>;
  total: number;
}

const {
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  user: { initialValue: { name: '', email: '' } as User },
  settings: { initialValue: { theme: 'light', notifications: true } as Settings },
  cart: { initialValue: { items: [], total: 0 } as Cart }
});

function TypeSafeComponent() {
  const manager = useAppStoreManager();
  
  // TypeScript knows the exact type of each store
  const updateUser = (user: User) => {
    const userStore = manager.getStore('user'); // Returns Store<User>
    userStore.setValue(user); // ✅ Type-safe
    // userStore.setValue('invalid'); // ❌ TypeScript error
  };
  
  const getUserData = () => {
    const userStore = manager.getStore('user'); // Returns Store<User>
    return userStore.getValue(); // Returns User
  };
  
  return <div>{/* Component JSX */}</div>;
}
```

## Best Practices

### 1. Use Functional Updates for Complex State

```tsx
const manager = useAppStoreManager();

// ✅ Good: Functional update
const cartStore = manager.getStore('cart');
cartStore.update(cart => ({
  ...cart,
  items: cart.items.map(item => 
    item.id === productId 
      ? { ...item, quantity: item.quantity + 1 }
      : item
  )
}));

// ❌ Avoid: Reading current state separately
const cart = cartStore.getValue();
cartStore.setValue({
  ...cart,
  items: cart.items.map(/* ... */)
});
```

### 2. Combine with useCallback for Performance

```tsx
const manager = useAppStoreManager();

const updateUserName = useCallback((name: string) => {
  const userStore = manager.getStore('user');
  userStore.update(user => ({ ...user, name }));
}, [manager]);
```

### 3. Use Store Manager for Related Updates

```tsx
const manager = useAppStoreManager();

const handleUserLogin = useCallback(async (credentials) => {
  const user = await login(credentials);
  
  // Update related stores together
  const userStore = manager.getStore('user');
  const settingsStore = manager.getStore('settings');
  
  userStore.setValue(user);
  settingsStore.update(settings => ({
    ...settings,
    isLoggedIn: true,
    lastLoginAt: new Date()
  }));
}, [manager]);
```

### 4. Prefer Direct Store Access over useStore Hook

```tsx
// ✅ Good: Using manager for multiple operations
const manager = useAppStoreManager();
const userStore = manager.getStore('user');
const settingsStore = manager.getStore('settings');

// Perform multiple operations efficiently
userStore.setValue(newUser);
settingsStore.update(settings => ({ ...settings, lastUpdated: Date.now() }));

// ❌ Less efficient: Multiple hook calls
const userStore = useAppStore('user');
const settingsStore = useAppStore('settings');
```

## Real-World Examples

- [User Profile Management](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)
- [Shopping Cart Operations](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/CartDemo.tsx)
- [Settings Panel](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/SettingsDemo.tsx)

## When to Use Store Manager

### Use Store Manager When:
- **Multiple Store Operations**: You need to update multiple stores in a single function
- **Advanced Store Logic**: Complex state manipulation requiring direct store access
- **Performance Optimization**: Batch operations or avoiding multiple hook calls
- **Action Handlers**: Business logic that spans multiple stores
- **Custom Store Utilities**: Building reusable store manipulation functions

### Use Regular Hooks When:
- **Simple State Access**: Just reading or updating a single store
- **Component Rendering**: Using `useStoreValue` for reactive UI updates
- **Basic Operations**: Simple setValue/getValue operations

## Related Documentation

- [Basic Store Usage](./basic-usage.md) - Fundamental store patterns
- [useStoreValue Patterns](./useStoreValue-patterns.md) - Advanced hook patterns
- [withProvider Pattern](./withProvider-pattern.md) - Higher-order component patterns
- [Action Integration](../action/basic-usage.md) - Integrating with actions