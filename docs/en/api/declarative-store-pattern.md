# Declarative Store Pattern API

Complete API reference for the Declarative Store Pattern implementation, the recommended approach for type-safe state management.

## Overview

The Declarative Store Pattern provides excellent type inference without manual type annotations and a simplified API focused on store management. This is the recommended pattern for most state management scenarios.

## Pattern Creation

### `createDeclarativeStorePattern(contextName, storeConfig)`

Creates a declarative store pattern with automatic type inference.

**Parameters:**
- `contextName`: Unique identifier for the store context
- `storeConfig`: Store configuration with initial values and optional validators

**Returns:**
```typescript
{
  Provider: React.ComponentType<{ children: React.ReactNode }>,
  useStore: <K extends keyof T>(storeName: K) => Store<T[K]>,
  useStoreManager: () => StoreManager<T>,
  withProvider: (Component: React.ComponentType) => React.ComponentType
}
```

**Type Inference:**
The pattern automatically infers types from the configuration:

```typescript
// Configuration with automatic type inference
const { Provider, useStore, useStoreManager, withProvider } = 
  createDeclarativeStorePattern('App', {
    // Simple values - type inferred as string
    username: '',
    
    // Complex objects - type inferred automatically
    user: {
      id: '',
      name: '',
      email: '',
      isAuthenticated: false
    },
    
    // Arrays - type inferred with proper array types
    notifications: [] as Array<{ id: string; message: string; type: 'info' | 'warning' | 'error' }>,
    
    // With validator - type preserved
    settings: {
      initialValue: { theme: 'light' as 'light' | 'dark', fontSize: 14 },
      validator: (value): value is { theme: 'light' | 'dark'; fontSize: number } => {
        return typeof value === 'object' &&
          'theme' in value &&
          'fontSize' in value &&
          ['light', 'dark'].includes(value.theme) &&
          typeof value.fontSize === 'number';
      }
    }
  });

// TypeScript automatically knows:
// - useStore('username') returns Store<string>
// - useStore('user') returns Store<{ id: string; name: string; email: string; isAuthenticated: boolean }>
// - useStore('notifications') returns Store<Array<{ id: string; message: string; type: 'info' | 'warning' | 'error' }>>
// - useStore('settings') returns Store<{ theme: 'light' | 'dark'; fontSize: number }>
```

## Store Configuration Patterns

### Simple Value Configuration

Direct value assignment for primitive types:

```typescript
const simpleConfig = {
  // String type inferred
  title: 'My App',
  
  // Number type inferred
  counter: 0,
  
  // Boolean type inferred
  isLoading: false,
  
  // Null union type inferred
  selectedItem: null as string | null,
  
  // Array type inferred with explicit typing
  items: [] as Array<{ id: string; name: string }>
};

const { useStore } = createDeclarativeStorePattern('Simple', simpleConfig);

// TypeScript knows exact types:
const titleStore = useStore('title');      // Store<string>
const counterStore = useStore('counter');  // Store<number>
const itemsStore = useStore('items');      // Store<Array<{ id: string; name: string }>>
```

### Advanced Configuration

With validators and complex objects:

```typescript
const advancedConfig = {
  // Complex object with nested structure
  userProfile: {
    personal: {
      firstName: '',
      lastName: '',
      dateOfBirth: null as Date | null
    },
    contact: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        country: ''
      }
    },
    preferences: {
      notifications: true,
      theme: 'light' as 'light' | 'dark',
      language: 'en' as 'en' | 'es' | 'fr'
    }
  },
  
  // With validator for runtime validation
  appSettings: {
    initialValue: {
      maxRetries: 3,
      timeout: 5000,
      enableAnalytics: true
    },
    validator: (value): value is { maxRetries: number; timeout: number; enableAnalytics: boolean } => {
      return typeof value === 'object' &&
        typeof value.maxRetries === 'number' && value.maxRetries >= 0 &&
        typeof value.timeout === 'number' && value.timeout > 0 &&
        typeof value.enableAnalytics === 'boolean';
    }
  },
  
  // Computed initial values
  sessionInfo: {
    id: generateSessionId(),
    startTime: Date.now(),
    lastActivity: Date.now(),
    isActive: true
  }
};

const { useStore } = createDeclarativeStorePattern('Advanced', advancedConfig);
```

