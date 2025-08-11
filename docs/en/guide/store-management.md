# Store Management

Learn how to effectively manage state in the Context-Action framework. This guide covers store patterns, lifecycle management, and advanced state handling techniques.

## Store System Overview

The Context-Action store system provides type-safe, reactive state management with domain isolation:

```typescript
// Stores are singletons within provider boundaries
const profileStore = useUserStore('profile'); // Always returns same instance
const profile = useStoreValue(profileStore);   // Reactive subscription
```

## Store Creation Patterns

### 1. Basic Store Setup

```typescript
// Define your domain data structure
export interface UserData {
  profile: { 
    id: string; 
    name: string; 
    email: string;
    avatar?: string;
  };
  preferences: { 
    theme: 'light' | 'dark';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  session: {
    token: string | null;
    expiresAt: number | null;
    lastActivity: number;
  };
}

// Create domain-specific store hooks
export const {
  Provider: UserProvider,
  useStore: useUserStore,
  useRegistry: useUserRegistry,
  useCreateStore: useCreateUserStore
} = createDeclarativeStores<UserData>('User', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: ''
    }
  },
  preferences: {
    initialValue: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    }
  },
  session: {
    initialValue: {
      token: null,
      expiresAt: null,
      lastActivity: Date.now()
    }
  }
});
```

### 2. Dynamic Store Creation

```typescript
// Create stores dynamically based on runtime conditions
function UserStoreSetup() {
  // Create core stores
  useCreateUserStore('profile', {
    id: '',
    name: '',
    email: ''
  });
  
  useCreateUserStore('preferences', {
    theme: 'light',
    language: navigator.language || 'en'
  });
  
  // Conditionally create admin-specific stores
  const userRole = getUserRole();
  if (userRole === 'admin') {
    useCreateUserStore('adminSettings', {
      canManageUsers: true,
      canModifySystem: false
    });
  }
  
  return null;
}
```

### 3. Computed Store Pattern

```typescript
// Create computed values that update automatically
function useComputedUserData() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  // Computed values (memoized)
  const displayName = useMemo(() => {
    return profile.name || profile.email || 'Guest User';
  }, [profile.name, profile.email]);
  
  const isAuthenticated = useMemo(() => {
    return Boolean(profile.id);
  }, [profile.id]);
  
  const themeConfig = useMemo(() => {
    return {
      isDark: preferences.theme === 'dark',
      cssClass: `theme-${preferences.theme}`,
      colors: getThemeColors(preferences.theme)
    };
  }, [preferences.theme]);
  
  return {
    profile,
    preferences,
    displayName,
    isAuthenticated,
    themeConfig
  };
}
```

## Store Access Patterns

### 1. Component Access (Reactive)

```typescript
function UserProfile() {
  // Get store instance
  const profileStore = useUserStore('profile');
  
  // Subscribe to changes (component re-renders on updates)
  const profile = useStoreValue(profileStore);
  
  // Direct store manipulation (when needed)
  const updateName = (newName: string) => {
    const currentProfile = profileStore.getValue();
    profileStore.setValue({
      ...currentProfile,
      name: newName
    });
  };
  
  return <div>Hello, {profile.name}!</div>;
}
```

### 2. Handler Access (Lazy Evaluation)

```typescript
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  const updateProfileHandler = useCallback(async (payload, controller) => {
    // Lazy evaluation - gets current value at execution time
    const profileStore = registry.getStore('profile');
    const currentProfile = profileStore.getValue(); // Fresh data
    
    // Validation
    if (!payload.data.email?.includes('@')) {
      controller.abort('Invalid email format');
      return;
    }
    
    // Update store
    profileStore.setValue({
      ...currentProfile,
      ...payload.data,
      updatedAt: Date.now()
    });
    
    return { success: true, profile: profileStore.getValue() };
  }, [registry]);
  
  // Handler registration...
}
```

### 3. Context Store Pattern (Isolated)

```typescript
// Create isolated store context
const UserStores = createContextStorePattern('User');

function UserModule() {
  return (
    <UserStores.Provider registryId="user-module">
      <UserComponents />
    </UserStores.Provider>
  );
}

function UserComponents() {
  // Isolated store within this context
  const userStore = UserStores.useStore('profile', {
    id: '',
    name: '',
    email: ''
  });
  
  const profile = useStoreValue(userStore);
  
  return <div>User: {profile.name}</div>;
}
```

## Store Lifecycle Management

### 1. Store Creation Lifecycle

```typescript
// Stores are created when first accessed
function Component() {
  // This creates the store if it doesn't exist
  const profileStore = useUserStore('profile');
  
  // Subsequent calls return the same instance
  const sameStore = useUserStore('profile'); // profileStore === sameStore
  
  return null;
}
```

### 2. Store Persistence Across Re-renders

