# Performance Optimization

Optimize your Context-Action applications for maximum performance through efficient handler management, smart subscriptions, and memory optimization techniques.

## Performance Principles

The Context-Action framework is designed for performance, but following best practices ensures optimal results:

1. **Lazy Evaluation**: Access stores only when needed in handlers
2. **Minimal Subscriptions**: Subscribe only to stores you actually use
3. **Efficient Handlers**: Use `useCallback` to prevent re-registration
4. **Memory Cleanup**: Always clean up handlers and subscriptions
5. **Selective Updates**: Update only what changes

## Handler Performance Optimization

### 1. Efficient Handler Registration

```typescript
// ✅ Optimal: Stable handler with minimal dependencies
function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores(); // Stable reference
  
  // Stable handler - only recreated if registry changes
  const updateHandler = useCallback(async (payload, controller) => {
    // Lazy evaluation - get current state when needed
    const profileStore = stores.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // Business logic
    const updatedProfile = {
      ...currentProfile,
      ...payload.data,
      updatedAt: Date.now()
    };
    
    profileStore.setValue(updatedProfile);
  }, [registry]); // Only registry dependency
  
  useEffect(() => {
    if (!addHandler) return;
    const unregister = addHandler('updateProfile', updateHandler, {
      priority: 100,
      blocking: true,
      id: 'profile-updater'
    });
    return unregister; // Critical: cleanup prevents memory leaks
  }, [addHandler, updateHandler]);
}
```

```typescript
// ❌ Inefficient: Handler recreated every render
function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const profileStore = useUserStore('profile'); // Store reference changes
  
  // New function every render - causes re-registration
  const updateHandler = async (payload, controller) => {
    const profile = profileStore.getValue(); // Stale closure risk
    // Handler logic
  };
  
  useEffect(() => {
    if (!addHandler) return;
    const unregister = addHandler('updateProfile', updateHandler);
    return unregister;
  }, [addHandler, updateHandler]); // updateHandler changes every render!
}
```

### 2. Handler Priority Optimization

```typescript
// Optimize handler execution order for performance
function useOptimizedHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterFunctions = [];
    
    // High priority: Fast validation (runs first)
    unregisterFunctions.push(
      register('updateProfile', fastValidationHandler, {
        priority: 100,
        blocking: true, // Block if validation fails
        id: 'validation-fast'
      })
    );
    
    // Medium priority: Business logic (runs second)
    unregisterFunctions.push(
      register('updateProfile', businessLogicHandler, {
        priority: 90,
        blocking: true, // Block for data consistency
        id: 'business-logic'
      })
    );
    
    // Low priority: Side effects (runs last, can be async)
    unregisterFunctions.push(
      register('updateProfile', analyticsHandler, {
        priority: 80,
        blocking: false, // Don't block for analytics
        id: 'analytics'
      })
    );
    
    return () => unregisterFunctions.forEach(fn => fn());
  }, [addHandler, registry]);
}
```

### 3. Conditional Handler Registration

```typescript
// Register handlers based on conditions to reduce overhead
function useConditionalHandlers(userRole: string, features: string[]) {
  const addHandler = useUserActionHandler();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterFunctions = [];
    
    // Always register core handlers
    unregisterFunctions.push(
      register('updateProfile', coreHandler, {
        priority: 100,
        id: 'core-handler'
      })
    );
    
    // Conditionally register expensive handlers
    if (userRole === 'admin') {
      unregisterFunctions.push(
        register('updateProfile', adminValidationHandler, {
          priority: 110,
          id: 'admin-validation'
        })
      );
    }
    
    if (features.includes('advanced-analytics')) {
      unregisterFunctions.push(
        register('updateProfile', advancedAnalyticsHandler, {
          priority: 70,
          blocking: false, // Don't block main flow
          id: 'advanced-analytics'
        })
      );
    }
    
    return () => unregisterFunctions.forEach(fn => fn());
  }, [addHandler, userRole, features]); // Re-register when conditions change
}
```

## Store Performance Optimization

### 1. Selective Subscriptions

```typescript
// ✅ Optimal: Only subscribe to stores you use
function UserName() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore); // Only subscribes to profile
  
  // Component only re-renders when profile changes
  return <span>{profile.name}</span>;
}

function UserEmail() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Separate component for email - independent re-rendering
  return <span>{profile.email}</span>;
}
```

```typescript
// ❌ Inefficient: Over-subscription
function UserDisplay() {
  const profile = useStoreValue(useUserStore('profile'));
  const preferences = useStoreValue(useUserStore('preferences')); // Not used!
  const session = useStoreValue(useUserStore('session')); // Not used!
  const history = useStoreValue(useUserStore('history')); // Not used!
  
  // Component re-renders when ANY of these stores change
  return <span>{profile.name}</span>; // Only uses profile
}
```

### 2. Field-Level Subscriptions