## Provider Pattern

### `Provider` Component

The context provider that makes stores available to child components.

```typescript
function App() {
  return (
    <Provider>
      <UserInterface />
      <DataLayer />
      <NotificationSystem />
    </Provider>
  );
}
```

### `withProvider(Component)` HOC

Higher-order component that automatically wraps a component with the provider.

**Parameters:**
- `Component`: React component to wrap

**Returns:** Wrapped component with provider

```typescript
// Manual provider wrapping
function ManualApp() {
  return (
    <Provider>
      <UserInterface />
    </Provider>
  );
}

// Automatic provider wrapping with HOC
const AutoApp = withProvider(() => (
  <UserInterface />
));

// Both approaches are equivalent
export default AutoApp;
```

## Store Type Safety

### Type Inference Examples

```typescript
const config = {
  // Primitives
  userName: 'john',           // Store<string>
  age: 25,                   // Store<number>
  isActive: true,            // Store<boolean>
  
  // Objects
  profile: {                 // Store<{ name: string; email: string }>
    name: 'John Doe',
    email: 'john@example.com'
  },
  
  // Arrays with explicit typing
  tags: [] as string[],      // Store<string[]>
  
  // Complex arrays
  items: [] as Array<{       // Store<Array<{ id: string; title: string; completed: boolean }>>
    id: string;
    title: string;
    completed: boolean;
  }>,
  
  // Union types
  status: 'idle' as 'idle' | 'loading' | 'success' | 'error',  // Store<'idle' | 'loading' | 'success' | 'error'>
  
  // Optional properties
  selectedId: null as string | null,  // Store<string | null>
  
  // Date objects
  lastUpdated: new Date(),   // Store<Date>
  
  // Generic objects
  metadata: {} as Record<string, any>  // Store<Record<string, any>>
};

function TypeSafeComponent() {
  // All these have perfect type inference
  const userNameStore = useStore('userName');        // Store<string>
  const profileStore = useStore('profile');          // Store<{ name: string; email: string }>
  const statusStore = useStore('status');            // Store<'idle' | 'loading' | 'success' | 'error'>
  
  // Values are properly typed
  const userName = useStoreValue(userNameStore);     // string
  const profile = useStoreValue(profileStore);       // { name: string; email: string }
  const status = useStoreValue(statusStore);         // 'idle' | 'loading' | 'success' | 'error'
  
  // Store methods are type-safe
  userNameStore.setValue('newName');                 // ✅ string
  // userNameStore.setValue(123);                    // ❌ TypeScript error
  
  profileStore.update(current => ({                  // ✅ Proper object structure
    ...current,
    name: 'Updated Name'
  }));
  
  statusStore.setValue('loading');                   // ✅ Valid union value
  // statusStore.setValue('invalid');               // ❌ TypeScript error
  
  return <div>Type-safe component</div>;
}
```

## Store Configuration Validation

### Runtime Validation

```typescript
const validatedConfig = {
  userSettings: {
    initialValue: {
      theme: 'light' as 'light' | 'dark',
      fontSize: 14,
      notifications: true
    },
    validator: (value): value is { theme: 'light' | 'dark'; fontSize: number; notifications: boolean } => {
      return typeof value === 'object' &&
        value !== null &&
        'theme' in value &&
        'fontSize' in value &&
        'notifications' in value &&
        ['light', 'dark'].includes(value.theme) &&
        typeof value.fontSize === 'number' &&
        value.fontSize >= 8 && value.fontSize <= 32 &&
        typeof value.notifications === 'boolean';
    }
  },
  
  apiConfiguration: {
    initialValue: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3
    },
    validator: (value): value is { baseUrl: string; timeout: number; retries: number } => {
      return typeof value === 'object' &&
        value !== null &&
        'baseUrl' in value &&
        'timeout' in value &&
        'retries' in value &&
        typeof value.baseUrl === 'string' &&
        value.baseUrl.startsWith('https://') &&
        typeof value.timeout === 'number' &&
        value.timeout > 0 &&
        typeof value.retries === 'number' &&
        value.retries >= 0;
    }
  }
};

function ValidatedStoreUsage() {
  const settingsStore = useStore('userSettings');
  
  const updateTheme = (newTheme: 'light' | 'dark') => {
    try {
      settingsStore.update(current => ({
        ...current,
        theme: newTheme
      }));
      console.log('Theme updated successfully');
    } catch (error) {
      console.error('Theme update failed validation:', error);
      // Handle validation error
    }
  };
  
  return <button onClick={() => updateTheme('dark')}>Dark Theme</button>;
}
```

