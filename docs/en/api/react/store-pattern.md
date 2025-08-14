# Store Pattern API

The Store Pattern provides type-safe state management through the `createDeclarativeStorePattern` function, offering excellent type inference and simplified API focused on reactive state management.

## Import

```typescript
import { createDeclarativeStorePattern, useStoreValue } from '@context-action/react';
```

## createDeclarativeStorePattern

### `createDeclarativeStorePattern<T>(name, config)`

Creates a complete Store Pattern with Provider, hooks, and store management capabilities.

**Type Parameters:**
- `T` - Store configuration object with store definitions

**Parameters:**
- `name: string` - Pattern name for debugging and identification
- `config: T` - Store configuration object

**Returns:** `StorePatternResult<T>`

```typescript
interface StorePatternResult<T> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useStore: <K extends keyof T>(key: K) => Store<InferStoreValue<T[K]>>;
  useStoreManager: () => StoreManager<T>;
  withProvider: (Component: React.ComponentType) => React.ComponentType;
}
```

## Store Configuration

### Direct Value Configuration

```typescript
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  // Direct value - type inferred automatically
  profile: { name: '', email: '', avatar: '' },
  preferences: { theme: 'light', language: 'en' },
  settings: { notifications: true, privacy: 'public' }
});
```

### Configuration Object Support

```typescript
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager
} = createDeclarativeStorePattern('App', {
  // Configuration with initialValue
  user: {
    initialValue: { id: '', name: '', email: '', isAuthenticated: false }
  },
  
  // Configuration with validator
  preferences: {
    initialValue: { theme: 'light', language: 'en' },
    validator: (value) => 
      typeof value === 'object' && 
      'theme' in value && 
      'language' in value
  },
  
  // Configuration with derived state
  analytics: {
    initialValue: { events: [], sessionId: '' },
    derived: {
      eventCount: (analytics) => analytics.events.length,
      hasEvents: (analytics) => analytics.events.length > 0
    }
  }
});
```

## Provider Component

### `<Provider>`

Context provider that manages store instances and provides store capabilities to child components.

**Props:**
- `children: React.ReactNode` - Child components

```typescript
function App() {
  return (
    <UserStoreProvider>
      <UserProfile />
      <UserSettings />
    </UserStoreProvider>
  );
}
```

### `withProvider(Component)`

Higher-Order Component that automatically wraps a component with the store provider.

**Parameters:**
- `Component: React.ComponentType` - Component to wrap

**Returns:** `React.ComponentType` - Wrapped component

```typescript
// Manual provider wrapping
function App() {
  return (
    <UserStoreProvider>
      <UserComponent />
    </UserStoreProvider>
  );
}

// HOC pattern (recommended)
const App = withUserStoreProvider(() => (
  <UserComponent />
));
```

## Store Access Hook

### `useStore(key)`

Access a specific store instance from the pattern.

**Parameters:**
- `key: keyof T` - Store key from configuration

**Returns:** `Store<StoreValue>` - Store instance

```typescript
function UserComponent() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // Store instances provide getValue, setValue, update methods
  const profile = profileStore.getValue();
  
  return <div>{profile.name}</div>;
}
```

## Store Instance Methods

### `getValue()`

Get current store value (non-reactive).

**Returns:** `StoreValue` - Current value

```typescript
const profileStore = useUserStore('profile');
const currentProfile = profileStore.getValue();
// { name: '', email: '', avatar: '' }
```

### `setValue(value)`

Set new store value completely.

**Parameters:**
- `value: StoreValue` - New value

**Returns:** `void`

```typescript
profileStore.setValue({
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg'
});
```

### `update(updater)`

Update store value using updater function.

**Parameters:**
- `updater: (current: StoreValue) => StoreValue` - Update function

**Returns:** `void`

```typescript
// Partial update
profileStore.update(current => ({
  ...current,
  name: 'John Doe Updated'
}));

// Conditional update
preferencesStore.update(current => ({
  ...current,
  theme: current.theme === 'light' ? 'dark' : 'light'
}));
```

## Reactive Subscriptions

### `useStoreValue(store)`

Subscribe to store changes and get reactive updates.

**Parameters:**
- `store: Store<T>` - Store instance from `useStore()`

**Returns:** `T` - Current store value (reactive)

```typescript
function UserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // Reactive subscriptions - components re-render on changes
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  const updateProfile = () => {
    profileStore.setValue({
      ...profile,
      name: 'Updated Name'
    });
    // Component automatically re-renders with new name
  };
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>Theme: {preferences.theme}</p>
      <button onClick={updateProfile}>Update</button>
    </div>
  );
}
```

## Store Manager

### `useStoreManager()`

Access the store manager for pattern-wide operations.

**Returns:** `StoreManager<T>` - Store manager instance

```typescript
interface StoreManager<T> {
  reset(key: keyof T): void;
  resetAll(): void;
  getAllValues(): { [K in keyof T]: InferStoreValue<T[K]> };
  getStore<K extends keyof T>(key: K): Store<InferStoreValue<T[K]>>;
}
```

### Store Manager Methods

#### `reset(key)`

Reset a specific store to its initial value.

**Parameters:**
- `key: keyof T` - Store key to reset

