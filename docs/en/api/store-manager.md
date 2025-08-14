# Store Manager API

Complete API reference for the Store Manager object returned by `useStoreManager()`.

## Overview

The Store Manager provides advanced operations for managing multiple stores within a Declarative Store Pattern context. It offers bulk operations, state export/import, and administrative controls.

## Core Methods

### `storeManager.getStore(storeName)`

Gets a specific store instance by name.

**Parameters:**
- `storeName`: Key of the store from configuration

**Returns:** Store instance

```typescript
function AdminComponent() {
  const storeManager = useStoreManager();
  
  const userStore = storeManager.getStore('user');
  const settingsStore = storeManager.getStore('settings');
  
  // Use stores directly
  const currentUser = userStore.getValue();
  settingsStore.setValue({ theme: 'dark', language: 'en' });
}
```

### `storeManager.getAllStores()`

Gets all store instances as a map.

**Returns:** `Map<string, Store<any>>`

```typescript
function StoreInspector() {
  const storeManager = useStoreManager();
  
  const inspectAllStores = () => {
    const stores = storeManager.getAllStores();
    
    for (const [name, store] of stores) {
      console.log(`Store ${name}:`, store.getValue());
    }
  };
  
  return <button onClick={inspectAllStores}>Inspect Stores</button>;
}
```

### `storeManager.resetStore(storeName)`

Resets a specific store to its initial value.

**Parameters:**
- `storeName`: Key of the store to reset

**Returns:** `void`

```typescript
function ResetControls() {
  const storeManager = useStoreManager();
  
  const resetUser = () => {
    storeManager.resetStore('user');
    console.log('User store reset to initial state');
  };
  
  return <button onClick={resetUser}>Reset User</button>;
}
```

### `storeManager.resetAll()`

Resets all stores to their initial values.

**Returns:** `void`

```typescript
function GlobalReset() {
  const storeManager = useStoreManager();
  
  const resetApplication = () => {
    if (confirm('Reset all application data?')) {
      storeManager.resetAll();
      console.log('All stores reset to initial state');
    }
  };
  
  return <button onClick={resetApplication}>Reset All Data</button>;
}
```

## State Management

### `storeManager.exportState()`

Exports the current state of all stores.

**Returns:** Object with all store values

```typescript
function StateExporter() {
  const storeManager = useStoreManager();
  
  const exportToJson = () => {
    const state = storeManager.exportState();
    const json = JSON.stringify(state, null, 2);
    
    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-state.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return <button onClick={exportToJson}>Export State</button>;
}
```

### `storeManager.importState(state)`

Imports state data to all stores.

**Parameters:**
- `state`: Object containing store values

**Returns:** `void`

```typescript
function StateImporter() {
  const storeManager = useStoreManager();
  
  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string);
        storeManager.importState(state);
        console.log('State imported successfully');
      } catch (error) {
        console.error('Failed to import state:', error);
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div>
      <input type="file" accept=".json" onChange={importFromFile} />
      <label>Import State from JSON</label>
    </div>
  );
}
```

### `storeManager.getStoreNames()`

Gets the names of all available stores.

**Returns:** `string[]`