## Advanced Store Patterns

### Computed Store Values

```typescript
function ComputedValues() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  
  const user = useStoreValue(userStore);
  const settings = useStoreValue(settingsStore);
  
  // Computed values with proper typing
  const displayName = useMemo(() => {
    return user.name || user.email?.split('@')[0] || 'Anonymous';
  }, [user.name, user.email]);
  
  const themeClass = useMemo(() => {
    return `theme-${settings.theme}`;
  }, [settings.theme]);
  
  const userStatus = useMemo(() => {
    if (!user.isAuthenticated) return 'guest';
    if (user.isAdmin) return 'admin';
    return 'user';
  }, [user.isAuthenticated, user.isAdmin]);
  
  return (
    <div className={themeClass}>
      <span>Welcome {displayName} ({userStatus})</span>
    </div>
  );
}
```

### Store Relationships

```typescript
function RelatedStores() {
  const userStore = useStore('user');
  const preferencesStore = useStore('preferences');
  const cacheStore = useStore('cache');
  
  // Sync user changes to preferences
  useEffect(() => {
    return userStore.subscribe((newUser, previousUser) => {
      if (newUser.id !== previousUser?.id) {
        // User changed - load their preferences
        preferencesStore.setValue({
          theme: newUser.preferredTheme || 'light',
          language: newUser.language || 'en',
          notifications: newUser.notificationsEnabled ?? true
        });
      }
    });
  }, [userStore, preferencesStore]);
  
  // Cache user data
  useEffect(() => {
    return userStore.subscribe((newUser) => {
      cacheStore.update(cache => ({
        ...cache,
        lastUser: newUser,
        lastUserUpdate: Date.now()
      }));
    });
  }, [userStore, cacheStore]);
  
  return null;
}
```

### Store Persistence

```typescript
function PersistentStores() {
  const storeManager = useStoreManager();
  
  // Save to localStorage on changes
  useEffect(() => {
    const persistentStores = ['user', 'settings', 'preferences'];
    const unsubscribers: (() => void)[] = [];
    
    persistentStores.forEach(storeName => {
      const store = storeManager.getStore(storeName);
      
      const unsubscribe = store.subscribe((newValue) => {
        try {
          localStorage.setItem(`store_${storeName}`, JSON.stringify(newValue));
        } catch (error) {
          console.error(`Failed to persist store ${storeName}:`, error);
        }
      });
      
      unsubscribers.push(unsubscribe);
    });
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [storeManager]);
  
  // Load from localStorage on mount
  useEffect(() => {
    const persistentStores = ['user', 'settings', 'preferences'];
    
    persistentStores.forEach(storeName => {
      try {
        const saved = localStorage.getItem(`store_${storeName}`);
        if (saved) {
          const value = JSON.parse(saved);
          const store = storeManager.getStore(storeName);
          store.setValue(value);
        }
      } catch (error) {
        console.error(`Failed to load store ${storeName}:`, error);
      }
    });
  }, [storeManager]);
  
  return null;
}
```

## React Integration Patterns

### Component Pattern Integration