```typescript
function ResetComponent() {
  const storeManager = useUserStoreManager();
  
  const resetProfile = () => {
    storeManager.reset('profile');
    // profile store returns to: { name: '', email: '', avatar: '' }
  };
  
  return <button onClick={resetProfile}>Reset Profile</button>;
}
```

#### `resetAll()`

Reset all stores to their initial values.

```typescript
const resetAllStores = () => {
  storeManager.resetAll();
  // All stores return to initial values
};
```

#### `getAllValues()`

Get current values from all stores (non-reactive).

**Returns:** Object with all current store values

```typescript
const storeManager = useUserStoreManager();

const logAllValues = () => {
  const values = storeManager.getAllValues();
  console.log(values);
  // {
  //   profile: { name: 'John', email: 'john@example.com', avatar: '' },
  //   preferences: { theme: 'dark', language: 'en' },
  //   settings: { notifications: true, privacy: 'private' }
  // }
};
```

#### `getStore(key)`

Get store instance directly from manager.

**Parameters:**
- `key: keyof T` - Store key

**Returns:** `Store<StoreValue>` - Store instance

```typescript
function UtilityComponent() {
  const storeManager = useUserStoreManager();
  
  const updateProfileFromManager = () => {
    const profileStore = storeManager.getStore('profile');
    profileStore.setValue({ name: 'Manager Update', email: '', avatar: '' });
  };
  
  return <button onClick={updateProfileFromManager}>Update via Manager</button>;
}
```

## Advanced Patterns

### Derived State

```typescript
const { useStore } = createDeclarativeStorePattern('Analytics', {
  events: {
    initialValue: [] as Array<{ type: string; timestamp: number }>,
    derived: {
      // Computed properties updated automatically
      eventCount: (events) => events.length,
      recentEvents: (events) => events.filter(e => 
        Date.now() - e.timestamp < 300000 // Last 5 minutes
      ),
      hasRecentActivity: (events) => 
        events.some(e => Date.now() - e.timestamp < 60000) // Last minute
    }
  }
});

function AnalyticsComponent() {
  const eventsStore = useAnalyticsStore('events');
  const events = useStoreValue(eventsStore);
  
  // Access derived state
  console.log(events.eventCount);      // Computed count
  console.log(events.recentEvents);    // Filtered events
  console.log(events.hasRecentActivity); // Boolean flag
}
```

### Store Validation

```typescript
const { useStore } = createDeclarativeStorePattern('Settings', {
  config: {
    initialValue: { apiUrl: '', timeout: 5000, retries: 3 },
    validator: (value) => {
      if (typeof value !== 'object') return false;
      if (!value.apiUrl || typeof value.apiUrl !== 'string') return false;
      if (typeof value.timeout !== 'number' || value.timeout < 1000) return false;
      if (typeof value.retries !== 'number' || value.retries < 0) return false;
      return true;
    }
  }
});

function ConfigComponent() {
  const configStore = useSettingsStore('config');
  
  const updateConfig = () => {
    try {
      configStore.setValue({
        apiUrl: 'https://api.example.com',
        timeout: 3000,
        retries: 5
      }); // ✅ Passes validation
    } catch (error) {
      console.error('Invalid config:', error);
    }
  };
}
```

### Multi-Store Coordination

```typescript
function UserDashboard() {
  const userStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  const settingsStore = useUserStore('settings');
  
  const user = useStoreValue(userStore);
  const preferences = useStoreValue(preferencesStore);
  const settings = useStoreValue(settingsStore);
  
  const updateUserTheme = (newTheme: 'light' | 'dark') => {
    // Update preferences
    preferencesStore.update(current => ({
      ...current,
      theme: newTheme
    }));
    
    // Update settings based on theme
    settingsStore.update(current => ({
      ...current,
      contrast: newTheme === 'dark' ? 'high' : 'normal'
    }));
  };
  
  return (
    <div className={`theme-${preferences.theme}`}>
      <h1>Welcome, {user.name}</h1>
      <button onClick={() => updateUserTheme('dark')}>
        Switch to Dark Mode
      </button>
    </div>
  );
}
```

## Best Practices

### When to Use Store Pattern

✅ **Ideal for:**
- Application state management
- Form state and UI state
- Data caching and persistence
- Derived state and computed values

❌ **Avoid for:**
- Complex business logic (use Action Pattern)
- Side effects and API calls (use Action Pattern)
- Event handling and analytics (use Action Pattern)

### Performance Optimization

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(function ExpensiveComponent() {
  const dataStore = useAppStore('largeDataset');
  const data = useStoreValue(dataStore);
  
  // Expensive computation
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// Selective subscriptions for large objects
function OptimizedComponent() {
  const userStore = useAppStore('user');
  const user = useStoreValue(userStore);
  
  // Only re-render when name changes
  const userName = useMemo(() => user.name, [user.name]);
  
  return <h1>{userName}</h1>;
}
```

## Examples

See the [Store Only Pattern Example](../../examples/store-only) for complete working examples.

## Related

- **[Store Manager API](./store-manager)** - Store management utilities
- **[Action Context API](./action-context)** - Action Only pattern
- **[Main Patterns Guide](../../guide/patterns)** - Pattern usage guide
- **[Basic Setup Example](../../examples/basic-setup)** - Complete integration example