```typescript
function StoreList() {
  const storeManager = useStoreManager();
  
  const storeNames = storeManager.getStoreNames();
  
  return (
    <div>
      <h3>Available Stores:</h3>
      <ul>
        {storeNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Operations

### Bulk Store Operations

```typescript
function BulkOperations() {
  const storeManager = useStoreManager();
  
  const resetUserRelatedStores = () => {
    const userStores = ['user', 'userPreferences', 'userSettings'];
    
    userStores.forEach(storeName => {
      if (storeManager.getStoreNames().includes(storeName)) {
        storeManager.resetStore(storeName);
      }
    });
  };
  
  const exportUserData = () => {
    const fullState = storeManager.exportState();
    const userData = {
      user: fullState.user,
      userPreferences: fullState.userPreferences,
      userSettings: fullState.userSettings
    };
    
    return userData;
  };
  
  return (
    <div>
      <button onClick={resetUserRelatedStores}>Reset User Data</button>
      <button onClick={() => console.log(exportUserData())}>Export User Data</button>
    </div>
  );
}
```

### Store Validation

```typescript
function StoreValidator() {
  const storeManager = useStoreManager();
  
  const validateAllStores = () => {
    const stores = storeManager.getAllStores();
    const validation = {
      valid: true,
      errors: [] as string[]
    };
    
    for (const [name, store] of stores) {
      const value = store.getValue();
      
      // Custom validation logic
      if (!validateStoreValue(name, value)) {
        validation.valid = false;
        validation.errors.push(`Store ${name} has invalid value`);
      }
    }
    
    return validation;
  };
  
  const fixInvalidStores = () => {
    const validation = validateAllStores();
    
    if (!validation.valid) {
      console.warn('Invalid stores found:', validation.errors);
      
      // Reset invalid stores
      validation.errors.forEach(error => {
        const storeName = error.match(/Store (\w+)/)?.[1];
        if (storeName) {
          storeManager.resetStore(storeName);
        }
      });
    }
  };
  
  return (
    <div>
      <button onClick={() => console.log(validateAllStores())}>
        Validate Stores
      </button>
      <button onClick={fixInvalidStores}>
        Fix Invalid Stores
      </button>
    </div>
  );
}
```

### Store Synchronization

```typescript
function StoreSynchronizer() {
  const storeManager = useStoreManager();
  
  const syncToLocalStorage = () => {
    const state = storeManager.exportState();
    localStorage.setItem('app-state', JSON.stringify(state));
  };
  
  const syncFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('app-state');
      if (saved) {
        const state = JSON.parse(saved);
        storeManager.importState(state);
      }
    } catch (error) {
      console.error('Failed to sync from localStorage:', error);
    }
  };
  
  // Auto-sync on state changes
  useEffect(() => {
    const stores = storeManager.getAllStores();
    const unsubscribers: (() => void)[] = [];
    
    // Subscribe to all store changes
    for (const [name, store] of stores) {
      const unsubscribe = store.subscribe(() => {
        // Debounce to avoid excessive saves
        debouncedSyncToLocalStorage();
      });
      unsubscribers.push(unsubscribe);
    }
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);
  
  return (
    <div>
      <button onClick={syncToLocalStorage}>Save to Local Storage</button>
      <button onClick={syncFromLocalStorage}>Load from Local Storage</button>
    </div>
  );
}
```

## Store Manager Utilities

### Store Statistics

```typescript
function StoreStatistics() {
  const storeManager = useStoreManager();
  
  const getStoreStats = () => {
    const stores = storeManager.getAllStores();
    const stats = {
      totalStores: stores.size,
      storeDetails: [] as Array<{
        name: string;
        hasValue: boolean;
        valueType: string;
        size: number;
      }>
    };
    
    for (const [name, store] of stores) {
      const value = store.getValue();
      stats.storeDetails.push({
        name,
        hasValue: value !== null && value !== undefined,
        valueType: typeof value,
        size: JSON.stringify(value).length
      });
    }
    
    return stats;
  };
  
  return (
    <div>
      <button onClick={() => console.table(getStoreStats().storeDetails)}>
        Show Store Statistics
      </button>
    </div>
  );
}
```

### Store Health Monitoring

```typescript
function StoreHealthMonitor() {
  const storeManager = useStoreManager();
  const [health, setHealth] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const checkHealth = () => {
      const stores = storeManager.getAllStores();
      const healthStatus: Record<string, boolean> = {};
      
      for (const [name, store] of stores) {
        try {
          const value = store.getValue();
          healthStatus[name] = value !== null && value !== undefined;
        } catch (error) {
          healthStatus[name] = false;
        }
      }
      
      setHealth(healthStatus);
    };
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    checkHealth(); // Initial check
    
    return () => clearInterval(interval);
  }, [storeManager]);
  
  return (
    <div className="store-health">
      <h3>Store Health Status</h3>
      {Object.entries(health).map(([storeName, isHealthy]) => (
        <div key={storeName} className={`health-item ${isHealthy ? 'healthy' : 'unhealthy'}`}>
          <span>{storeName}:</span>
          <span>{isHealthy ? '✅ Healthy' : '❌ Unhealthy'}</span>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

### Store Manager Error Recovery

```typescript
function StoreManagerErrorHandler() {
  const storeManager = useStoreManager();
  
  const handleStoreError = (storeName: string, error: Error) => {
    console.error(`Store ${storeName} error:`, error);
    
    // Try to recover by resetting the store
    try {
      storeManager.resetStore(storeName);
      console.log(`Store ${storeName} reset successfully`);
    } catch (resetError) {
      console.error(`Failed to reset store ${storeName}:`, resetError);
    }
  };
  
  const safeStoreOperation = <T>(
    operation: () => T,
    storeName: string
  ): T | null => {
    try {
      return operation();
    } catch (error) {
      handleStoreError(storeName, error as Error);
      return null;
    }
  };
  
  return { safeStoreOperation };
}
```

## Related

- **[Store Only Methods](./store-only)** - Individual store methods
- **[Declarative Store Pattern](./declarative-store-pattern)** - Pattern implementation
- **[Store Only Example](../examples/store-only)** - Complete usage examples