```typescript
// Define store configuration
const appStoreConfig = {
  todos: [] as Array<{
    id: string;
    text: string;
    completed: boolean;
    createdAt: Date;
  }>,
  
  filter: 'all' as 'all' | 'active' | 'completed',
  
  ui: {
    loading: false,
    error: null as string | null,
    editingId: null as string | null
  }
};

const {
  Provider: TodoStoreProvider,
  useStore: useTodoStore,
  useStoreManager: useTodoStoreManager,
  withProvider: withTodoStoreProvider
} = createDeclarativeStorePattern('TodoApp', appStoreConfig);

// Component using the pattern
const TodoApp = withTodoStoreProvider(() => {
  return (
    <div className="todo-app">
      <TodoHeader />
      <TodoList />
      <TodoFooter />
    </div>
  );
});

function TodoList() {
  const todosStore = useTodoStore('todos');
  const filterStore = useTodoStore('filter');
  const uiStore = useTodoStore('ui');
  
  const todos = useStoreValue(todosStore);
  const filter = useStoreValue(filterStore);
  const ui = useStoreValue(uiStore);
  
  // Filtered todos with proper typing
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active': return todos.filter(todo => !todo.completed);
      case 'completed': return todos.filter(todo => todo.completed);
      default: return todos;
    }
  }, [todos, filter]);
  
  const addTodo = (text: string) => {
    todosStore.update(current => [...current, {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date()
    }]);
  };
  
  const toggleTodo = (id: string) => {
    todosStore.update(current => 
      current.map(todo => 
        todo.id === id 
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };
  
  const removeTodo = (id: string) => {
    todosStore.update(current => current.filter(todo => todo.id !== id));
  };
  
  return (
    <div className="todo-list">
      {filteredTodos.map(todo => (
        <TodoItem 
          key={todo.id}
          todo={todo}
          onToggle={() => toggleTodo(todo.id)}
          onRemove={() => removeTodo(todo.id)}
        />
      ))}
    </div>
  );
}
```

### Store Manager Integration

```typescript
function TodoManager() {
  const storeManager = useTodoStoreManager();
  
  const exportTodos = () => {
    const state = storeManager.exportState();
    const todoData = {
      todos: state.todos,
      filter: state.filter,
      exportedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(todoData, null, 2);
    downloadAsFile(json, 'todos.json');
  };
  
  const importTodos = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.todos && Array.isArray(data.todos)) {
          const todosStore = storeManager.getStore('todos');
          todosStore.setValue(data.todos);
          
          if (data.filter) {
            const filterStore = storeManager.getStore('filter');
            filterStore.setValue(data.filter);
          }
        }
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
  };
  
  const clearAllData = () => {
    if (confirm('Clear all todos?')) {
      storeManager.resetAll();
    }
  };
  
  return (
    <div className="todo-manager">
      <button onClick={exportTodos}>Export Todos</button>
      <input 
        type="file" 
        accept=".json" 
        onChange={(e) => e.target.files?.[0] && importTodos(e.target.files[0])} 
      />
      <button onClick={clearAllData}>Clear All</button>
    </div>
  );
}
```

## Performance Optimization

### Selective Re-rendering

```typescript
function OptimizedComponent() {
  const userStore = useStore('user');
  
  // Only re-render when name changes
  const userName = useStoreValue(userStore, user => user.name);
  
  // Only re-render when authentication status changes
  const isAuthenticated = useStoreValue(userStore, user => user.isAuthenticated);
  
  // Memoized expensive computation
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(userName);
  }, [userName]);
  
  return (
    <div>
      {isAuthenticated ? (
        <span>Welcome {userName}</span>
      ) : (
        <span>Please log in</span>
      )}
      <div>Computed: {expensiveValue}</div>
    </div>
  );
}
```

### Batched Updates

```typescript
function BatchedUpdater() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');
  const uiStore = useStore('ui');
  
  const updateUserProfile = (profileData: any) => {
    // Batch multiple store updates
    const updates = [
      () => userStore.update(current => ({
        ...current,
        ...profileData,
        lastUpdated: Date.now()
      })),
      () => settingsStore.update(current => ({
        ...current,
        lastProfileUpdate: Date.now()
      })),
      () => uiStore.update(current => ({
        ...current,
        notification: {
          message: 'Profile updated successfully',
          type: 'success' as const
        }
      }))
    ];
    
    // Execute all updates
    updates.forEach(update => update());
  };
  
  return (
    <button onClick={() => updateUserProfile({ name: 'New Name' })}>
      Update Profile
    </button>
  );
}
```

## Advanced Type Patterns