```typescript
function Component({ userId }: { userId: string }) {
  // Store persists across re-renders within the same provider scope
  const profileStore = useUserStore('profile');
  
  // Effect to update store when userId changes
  useEffect(() => {
    if (userId) {
      loadUserProfile(userId).then(profile => {
        profileStore.setValue(profile);
      });
    }
  }, [userId, profileStore]);
  
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}
```

### 3. Provider Scope and Store Isolation

```typescript
// Different provider scopes = different store instances
function App() {
  return (
    <div>
      <UserProvider> {/* Scope 1 */}
        <ComponentA /> {/* Uses Store Instance A */}
      </UserProvider>
      
      <UserProvider> {/* Scope 2 */}
        <ComponentB /> {/* Uses Store Instance B */}
      </UserProvider>
    </div>
  );
}

function ComponentA() {
  const store = useUserStore('profile'); // Instance A
  return null;
}

function ComponentB() {
  const store = useUserStore('profile'); // Instance B (different from A)
  return null;
}
```

## Advanced Store Patterns

### 1. Store Synchronization

```typescript
// Sync stores across different parts of the application
function useStoreSynchronization() {
  const profileStore = useUserStore('profile');
  const sessionStore = useUserStore('session');
  
  const profile = useStoreValue(profileStore);
  const session = useStoreValue(sessionStore);
  
  // Sync profile updates with session activity
  useEffect(() => {
    if (profile.id) {
      const currentSession = sessionStore.getValue();
      sessionStore.setValue({
        ...currentSession,
        lastActivity: Date.now()
      });
    }
  }, [profile.id, sessionStore]);
  
  // Sync session expiration with profile
  useEffect(() => {
    if (session.expiresAt && session.expiresAt < Date.now()) {
      profileStore.setValue({
        id: '',
        name: '',
        email: ''
      });
    }
  }, [session.expiresAt, profileStore]);
}
```

### 2. Store Caching Pattern

```typescript
// Implement caching for expensive computations
function useCachedUserData() {
  const profileStore = useUserStore('profile');
  const cacheStore = useUserStore('cache');
  
  const profile = useStoreValue(profileStore);
  const cache = useStoreValue(cacheStore);
  
  // Get cached or computed expensive data
  const expensiveData = useMemo(() => {
    const cacheKey = `user-${profile.id}`;
    const cached = cache[cacheKey];
    
    if (cached && cached.timestamp > Date.now() - 60000) { // 1 minute cache
      return cached.data;
    }
    
    // Compute expensive data
    const computedData = computeExpensiveUserData(profile);
    
    // Update cache
    cacheStore.setValue({
      ...cache,
      [cacheKey]: {
        data: computedData,
        timestamp: Date.now()
      }
    });
    
    return computedData;
  }, [profile, cache, cacheStore]);
  
  return expensiveData;
}
```

### 3. Store Validation Pattern

```typescript
// Add validation layer to store updates
function useValidatedUserStore() {
  const profileStore = useUserStore('profile');
  const validationStore = useUserStore('validation');
  
  // Validated update method
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const errors: Record<string, string> = {};
    
    // Validation rules
    if (updates.email && !isValidEmail(updates.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (updates.name && updates.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    // Update validation store
    validationStore.setValue({
      errors,
      isValid: Object.keys(errors).length === 0
    });
    
    // Only update profile if valid
    if (Object.keys(errors).length === 0) {
      const currentProfile = profileStore.getValue();
      profileStore.setValue({
        ...currentProfile,
        ...updates
      });
      return true;
    }
    
    return false;
  }, [profileStore, validationStore]);
  
  return {
    profile: useStoreValue(profileStore),
    validation: useStoreValue(validationStore),
    updateProfile
  };
}
```

### 4. Store Middleware Pattern

```typescript
// Add middleware for logging, analytics, etc.
function useStoreMiddleware() {
  const registry = useUserRegistry();
  
  // Create middleware wrapper
  const createMiddlewareStore = useCallback(<T>(storeName: string) => {
    const originalStore = registry.getStore<T>(storeName);
    
    return {
      getValue: () => originalStore.getValue(),
      setValue: (value: T) => {
        const oldValue = originalStore.getValue();
        
        // Pre-update middleware
        console.log(`[STORE] Updating ${storeName}:`, { oldValue, newValue: value });
        
        // Analytics
        trackStoreUpdate(storeName, oldValue, value);
        
        // Update store
        originalStore.setValue(value);
        
        // Post-update middleware
        console.log(`[STORE] Updated ${storeName} successfully`);
      },
      subscribe: originalStore.subscribe
    };
  }, [registry]);
  
  return { createMiddlewareStore };
}
```

## Store Performance Optimization

### 1. Selective Subscriptions

