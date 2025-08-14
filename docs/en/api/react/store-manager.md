# Store Manager API

The Store Manager provides centralized management for all stores within a Store Pattern, offering utilities for reset operations, bulk operations, and store access.

## Overview

The Store Manager is accessed through the `useStoreManager()` hook and provides pattern-wide operations:

```typescript
function ManagementComponent() {
  const storeManager = useUserStoreManager();
  
  // Access to all store management operations
}
```

## Store Manager Interface

```typescript
interface StoreManager<T> {
  // Reset operations
  reset<K extends keyof T>(key: K): void;
  resetAll(): void;
  
  // Bulk operations
  getAllValues(): { [K in keyof T]: InferStoreValue<T[K]> };
  setAllValues(values: Partial<{ [K in keyof T]: InferStoreValue<T[K]> }>): void;
  
  // Store access
  getStore<K extends keyof T>(key: K): Store<InferStoreValue<T[K]>>;
  getStoreNames(): Array<keyof T>;
  
  // State management
  hasStore(key: keyof T): boolean;
  getStoreCount(): number;
}
```

## Reset Operations

### `reset(key)`

Reset a specific store to its initial value.

**Parameters:**
- `key: keyof T` - Store key to reset

**Returns:** `void`

```typescript
function UserProfileComponent() {
  const storeManager = useUserStoreManager();
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  const resetProfile = () => {
    storeManager.reset('profile');
    // profile store returns to initial value: { name: '', email: '', avatar: '' }
  };
  
  const resetPreferences = () => {
    storeManager.reset('preferences');
    // preferences store returns to initial value
  };
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <button onClick={resetProfile}>Reset Profile</button>
      <button onClick={resetPreferences}>Reset Preferences</button>
    </div>
  );
}
```

### `resetAll()`

Reset all stores in the pattern to their initial values.

**Returns:** `void`

```typescript
function AppResetComponent() {
  const storeManager = useUserStoreManager();
  
  const resetAllStores = () => {
    storeManager.resetAll();
    // All stores return to their initial values:
    // - profile: { name: '', email: '', avatar: '' }
    // - preferences: { theme: 'light', language: 'en' }
    // - settings: { notifications: true, privacy: 'public' }
  };
  
  const confirmReset = () => {
    if (confirm('Reset all user data?')) {
      resetAllStores();
    }
  };
  
  return (
    <div>
      <button onClick={confirmReset}>Reset All Data</button>
    </div>
  );
}
```

## Bulk Operations

### `getAllValues()`

Get current values from all stores (non-reactive snapshot).

**Returns:** `{ [K in keyof T]: StoreValue<T[K]> }` - Object with all current values

```typescript
function DebugComponent() {
  const storeManager = useUserStoreManager();
  
  const logAllValues = () => {
    const values = storeManager.getAllValues();
    console.log('Current state snapshot:', values);
    // {
    //   profile: { name: 'John Doe', email: 'john@example.com', avatar: '' },
    //   preferences: { theme: 'dark', language: 'en' },
    //   settings: { notifications: false, privacy: 'private' }
    // }
  };
  
  const exportState = () => {
    const state = storeManager.getAllValues();
    const dataStr = JSON.stringify(state, null, 2);
    downloadFile('user-state.json', dataStr);
  };
  
  return (
    <div>
      <button onClick={logAllValues}>Log State</button>
      <button onClick={exportState}>Export State</button>
    </div>
  );
}
```

### `setAllValues(values)`

Set multiple store values at once.

**Parameters:**
- `values: Partial<{ [K in keyof T]: StoreValue<T[K]> }>` - Object with store values to update

**Returns:** `void`

```typescript
function ImportComponent() {
  const storeManager = useUserStoreManager();
  
  const importState = (importedData: any) => {
    try {
      // Validate and import partial state
      storeManager.setAllValues({
        profile: {
          name: importedData.profile?.name || '',
          email: importedData.profile?.email || '',
          avatar: importedData.profile?.avatar || ''
        },
        preferences: {
          theme: importedData.preferences?.theme || 'light',
          language: importedData.preferences?.language || 'en'
        }
        // settings can be omitted - only specified stores are updated
      });
    } catch (error) {
      console.error('Import failed:', error);
    }
  };
  
  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const data = JSON.parse(event.target?.result as string);
            importState(data);
          };
          reader.readAsText(file);
        }
      }}
    />
  );
}
```

## Store Access

### `getStore(key)`

Get store instance directly from manager (alternative to `useStore`).

**Parameters:**
- `key: keyof T` - Store key

**Returns:** `Store<StoreValue>` - Store instance