### Conditional Store Types

```typescript
// Configuration with conditional types
const conditionalConfig = {
  // Different shapes based on user type
  userData: null as {
    type: 'guest';
    sessionId: string;
  } | {
    type: 'user';
    id: string;
    name: string;
    email: string;
  } | {
    type: 'admin';
    id: string;
    name: string;
    email: string;
    permissions: string[];
  } | null,
  
  // State machines with type safety
  requestState: {
    status: 'idle',
    data: null,
    error: null
  } as 
    | { status: 'idle'; data: null; error: null }
    | { status: 'loading'; data: null; error: null }
    | { status: 'success'; data: any; error: null }
    | { status: 'error'; data: null; error: string }
};

function ConditionalComponent() {
  const userDataStore = useStore('userData');
  const requestStore = useStore('requestState');
  
  const userData = useStoreValue(userDataStore);
  const requestState = useStoreValue(requestStore);
  
  // Type-safe conditional rendering
  if (userData?.type === 'admin') {
    // TypeScript knows userData has permissions property
    return <AdminPanel permissions={userData.permissions} />;
  }
  
  if (userData?.type === 'user') {
    // TypeScript knows userData has user properties
    return <UserPanel user={userData} />;
  }
  
  // Handle request states
  switch (requestState.status) {
    case 'loading':
      return <LoadingSpinner />;
    case 'success':
      // TypeScript knows data is available
      return <SuccessView data={requestState.data} />;
    case 'error':
      // TypeScript knows error is available
      return <ErrorView error={requestState.error} />;
    default:
      return <IdleView />;
  }
}
```

### Generic Store Configuration

```typescript
// Generic configuration helper
function createTypedStoreConfig<T extends Record<string, any>>(config: T) {
  return config;
}

// Usage with perfect type inference
const typedConfig = createTypedStoreConfig({
  products: [] as Array<{
    id: string;
    name: string;
    price: number;
    category: string;
  }>,
  
  cart: {
    items: [] as Array<{
      productId: string;
      quantity: number;
      addedAt: Date;
    }>,
    total: 0,
    currency: 'USD' as const
  },
  
  checkout: {
    step: 1 as 1 | 2 | 3 | 4,
    isProcessing: false,
    paymentMethod: null as 'card' | 'paypal' | null
  }
});

const { useStore, withProvider } = createDeclarativeStorePattern('Shop', typedConfig);
```

## Integration with External Systems

### Redux DevTools Integration

```typescript
function DevToolsIntegration() {
  const storeManager = useStoreManager();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
      const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: 'Context-Action Stores'
      });
      
      // Send initial state
      devTools.init(storeManager.exportState());
      
      // Subscribe to all store changes
      const stores = storeManager.getAllStores();
      const unsubscribers: (() => void)[] = [];
      
      for (const [storeName, store] of stores) {
        const unsubscribe = store.subscribe((newValue, previousValue) => {
          devTools.send(
            { type: `UPDATE_${storeName.toUpperCase()}`, payload: newValue },
            storeManager.exportState()
          );
        });
        
        unsubscribers.push(unsubscribe);
      }
      
      return () => {
        unsubscribers.forEach(unsub => unsub());
        devTools.disconnect();
      };
    }
  }, [storeManager]);
  
  return null;
}
```

## Best Practices

### 1. Configuration Design
- Use explicit type annotations for complex types
- Provide validators for runtime safety
- Use meaningful store names that reflect their purpose

### 2. Type Safety
- Leverage TypeScript's type inference
- Use union types for state machines
- Implement proper validation for user inputs

### 3. Performance
- Use selective subscriptions with selectors
- Batch related updates together
- Implement proper memoization for computed values

### 4. Integration
- Use the HOC pattern for clean provider wrapping
- Implement proper persistence strategies
- Consider DevTools integration for debugging

### 5. Testing
- Test store configurations with various data shapes
- Validate that validators work correctly
- Test persistence and restoration logic

## Related

- **[Store Only Methods](./store-only)** - Individual store methods and operations
- **[Store Manager API](./store-manager)** - Store manager advanced operations
- **[Store Only Example](../examples/store-only)** - Complete usage examples