```typescript
// Custom hook for field-level subscriptions
export function useStoreField<T, K extends keyof T>(
  store: Store<T>,
  field: K
): T[K] {
  const [value, setValue] = useState(() => store.getValue()[field]);
  
  useEffect(() => {
    return store.subscribe((newData) => {
      const newValue = newData[field];
      setValue(prevValue => {
        // Only update if the specific field changed
        return Object.is(prevValue, newValue) ? prevValue : newValue;
      });
    });
  }, [store, field]);
  
  return value;
}

// Usage: Only re-renders when email field changes
function UserEmail() {
  const profileStore = useUserStore('profile');
  const email = useStoreField(profileStore, 'email'); // Field-level subscription
  
  return <span>{email}</span>;
}
```

### 3. Debounced Updates

```typescript
// Debounce rapid store updates
export function useDebouncedStore<T>(
  store: Store<T>,
  delay: number = 300
): T {
  const [debouncedValue, setDebouncedValue] = useState(store.getValue());
  
  useEffect(() => {
    return store.subscribe((newValue) => {
      const timer = setTimeout(() => {
        setDebouncedValue(newValue);
      }, delay);
      
      return () => clearTimeout(timer);
    });
  }, [store, delay]);
  
  return debouncedValue;
}

// Usage: Expensive operations only run after user stops typing
function ExpensiveUserAnalytics() {
  const profileStore = useUserStore('profile');
  const debouncedProfile = useDebouncedStore(profileStore, 500);
  
  const analytics = useMemo(() => {
    // Expensive computation only runs after 500ms of no changes
    return computeExpensiveAnalytics(debouncedProfile);
  }, [debouncedProfile]);
  
  return <div>{analytics.summary}</div>;
}
```

## React Performance Optimization

### 1. Component Memoization

```typescript
// Optimize components with React.memo
const UserName = React.memo(function UserName() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Only re-renders when profile changes
  return <span>{profile.name}</span>;
});

const UserAvatar = React.memo(function UserAvatar() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Memoize expensive avatar rendering
  return useMemo(() => (
    <img 
      src={profile.avatarUrl || '/default-avatar.png'} 
      alt={profile.name}
      onLoad={handleImageLoad} // Expensive operation
    />
  ), [profile.avatarUrl, profile.name]);
});
```

### 2. Custom Hook Optimization

```typescript
// Optimize custom hooks with proper dependencies
export function useUserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  const dispatch = useUserAction();
  
  // Memoize computed values
  const displayName = useMemo(() => {
    return profile.name || profile.email || 'Anonymous User';
  }, [profile.name, profile.email]);
  
  const isComplete = useMemo(() => {
    return Boolean(profile.name && profile.email && profile.phone);
  }, [profile.name, profile.email, profile.phone]);
  
  // Memoize action functions
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    return await dispatch('updateProfile', { data });
  }, [dispatch]);
  
  const updatePreferences = useCallback(async (data: Partial<UserPreferences>) => {
    return await dispatch('updatePreferences', { data });
  }, [dispatch]);
  
  return useMemo(() => ({
    // State
    profile,
    preferences,
    displayName,
    isComplete,
    
    // Actions
    updateProfile,
    updatePreferences
  }), [profile, preferences, displayName, isComplete, updateProfile, updatePreferences]);
}
```

### 3. Lazy Loading and Code Splitting

```typescript
// Lazy load expensive components
const ExpensiveUserDashboard = React.lazy(() => 
  import('./components/ExpensiveUserDashboard')
);

function UserApp() {
  const [showDashboard, setShowDashboard] = useState(false);
  
  return (
    <div>
      <UserProfile />
      
      {showDashboard && (
        <React.Suspense fallback={<div>Loading dashboard...</div>}>
          <ExpensiveUserDashboard />
        </React.Suspense>
      )}
      
      <button onClick={() => setShowDashboard(true)}>
        Load Dashboard
      </button>
    </div>
  );
}

// Lazy load handlers for large applications
const loadUserHandlers = () => import('./handlers/userHandlers');

function useConditionalUserHandlers(shouldLoad: boolean) {
  const [handlersLoaded, setHandlersLoaded] = useState(false);
  
  useEffect(() => {
    if (shouldLoad && !handlersLoaded) {
      loadUserHandlers().then(module => {
        module.setupUserHandlers();
        setHandlersLoaded(true);
      });
    }
  }, [shouldLoad, handlersLoaded]);
}
```

## Memory Management

### 1. Handler Cleanup

```typescript
// Proper cleanup prevents memory leaks
function useUserHandlers() {
  const addHandler = useUserActionHandler();
  
  useEffect(() => {
    if (!addHandler) return;
    
    const unregisterFunctions: Array<() => void> = [];
    
    // Register multiple handlers
    unregisterFunctions.push(
      register('updateProfile', updateHandler, { id: 'update' })
    );
    unregisterFunctions.push(
      register('deleteProfile', deleteHandler, { id: 'delete' })
    );
    unregisterFunctions.push(
      register('validateProfile', validateHandler, { id: 'validate' })
    );
    
    // Critical: Clean up all handlers on unmount
    return () => {
      unregisterFunctions.forEach(unregister => unregister?.());
    };
  }, [register]);
}
```

### 2. Store Cleanup

