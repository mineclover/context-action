# Store Basic Usage

Fundamental Store Only pattern with excellent type inference and simplified API.

## Import
```typescript
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserStoreManager } from '../setup/stores'; // From setup guide
```

## Key Features
- ✅ Excellent type inference without manual type annotations
- ✅ Simplified API focused on store management
- ✅ Direct value or configuration object support
- ✅ No need for separate `createStore` calls

## Prerequisites

For complete setup instructions including store definitions, context creation, and provider configuration, see **[Basic Store Setup](../setup/basic-store-setup.md)**.

This document demonstrates usage patterns using the store setup:
- Store definitions → [Type Inference Configurations](../setup/basic-store-setup.md#type-inference-configurations)
- Context creation → [Single Domain Store Context](../setup/basic-store-setup.md#single-domain-store-context)
- Provider setup → [Single Provider Setup](../setup/basic-store-setup.md#single-provider-setup)

## Usage Patterns

### Basic Store Access Pattern
```tsx
// Component implementation using configured stores from setup guide
function UserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  const updateProfile = () => {
    profileStore.setValue({ id: '1', name: 'John', email: 'john@example.com', role: 'user' });
  };
  
  const toggleTheme = () => {
    preferencesStore.update(prefs => ({
      ...prefs,
      theme: prefs.theme === 'light' ? 'dark' : 'light'
    }));
  };
  
  return (
    <div data-theme={preferences.theme}>
      <h2>{profile.name || 'Guest'}</h2>
      <p>Theme: {preferences.theme}</p>
      <button onClick={updateProfile}>Update Profile</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Explicit Generic Types Pattern
```tsx
// Using UserStores interface from setup guide for type validation
import type { UserStores } from '../setup/basic-store-setup';

// Create stores with explicit type control using UserStores specification
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createStoreContext<UserStores>('User', {
  // Types validated against UserStores interface
  profile: {
    initialValue: { id: '', name: '', email: '', role: 'guest' },
    strategy: 'shallow'
  },
  preferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    strategy: 'shallow'
  },
  session: {
    initialValue: { isAuthenticated: false, permissions: [], lastActivity: 0 },
    strategy: 'shallow'
  }
});
```

## Provider Setup

```tsx
// Using UserStoreProvider from setup guide
import { UserStoreProvider } from '../setup/stores';

function App() {
  return (
    <UserStoreProvider>
      <UserProfile />
      <Settings />
    </UserStoreProvider>
  );
}
```

## Component Usage

```tsx
function UserProfile() {
  // Perfect type inference - no manual type annotations needed!
  // Using renamed hooks from setup guide
  const profileStore = useUserStore('profile');      // Store<UserProfile>
  const preferencesStore = useUserStore('preferences'); // Store<UserPreferences>
  const sessionStore = useUserStore('session');      // Store<UserSession>
  
  // Subscribe to values
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  const session = useStoreValue(sessionStore);
  
  const updateProfile = () => {
    profileStore.setValue({
      ...profile,
      name: 'John Doe',
      email: 'john@example.com'
    });
  };
  
  const toggleTheme = () => {
    preferencesStore.setValue({
      ...preferences,
      theme: preferences.theme === 'light' ? 'dark' : 'light'
    });
  };
  
  const logout = () => {
    sessionStore.setValue({
      isAuthenticated: false,
      permissions: [],
      lastActivity: Date.now()
    });
  };
  
  return (
    <div data-theme={preferences.theme}>
      <div>User: {profile.name} ({profile.email})</div>
      <div>Role: {profile.role}</div>
      <div>Theme: {preferences.theme}</div>
      <div>Language: {preferences.language}</div>
      <div>Authenticated: {session.isAuthenticated ? 'Yes' : 'No'}</div>
      
      <button onClick={updateProfile}>Update Profile</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Available Hooks
- `useUserStore(name)` - Get typed user domain store by name (primary API)
- `useUserStoreManager()` - Access user store manager (advanced use)
- `useStoreInfo()` - Get registry information (from setup context)
- `useStoreClear()` - Clear all stores (from setup context)

## Real-World Examples

### Live Examples in Codebase
- **[Todo List Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx)** - Complete CRUD with filtering and sorting
- **[Chat Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx)** - Real-time message state management
- **[User Profile Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx)** - Profile data management
- **[Store Basics Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/store/StoreBasicsPage.tsx)** - Basic store operations
- **[React Provider Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/react/ReactProviderPage.tsx)** - Provider composition patterns
- **[Store Scenarios Index](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/stores/index.ts)** - Central store configuration

## Best Practices

1. **Use Type Inference**: Let TypeScript infer types automatically
2. **Direct Values**: Use direct values for simple types
3. **Configuration Objects**: Use configuration objects for complex types
4. **Domain Naming**: Use descriptive domain names for contexts
5. **Subscription Management**: Only subscribe to stores you actually need to prevent unnecessary re-renders

```typescript
// ✅ Good - Functional update pattern with renamed hooks
const updateProfile = useCallback(() => {
  const profileStore = useUserStore('profile');
  profileStore.update(prev => ({
    ...prev,
    name: 'Updated Name',
    email: 'updated@example.com'
  }));
}, []);

// ✅ Good - Only subscribe to needed stores using renamed hooks
const profileName = useStoreValue(useUserStore('profile')).name; // Only subscribes to profile changes
const currentTheme = useStoreValue(useUserStore('preferences')).theme; // Only theme updates
// Don't subscribe to all stores if you only need specific values
```