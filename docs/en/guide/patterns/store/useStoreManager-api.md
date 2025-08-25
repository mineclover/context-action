# useStoreManager API

The `useStoreManager` hook provides low-level access to the internal StoreManager instance for advanced store management scenarios in the Declarative Store Pattern.

## Prerequisites

For basic store setup and context creation, see **[Basic Store Setup](../setup/basic-store-setup.md)**.

This document demonstrates API usage using the store setup:
- Store configuration → [Type Inference Configurations](../setup/basic-store-setup.md#type-inference-configurations)
- Context creation → [Single Domain Store Context](../setup/basic-store-setup.md#single-domain-store-context)

## Basic Usage

### Getting Store Manager

```tsx
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';

// Using the established store patterns from setup guide
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'en', notifications: true },
    strategy: 'shallow' as const
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow' as const
  }
});

function MyComponent() {
  const manager = useUserStoreManager();
  
  // Get store instances directly using setup pattern
  const profileStore = manager.getStore('profile');
  const preferencesStore = manager.getStore('preferences');
  
  // Component logic here
}
```

### Store Operations

```tsx
function UserManager() {
  const manager = useUserStoreManager();
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  const updateUserName = (newName: string) => {
    const profileStore = manager.getStore('profile');
    const currentProfile = profileStore.getValue();
    profileStore.setValue({ ...currentProfile, name: newName });
  };
  
  const updateUserEmail = (newEmail: string) => {
    const profileStore = manager.getStore('profile');
    profileStore.update(current => ({ ...current, email: newEmail }));
  };
  
  return (
    <div>
      <input 
        value={profile.name}
        onChange={e => updateUserName(e.target.value)}
      />
      <input 
        value={profile.email}
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
const manager = useUserStoreManager();

// Get store instances with full type safety
const profileStore = manager.getStore('profile');     // Store<UserProfile>
const preferencesStore = manager.getStore('preferences'); // Store<UserPreferences>
const sessionStore = manager.getStore('session');     // Store<UserSession>

// Use store methods directly
const currentProfile = profileStore.getValue();
profileStore.setValue(newProfile);
profileStore.update(profile => ({ ...profile, name: 'John' }));
```

### Store Instance Methods

Once you have a store instance, you can use these methods:

```tsx
const profileStore = manager.getStore('profile');

// Get current value
const currentProfile = profileStore.getValue();

// Set new value directly
profileStore.setValue({ id: '123', name: 'John', email: 'john@example.com', role: 'user' });

// Update with function
profileStore.update(current => ({
  ...current,
  name: 'John Doe'
}));

// Subscribe to changes
const unsubscribe = profileStore.subscribe((newValue, previousValue) => {
  console.log('Profile changed:', { newValue, previousValue });
});

// Reset to initial value
profileStore.reset();
```

### Manager Utility Methods

```tsx
const manager = useUserStoreManager();

// Get manager info
const info = manager.getInfo();
console.log(info); // { name: 'User', storeCount: 3, availableStores: ['profile', 'preferences', 'session'] }

// Clear all stores (advanced use case)
manager.clear();
```

## Advanced Patterns

### Bulk Store Operations

```tsx
function BulkOperations() {
  const manager = useUserStoreManager();
  
  const handleBulkUpdate = async () => {
    // Update multiple stores in sequence
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const sessionStore = manager.getStore('session');
    
    profileStore.setValue({ id: '123', name: 'John Doe', email: 'john@example.com', role: 'user' });
    preferencesStore.update(current => ({ ...current, theme: 'dark' }));
    sessionStore.update(current => ({ 
      ...current, 
      isAuthenticated: true,
      lastActivity: Date.now()
    }));
  };
  
  const handleResetAll = () => {
    // Reset all stores to initial values
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const sessionStore = manager.getStore('session');
    
    profileStore.reset();
    preferencesStore.reset();
    sessionStore.reset();
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
  const manager = useUserStoreManager();
  
  const updateProfileIfValid = (newProfile: UserProfile) => {
    const profileStore = manager.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // Only update if profile is different
    if (JSON.stringify(currentProfile) !== JSON.stringify(newProfile)) {
      profileStore.setValue(newProfile);
    }
  };
  
  const updatePreferencesIfAllowed = (newPreferences: UserPreferences) => {
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const profile = profileStore.getValue();
    
    // Only update if user has permission
    if (profile.role === 'admin') {
      preferencesStore.setValue(newPreferences);
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
  const manager = useUserStoreManager();
  
  const updateProfileWithValidation = (updates: Partial<UserProfile>) => {
    const profileStore = manager.getStore('profile');
    const currentProfile = profileStore.getValue();
    const newProfile = { ...currentProfile, ...updates };
    
    // Validate before updating
    if (isValidProfile(newProfile)) {
      profileStore.setValue(newProfile);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid profile data' };
    }
  };
  
  const updatePreferencesWithDefaults = (preferences: Partial<UserPreferences>) => {
    const preferencesStore = manager.getStore('preferences');
    preferencesStore.update(current => ({
      // Apply defaults first
      theme: 'light',
      notifications: true,
      language: 'en',
      // Then apply updates
      ...current,
      ...preferences
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
  const manager = useUserStoreManager();
  
  useEventActionHandler('updateUserProfile', async (payload) => {
    const profileStore = manager.getStore('profile');
    const preferencesStore = manager.getStore('preferences');
    const currentProfile = profileStore.getValue();
    
    // Business logic
    const updatedProfile = await processUserUpdate(currentProfile, payload);
    
    // Update stores
    profileStore.setValue(updatedProfile);
    preferencesStore.update(preferences => ({
      ...preferences,
      language: updatedProfile.role === 'admin' ? 'en' : preferences.language
    }));
  });
  
  return null; // This is a logic-only component
}
```

## Performance Considerations

### Batch Updates

```tsx
function OptimizedUpdates() {
  const manager = useUserStoreManager();
  
  const handleBatchUpdate = () => {
    // These updates happen in sequence but are optimized
    React.unstable_batchedUpdates(() => {
      const profileStore = manager.getStore('profile');
      const preferencesStore = manager.getStore('preferences');
      const sessionStore = manager.getStore('session');
      
      profileStore.setValue(newProfile);
      preferencesStore.setValue(newPreferences);
      sessionStore.setValue(newSession);
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
  const manager = useUserStoreManager();
  
  const updateProfileMemoized = useCallback((updates: Partial<UserProfile>) => {
    const profileStore = manager.getStore('profile');
    profileStore.update(current => ({ ...current, ...updates }));
  }, [manager]);
  
  const resetProfileMemoized = useCallback(() => {
    const profileStore = manager.getStore('profile');
    profileStore.reset();
  }, [manager]);
  
  return (
    <UserForm 
      onUpdate={updateProfileMemoized}
      onReset={resetProfileMemoized}
    />
  );
}
```

## Error Handling

### Safe Store Operations

```tsx
function SafeStoreManager() {
  const manager = useUserStoreManager();
  
  const safeUpdateStore = <K extends keyof UserStores>(
    storeName: K, 
    value: UserStores[K]
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
  
  const safeGetStoreValue = <K extends keyof UserStores>(storeName: K) => {
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
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'ko' | 'ja' | 'zh';
  notifications: boolean;
}

interface UserSession {
  isAuthenticated: boolean;
  permissions: string[];
  lastActivity: number;
}

const {
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' as const },
    strategy: 'shallow' as const
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'en', notifications: true },
    strategy: 'shallow' as const
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow' as const
  }
});

function TypeSafeComponent() {
  const manager = useUserStoreManager();
  
  // TypeScript knows the exact type of each store
  const updateProfile = (profile: UserProfile) => {
    const profileStore = manager.getStore('profile'); // Returns Store<UserProfile>
    profileStore.setValue(profile); // ✅ Type-safe
    // profileStore.setValue('invalid'); // ❌ TypeScript error
  };
  
  const getProfileData = () => {
    const profileStore = manager.getStore('profile'); // Returns Store<UserProfile>
    return profileStore.getValue(); // Returns UserProfile
  };
  
  return <div>{/* Component JSX */}</div>;
}
```

## Best Practices

### 1. Use Functional Updates for Complex State

```tsx
const manager = useUserStoreManager();

// ✅ Good: Functional update
const sessionStore = manager.getStore('session');
sessionStore.update(session => ({
  ...session,
  permissions: session.permissions.includes('read') 
    ? session.permissions 
    : [...session.permissions, 'read']
}));

// ❌ Avoid: Reading current state separately
const session = sessionStore.getValue();
sessionStore.setValue({
  ...session,
  permissions: [...session.permissions, 'read']
});
```

### 2. Combine with useCallback for Performance

```tsx
const manager = useUserStoreManager();

const updateProfileName = useCallback((name: string) => {
  const profileStore = manager.getStore('profile');
  profileStore.update(profile => ({ ...profile, name }));
}, [manager]);
```

### 3. Use Store Manager for Related Updates

```tsx
const manager = useUserStoreManager();

const handleUserLogin = useCallback(async (credentials) => {
  const user = await login(credentials);
  
  // Update related stores together
  const profileStore = manager.getStore('profile');
  const sessionStore = manager.getStore('session');
  
  profileStore.setValue({ id: user.id, name: user.name, email: user.email, role: user.role });
  sessionStore.update(session => ({
    ...session,
    isAuthenticated: true,
    lastActivity: Date.now(),
    permissions: user.permissions
  }));
}, [manager]);
```

### 4. Prefer Direct Store Access over useStore Hook

```tsx
// ✅ Good: Using manager for multiple operations
const manager = useUserStoreManager();
const profileStore = manager.getStore('profile');
const preferencesStore = manager.getStore('preferences');

// Perform multiple operations efficiently
profileStore.setValue(newProfile);
preferencesStore.update(preferences => ({ ...preferences, language: 'en' }));

// ❌ Less efficient: Multiple hook calls
const profileStore = useUserStore('profile');
const preferencesStore = useUserStore('preferences');
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