```typescript
// Clean up store subscriptions
export function useStoreValue<T>(store: Store<T>): T {
  const [value, setValue] = useState(() => store.getValue());
  
  useEffect(() => {
    const unsubscribe = store.subscribe(setValue);
    return unsubscribe; // Cleanup subscription
  }, [store]);
  
  return value;
}

// Cleanup in custom hooks
export function useUserData() {
  const profileStore = useUserStore('profile');
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    const unsubscribe = profileStore.subscribe((profile) => {
      setUserData(processUserData(profile)); // Expensive processing
    });
    
    return () => {
      unsubscribe();
      setUserData(null); // Clear processed data
    };
  }, [profileStore]);
  
  return userData;
}
```

### 3. Event Listener Cleanup

```typescript
// Clean up event listeners and timers
function useAutoSave() {
  const dispatch = useUserAction();
  const profileStore = useUserStore('profile');
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const unsubscribe = profileStore.subscribe((profile) => {
      // Clear previous timeout
      clearTimeout(timeoutId);
      
      // Auto-save after 2 seconds of inactivity
      timeoutId = setTimeout(() => {
        dispatch('autoSave', { data: profile });
      }, 2000);
    });
    
    return () => {
      clearTimeout(timeoutId); // Clear timeout
      unsubscribe(); // Clean up subscription
    };
  }, [dispatch, profileStore]);
}
```

## Bundle Size Optimization

### 1. Tree Shaking

```typescript
// Import only what you need for better tree shaking
import { createDeclarativeStores } from '@context-action/react';
import { useStoreValue } from '@context-action/react';

// ❌ Avoid importing entire modules
// import * as ContextAction from '@context-action/react';

// ✅ Import specific functions
import { 
  createDeclarativeStores,
  createActionContext,
  useStoreValue 
} from '@context-action/react';
```

### 2. Dynamic Imports

```typescript
// Dynamic imports for optional features
async function loadAdvancedFeatures() {
  if (shouldLoadAdvancedFeatures()) {
    const { setupAdvancedHandlers } = await import('./advancedHandlers');
    const { createAdvancedStores } = await import('./advancedStores');
    
    setupAdvancedHandlers();
    return createAdvancedStores();
  }
  
  return null;
}

// Conditional feature loading
function useAdvancedUserFeatures(enabled: boolean) {
  const [features, setFeatures] = useState(null);
  
  useEffect(() => {
    if (enabled) {
      loadAdvancedFeatures().then(setFeatures);
    }
  }, [enabled]);
  
  return features;
}
```

## Performance Monitoring

### 1. Performance Metrics

```typescript
// Monitor handler performance
function createPerformanceHandler<T extends any[], R>(
  name: string,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const start = performance.now();
    
    try {
      const result = await handler(...args);
      
      const duration = performance.now() - start;
      console.log(`Handler ${name} took ${duration.toFixed(2)}ms`);
      
      // Report to monitoring service
      reportPerformance(name, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Handler ${name} failed after ${duration.toFixed(2)}ms:`, error);
      
      reportError(name, error, duration);
      throw error;
    }
  };
}

// Usage
const monitoredUpdateHandler = createPerformanceHandler(
  'updateProfile',
  async (payload, controller) => {
    // Handler logic
  }
);
```

### 2. Store Performance Tracking

```typescript
// Monitor store update frequency
function createMonitoredStore<T>(name: string, initialValue: T) {
  const store = createStore(initialValue);
  let updateCount = 0;
  let lastUpdate = Date.now();
  
  const originalSetValue = store.setValue;
  store.setValue = (newValue: T) => {
    updateCount++;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;
    
    console.log(`Store ${name} update #${updateCount} (${timeSinceLastUpdate}ms since last)`);
    
    if (timeSinceLastUpdate < 100) {
      console.warn(`Store ${name} updating too frequently!`);
    }
    
    lastUpdate = now;
    return originalSetValue(newValue);
  };
  
  return store;
}
```

## Performance Best Practices

### ✅ Do

- **Use `useCallback` for stable handler references**
- **Subscribe only to stores you actually use**
- **Clean up handlers and subscriptions on unmount**
- **Memoize expensive computations with `useMemo`**
- **Use React.memo for pure components**
- **Implement lazy loading for large features**
- **Monitor performance in production**

### ❌ Don't

- **Create new handler functions on every render**
- **Subscribe to unnecessary stores**
- **Forget cleanup functions**
- **Perform expensive operations in render**
- **Use stale closures in handlers**
- **Over-optimize without measuring**

---

## Summary

Context-Action performance optimization focuses on:

- **Efficient Handler Management**: Stable references and proper cleanup
- **Smart Subscriptions**: Only subscribe to what you need
- **Memory Management**: Clean up resources to prevent leaks
- **React Optimization**: Memoization and selective re-rendering
- **Bundle Optimization**: Tree shaking and dynamic imports
- **Performance Monitoring**: Track and improve performance metrics

Follow these patterns to build fast, efficient applications that scale well with complexity.

---

::: tip Next Steps
- Learn [Error Handling Patterns](./error-handling) for robust error management
- Explore [Testing Strategies](./testing) for performance testing approaches
- See [Memory Management](./memory-management) for advanced memory optimization
:::