```typescript
function AdvancedComponent() {
  const storeManager = useUserStoreManager();
  
  const bulkUpdate = () => {
    // Access multiple stores through manager
    const profileStore = storeManager.getStore('profile');
    const preferencesStore = storeManager.getStore('preferences');
    
    // Coordinated updates
    profileStore.update(profile => ({ ...profile, name: 'Bulk Updated' }));
    preferencesStore.update(prefs => ({ ...prefs, theme: 'light' }));
  };
  
  return <button onClick={bulkUpdate}>Bulk Update</button>;
}
```

### `getStoreNames()`

Get list of all store names in the pattern.

**Returns:** `Array<keyof T>` - Array of store keys

```typescript
function StoreListComponent() {
  const storeManager = useUserStoreManager();
  
  useEffect(() => {
    const storeNames = storeManager.getStoreNames();
    console.log('Available stores:', storeNames);
    // ['profile', 'preferences', 'settings']
  }, [storeManager]);
  
  return null;
}
```

## Utility Methods

### `hasStore(key)`

Check if a store exists in the pattern.

**Parameters:**
- `key: keyof T` - Store key to check

**Returns:** `boolean`

```typescript
const storeManager = useUserStoreManager();

const checkStore = (storeName: string) => {
  if (storeManager.hasStore(storeName as keyof UserStores)) {
    console.log(`Store ${storeName} exists`);
  } else {
    console.log(`Store ${storeName} not found`);
  }
};
```

### `getStoreCount()`

Get total number of stores in the pattern.

**Returns:** `number`

```typescript
function StoreStatsComponent() {
  const storeManager = useUserStoreManager();
  
  const storeCount = storeManager.getStoreCount();
  const storeNames = storeManager.getStoreNames();
  
  return (
    <div>
      <p>Total stores: {storeCount}</p>
      <p>Stores: {storeNames.join(', ')}</p>
    </div>
  );
}
```

## Real-World Usage Patterns

### State Persistence

```typescript
function StatePersistenceManager() {
  const storeManager = useUserStoreManager();
  
  // Auto-save to localStorage
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const currentState = storeManager.getAllValues();
      localStorage.setItem('userState', JSON.stringify(currentState));
    }, 5000); // Save every 5 seconds
    
    return () => clearInterval(saveInterval);
  }, [storeManager]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('userState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        storeManager.setAllValues(parsedState);
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, [storeManager]);
  
  return null;
}
```

### Store Synchronization

```typescript
function StoreSyncComponent() {
  const storeManager = useUserStoreManager();
  
  // Sync with external API
  const syncWithServer = async () => {
    try {
      const currentState = storeManager.getAllValues();
      
      // Send to server
      await api.saveUserState(currentState);
      
      // Get updated state from server
      const serverState = await api.getUserState();
      
      // Update local stores
      storeManager.setAllValues(serverState);
      
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={syncWithServer}>Sync with Server</button>
    </div>
  );
}
```

### Development Tools Integration

```typescript
function DevToolsComponent() {
  const storeManager = useUserStoreManager();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Expose store manager to window for debugging
      (window as any).storeManager = storeManager;
      
      console.log('Store Manager available at window.storeManager');
      console.log('Available methods:', Object.getOwnPropertyNames(storeManager));
    }
  }, [storeManager]);
  
  return null;
}

// Usage in browser console:
// window.storeManager.getAllValues()
// window.storeManager.reset('profile')
// window.storeManager.getStoreNames()
```

## Error Handling

### Validation Errors

```typescript
function SafeUpdateComponent() {
  const storeManager = useUserStoreManager();
  
  const safeUpdate = (storeName: keyof UserStores, newValue: any) => {
    try {
      const store = storeManager.getStore(storeName);
      store.setValue(newValue);
    } catch (error) {
      console.error(`Failed to update ${String(storeName)}:`, error);
      // Handle validation error or type mismatch
    }
  };
  
  return null;
}
```

### Store Access Errors

```typescript
function ErrorHandlingComponent() {
  const storeManager = useUserStoreManager();
  
  const safeStoreAccess = (storeName: string) => {
    if (storeManager.hasStore(storeName as keyof UserStores)) {
      const store = storeManager.getStore(storeName as keyof UserStores);
      return store.getValue();
    } else {
      console.warn(`Store ${storeName} does not exist`);
      return null;
    }
  };
  
  return null;
}
```

## Examples

See the [Store Only Pattern Example](../../examples/store-only) for complete Store Manager usage examples.

## Related

- **[Store Pattern API](./store-pattern)** - Store Pattern creation and usage
- **[Action Context API](./action-context)** - Action Only pattern
- **[Main Patterns Guide](../../guide/patterns)** - Pattern selection and best practices
- **[Store Integration Example](../../examples/pattern-composition)** - Advanced store coordination