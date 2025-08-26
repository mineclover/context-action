# React Hooks

Context-Action provides React hooks for action dispatching and store management. This guide covers **how to use** the hooks with API examples and usage patterns.

## Related Guides

- 🔄 **[Hooks Lifecycle](./hooks-lifecycle.md)** - How hooks work internally (lifecycle, cleanup, performance)
- 📚 **[Hooks Reference](/en/concept/hooks-reference)** - Complete catalog of all available hooks
- ✅ **[Best Practices](../best-practices.md)** - Coding patterns and conventions

## Essential Hooks

These are the core hooks you'll use most frequently.

### Action Hooks

#### `createActionContext<T>()`
Factory function that creates all action-related hooks.

```tsx
import { createActionContext } from '@context-action/react';

interface UserActions {
  updateProfile: { name: string; email: string };
  logout: void;
}

const { 
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');
```

#### `useActionDispatch()`
Primary hook for dispatching actions to handlers.

```tsx
function UserComponent() {
  const dispatch = useUserAction();
  
  const handleUpdate = () => {
    dispatch('updateProfile', { 
      name: 'John Doe', 
      email: 'john@example.com' 
    });
  };
  
  return <button onClick={handleUpdate}>Update Profile</button>;
}
```

#### `useActionHandler()`
Primary hook for registering action handlers.

```tsx
function UserComponent() {
  const dispatch = useUserAction();
  
  // Register handler for updateProfile action
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      await updateUserProfile(payload);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, []));
  
  return <div>User Profile Component</div>;
}
```

### Store Hooks

#### `createStoreContext<T>()`
Factory function that creates all store-related hooks.

```tsx
import { createStoreContext } from '@context-action/react';

const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createStoreContext('User', {
  profile: { initialValue: { id: '', name: '', email: '' } },
  settings: { initialValue: { theme: 'light', notifications: true } }
});
```

#### `useStoreValue<T>(store)`
Primary hook for subscribing to store changes.

```tsx
import { useStoreValue } from '@context-action/react';

function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
    </div>
  );
}
```

#### `useStore(name)`
Primary hook for accessing stores by name.

```tsx
function UserSettings() {
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings');
  
  const profile = useStoreValue(profileStore);
  const settings = useStoreValue(settingsStore);
  
  return (
    <div>
      <p>User: {profile.name}</p>
      <p>Theme: {settings.theme}</p>
    </div>
  );
}
```

## Utility Hooks

Additional hooks for advanced scenarios.

### Store Management

#### `useStoreManager()`
Hook for updating stores programmatically.

```tsx
function UserManager() {
  const { updateStore, resetStore } = useUserStoreManager();
  
  const updateUserName = (newName: string) => {
    updateStore('profile', prevProfile => ({
      ...prevProfile,
      name: newName
    }));
  };
  
  const resetProfile = () => {
    resetStore('profile');
  };
  
  return (
    <div>
      <button onClick={() => updateUserName('New Name')}>
        Update Name
      </button>
      <button onClick={resetProfile}>
        Reset Profile
      </button>
    </div>
  );
}
```

### Advanced Action Hooks

#### `useActionDispatchWithResult()`
Hook that provides both dispatch and result collection capabilities.

```tsx
function AdvancedUserComponent() {
  const { 
    dispatch, 
    dispatchWithResult, 
    abortAll 
  } = useActionDispatchWithResult();
  
  const handleAsyncAction = async () => {
    try {
      const result = await dispatchWithResult('updateProfile', {
        name: 'John',
        email: 'john@example.com'
      });
      
      if (result.success) {
        console.log('All handlers completed successfully');
      } else {
        console.error('Some handlers failed:', result.errors);
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleAsyncAction}>
        Update with Result
      </button>
      <button onClick={abortAll}>
        Abort All Actions
      </button>
    </div>
  );
}
```

## Usage Guidelines

### Best Practices

1. **Use useCallback for handlers** (see [Lifecycle Guide](/en/guide/hooks-lifecycle) for details):
```tsx
useUserActionHandler('updateProfile', useCallback(async (payload) => {
  // Handler logic
}, [])); // Empty deps for stable handler
```

2. **Combine patterns when needed**:
```tsx
function App() {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <UserComponent />
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

3. **Type-safe store access**:
```tsx
const profileStore = useUserStore('profile'); // Type-safe
const profile = useStoreValue(profileStore);   // Type-safe
```

### Quick Performance Notes

- Store subscriptions are optimized for minimal re-renders
- Handler registration uses stable references
- Action dispatching is automatically memoized

For detailed lifecycle understanding, see [Hooks Lifecycle Guide](/en/guide/hooks-lifecycle).