```typescript
// Only subscribe to specific parts of the store
function OptimizedComponent() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Only re-render when name changes
  const userName = useMemo(() => profile.name, [profile.name]);
  
  // Or use custom hook for specific field subscription
  const userEmail = useStoreField(profileStore, 'email');
  
  return <div>{userName} - {userEmail}</div>;
}

// Custom hook for field-specific subscriptions
function useStoreField<T, K extends keyof T>(
  store: Store<T>, 
  field: K
): T[K] {
  const [fieldValue, setFieldValue] = useState(() => store.getValue()[field]);
  
  useEffect(() => {
    return store.subscribe((newValue) => {
      const newFieldValue = newValue[field];
      if (newFieldValue !== fieldValue) {
        setFieldValue(newFieldValue);
      }
    });
  }, [store, field, fieldValue]);
  
  return fieldValue;
}
```

### 2. Store Batching

```typescript
// Batch multiple store updates
function useBatchedUpdates() {
  const registry = useUserRegistry();
  
  const batchUpdate = useCallback((updates: {
    profile?: Partial<UserData['profile']>;
    preferences?: Partial<UserData['preferences']>;
    session?: Partial<UserData['session']>;
  }) => {
    // Start batch
    const profileStore = registry.getStore('profile');
    const preferencesStore = registry.getStore('preferences');
    const sessionStore = registry.getStore('session');
    
    // Perform all updates
    if (updates.profile) {
      profileStore.setValue({
        ...profileStore.getValue(),
        ...updates.profile
      });
    }
    
    if (updates.preferences) {
      preferencesStore.setValue({
        ...preferencesStore.getValue(),
        ...updates.preferences
      });
    }
    
    if (updates.session) {
      sessionStore.setValue({
        ...sessionStore.getValue(),
        ...updates.session
      });
    }
    
    // All updates are atomic from React's perspective
  }, [registry]);
  
  return { batchUpdate };
}
```

### 3. Store Debouncing

```typescript
// Debounce frequent store updates
function useDebouncedStore() {
  const profileStore = useUserStore('profile');
  const [debouncedProfile, setDebouncedProfile] = useState(profileStore.getValue());
  
  // Debounce store changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProfile(profileStore.getValue());
    }, 300);
    
    return () => clearTimeout(timer);
  }, [profileStore.getValue()]);
  
  return debouncedProfile;
}
```

## Common Store Patterns

### 1. Loading States

```typescript
interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

function useLoadingStore() {
  const loadingStore = useUserStore('loading');
  const dispatch = useUserAction();
  
  const setLoading = useCallback((loading: boolean, error?: string) => {
    loadingStore.setValue({
      isLoading: loading,
      error: error || null,
      lastUpdated: loading ? null : Date.now()
    });
  }, [loadingStore]);
  
  const handleAsyncAction = useCallback(async (actionType: string, payload: any) => {
    setLoading(true);
    
    try {
      const result = await dispatch(actionType as any, payload);
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false, error.message);
      throw error;
    }
  }, [dispatch, setLoading]);
  
  return {
    loading: useStoreValue(loadingStore),
    setLoading,
    handleAsyncAction
  };
}
```

### 2. Undo/Redo Pattern

```typescript
interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

function useUndoableStore<T>(storeName: string, initialValue: T) {
  const historyStore = useUserStore(`${storeName}-history`) as Store<HistoryState<T>>;
  
  // Initialize history if needed
  useEffect(() => {
    const current = historyStore.getValue();
    if (!current.present) {
      historyStore.setValue({
        past: [],
        present: initialValue,
        future: []
      });
    }
  }, [historyStore, initialValue]);
  
  const setValue = useCallback((newValue: T) => {
    const { past, present } = historyStore.getValue();
    
    historyStore.setValue({
      past: [...past, present],
      present: newValue,
      future: [] // Clear future on new action
    });
  }, [historyStore]);
  
  const undo = useCallback(() => {
    const { past, present, future } = historyStore.getValue();
    
    if (past.length > 0) {
      const newPresent = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      historyStore.setValue({
        past: newPast,
        present: newPresent,
        future: [present, ...future]
      });
    }
  }, [historyStore]);
  
  const redo = useCallback(() => {
    const { past, present, future } = historyStore.getValue();
    
    if (future.length > 0) {
      const newPresent = future[0];
      const newFuture = future.slice(1);
      
      historyStore.setValue({
        past: [...past, present],
        present: newPresent,
        future: newFuture
      });
    }
  }, [historyStore]);
  
  const history = useStoreValue(historyStore);
  
  return {
    value: history.present,
    setValue,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}
```

---

## Summary

Effective store management in the Context-Action framework involves:

- **Clear Structure**: Well-defined domain data interfaces
- **Lifecycle Awareness**: Understanding store creation and persistence  
- **Access Patterns**: Choosing the right pattern for each use case
- **Performance**: Optimizing subscriptions and updates
- **Advanced Patterns**: Implementing common state management needs

Proper store management ensures predictable state updates, optimal performance, and maintainable code architecture.

---

::: tip Next Steps
- Learn [Action Handlers](./action-handlers) for business logic management
- Explore [Cross-Domain Integration](./cross-domain-integration) for multi-domain applications  
- See [Performance Optimization](./performance) for large-scale applications
:::