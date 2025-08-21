# Store Basic Usage

Fundamental Store Only pattern with excellent type inference and simplified API.

## Import
```typescript
import { createDeclarativeStorePattern } from '@context-action/react';
```

## Key Features
- ✅ Excellent type inference without manual type annotations
- ✅ Simplified API focused on store management
- ✅ Direct value or configuration object support
- ✅ No need for separate `createStore` calls

## Basic Usage

### Option 1: Type Inference (Recommended)
```tsx
// 1. Define stores with renaming pattern for type-safe access
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  // Simple direct values - cleanest syntax
  counter: 0,
  userName: '',
  isLoggedIn: false,
  
  // With configuration for complex types
  user: {
    initialValue: { id: '', name: '', email: '' },
    strategy: 'shallow',
    description: 'User profile data'
  },
  
  // Nested structures with type safety
  settings: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      language: 'en',
      notifications: true
    },
    strategy: 'shallow'
  }
});
```

### Option 2: Explicit Generic Types
```tsx
// 1. Define store types explicitly
interface AppStoreTypes {
  counter: number;
  userName: string;
  isLoggedIn: boolean;
  user: { id: string; name: string; email: string };
  settings: { theme: 'light' | 'dark'; language: string; notifications: boolean };
}

// 2. Create stores with explicit types
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern<AppStoreTypes>('App', {
  // Types validated against AppStoreTypes interface
  counter: 0,  // Must match AppStoreTypes['counter'] = number
  userName: '', // Must match AppStoreTypes['userName'] = string
  isLoggedIn: false,
  
  // Complex types with configuration
  user: { id: '', name: '', email: '' },
  settings: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    strategy: 'shallow'
  }
});
```

## Provider Setup

```tsx
function App() {
  return (
    <AppStoreProvider>
      <UserProfile />
      <Settings />
    </AppStoreProvider>
  );
}
```

## Component Usage

```tsx
function UserProfile() {
  // Perfect type inference - no manual type annotations needed!
  const counterStore = useAppStore('counter');      // Store<number>
  const userStore = useAppStore('user');           // Store<{id: string, name: string, email: string}>
  const settingsStore = useAppStore('settings');   // Store<{theme: 'light' | 'dark', language: string, notifications: boolean}>
  
  // Subscribe to values
  const counter = useStoreValue(counterStore);
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  const incrementCounter = () => {
    counterStore.setValue(counter + 1);
  };
  
  const updateUser = () => {
    userStore.setValue({
      ...user,
      name: 'John Doe',
      email: 'john@example.com'
    });
  };
  
  const toggleTheme = () => {
    settingsStore.setValue({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light'
    });
  };
  
  return (
    <div data-theme={settings.theme}>
      <div>Counter: {counter}</div>
      <div>User: {user.name} ({user.email})</div>
      <div>Theme: {settings.theme}</div>
      
      <button onClick={incrementCounter}>+1</button>
      <button onClick={updateUser}>Update User</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Available Hooks
- `useStore(name)` - Get typed store by name (primary API)
- `useStoreManager()` - Access store manager (advanced use)
- `useStoreInfo()` - Get registry information
- `useStoreClear()` - Clear all stores

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
// ✅ Good - Functional update pattern
const updateUser = useCallback(() => {
  userStore.setValue(prev => ({
    ...prev,
    name: 'Updated Name',
    updatedAt: Date.now()
  }));
}, [userStore]);

// ✅ Good - Only subscribe to needed stores
const userName = useStoreValue(useAppStore('user')); // Only subscribes to user changes
// Don't subscribe to all stores if you only need one value
```