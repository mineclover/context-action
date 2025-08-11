# React Integration

The Context-Action framework provides seamless React integration through the `@context-action/react` package. Learn how to integrate with React patterns, hooks, and component lifecycles.

## Integration Overview

Context-Action integrates with React through:

- **Context API**: For provider-based state isolation
- **Custom Hooks**: For reactive store subscriptions and action dispatching
- **Effect Hooks**: For handler registration and cleanup
- **Component Patterns**: HOCs, render props, and hook-based patterns

## Core React Integration Patterns

### 1. Provider-Based Architecture

```typescript
// providers/AppProvider.tsx
import React from 'react';
import { 
  UserProvider,
  UserActionProvider
} from '../stores/user.store';
import { useUserHandlers } from '../hooks/useUserHandlers';

function UserHandlerSetup() {
  useUserHandlers(); // Register handlers using useEffect
  return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>           {/* Store context */}
      <UserActionProvider>   {/* Action context */}
        <UserHandlerSetup />  {/* Handler registration */}
        {children}
      </UserActionProvider>
    </UserProvider>
  );
}
```

### 2. Hook-Based Component Integration

```typescript
// components/UserProfile.tsx
import React, { useState, useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserAction } from '../stores/user.store';

export function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore); // Reactive subscription
  const dispatch = useUserAction();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(profile);
  
  // Sync form data when profile changes
  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);
  
  const handleSave = useCallback(async () => {
    try {
      await dispatch('updateProfile', { data: formData });
      setEditMode(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [dispatch, formData]);
  
  if (editMode) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <input 
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        <button type="submit">Save</button>
        <button type="button" onClick={() => setEditMode(false)}>Cancel</button>
      </form>
    );
  }
  
  return (
    <div>
      <h2>{profile.name}</h2>
      <p>{profile.email}</p>
      <button onClick={() => setEditMode(true)}>Edit</button>
    </div>
  );
}
```

### 3. Custom Hook Patterns

```typescript
// hooks/useUserProfile.ts
import { useMemo, useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserAction } from '../stores/user.store';

export function useUserProfile() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  const dispatch = useUserAction();
  
  // Computed values
  const displayName = useMemo(() => {
    return profile.name || profile.email || 'Anonymous User';
  }, [profile.name, profile.email]);
  
  const isComplete = useMemo(() => {
    return Boolean(profile.name && profile.email);
  }, [profile.name, profile.email]);
  
  // Actions
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    return await dispatch('updateProfile', { data });
  }, [dispatch]);
  
  const updatePreferences = useCallback(async (data: Partial<UserPreferences>) => {
    return await dispatch('updatePreferences', { data });
  }, [dispatch]);
  
  return {
    // State
    profile,
    preferences,
    displayName,
    isComplete,
    
    // Actions
    updateProfile,
    updatePreferences
  };
}
```

## Advanced React Integration Patterns

### 1. HOC Pattern for Self-Contained Components

```typescript
// patterns/withUserDomain.tsx
import React from 'react';
import { createContextStorePattern } from '@context-action/react';
import { UserActionProvider } from '../stores/user.store';
import { useUserHandlers } from '../hooks/useUserHandlers';

// Create isolated store pattern
const UserStores = createContextStorePattern('User');

// HOC for complete domain encapsulation
export const withUserDomain = UserStores.withCustomProvider(
  ({ children }) => (
    <UserActionProvider>
      <UserHandlerSetup />
      {children}
    </UserActionProvider>
  ),
  'user-domain'
);

function UserHandlerSetup() {
  useUserHandlers();
  return null;
}

// Usage - completely self-contained
const UserModule = withUserDomain(() => {
  const userStore = UserStores.useStore('profile', {
    id: '',
    name: '',
    email: ''
  });
  
  const profile = useStoreValue(userStore);
  const dispatch = useUserAction();
  
  return (
    <div>
      <h1>User: {profile.name}</h1>
      <button onClick={() => dispatch('updateProfile', { data: { name: 'New Name' } })}>
        Update
      </button>
    </div>
  );
});

// No provider setup needed - completely isolated
function App() {
  return (
    <div>
      <UserModule /> {/* Self-contained with all providers */}
    </div>
  );
}
```

### 2. Render Props Pattern

```typescript
// patterns/UserDataProvider.tsx
interface UserDataProviderProps {
  children: (data: {
    profile: UserProfile;
    preferences: UserPreferences;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    updatePreferences: (data: Partial<UserPreferences>) => Promise<void>;
  }) => React.ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
  const {
    profile,
    preferences,
    updateProfile,
    updatePreferences
  } = useUserProfile();
  
  return (
    <>
      {children({
        profile,
        preferences,
        updateProfile,
        updatePreferences
      })}
    </>
  );
}

// Usage
function UserSettings() {
  return (
    <UserDataProvider>
      {({ profile, preferences, updateProfile, updatePreferences }) => (
        <div>
          <h1>{profile.name}</h1>
          <p>Theme: {preferences.theme}</p>
          <button onClick={() => updatePreferences({ theme: 'dark' })}>
            Dark Mode
          </button>
        </div>
      )}
    </UserDataProvider>
  );
}
```

### 3. Context Store Pattern Integration

```typescript
// components/isolated/UserWidget.tsx
import React from 'react';
import { createContextStorePattern } from '@context-action/react';
import { useStoreValue } from '@context-action/react';

const UserWidgetStores = createContextStorePattern('UserWidget');

// Self-contained widget with isolated state
export function UserWidget() {
  return (
    <UserWidgetStores.Provider registryId="user-widget">
      <UserWidgetContent />
    </UserWidgetStores.Provider>
  );
}

function UserWidgetContent() {
  const userStore = UserWidgetStores.useStore('data', {
    name: 'Guest',
    status: 'offline'
  });
  
  const userData = useStoreValue(userStore);
  
  const updateStatus = () => {
    userStore.setValue({
      ...userData,
      status: userData.status === 'online' ? 'offline' : 'online'
    });
  };
  
  return (
    <div className="user-widget">
      <span>{userData.name}</span>
      <span className={`status ${userData.status}`}>
        {userData.status}
      </span>
      <button onClick={updateStatus}>
        Toggle Status
      </button>
    </div>
  );
}
```

## React Performance Optimizations

### 1. Selective Re-rendering

```typescript
// Optimize with React.memo and selective subscriptions
const UserName = React.memo(function UserName() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Component only re-renders when profile changes
  return <span>{profile.name}</span>;
});

const UserAvatar = React.memo(function UserAvatar() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Only re-renders when avatar URL changes
  return useMemo(() => (
    <img src={profile.avatarUrl || '/default-avatar.png'} alt={profile.name} />
  ), [profile.avatarUrl, profile.name]);
});
```

### 2. Custom Selective Subscription Hook

```typescript
// hooks/useSelectiveSubscription.ts
export function useStoreField<T, K extends keyof T>(
  store: Store<T>,
  field: K
): T[K] {
  const [value, setValue] = React.useState(() => store.getValue()[field]);
  
  React.useEffect(() => {
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

// Usage - only re-renders when specific field changes
function UserEmail() {
  const profileStore = useUserStore('profile');
  const email = useStoreField(profileStore, 'email'); // Only email changes trigger re-render
  
  return <span>{email}</span>;
}
```

### 3. Debounced Store Updates

```typescript
// hooks/useDebouncedStore.ts
export function useDebouncedStore<T>(
  store: Store<T>,
  delay: number = 300
): T {
  const [debouncedValue, setDebouncedValue] = React.useState(store.getValue());
  
  React.useEffect(() => {
    return store.subscribe((newValue) => {
      const timer = setTimeout(() => {
        setDebouncedValue(newValue);
      }, delay);
      
      return () => clearTimeout(timer);
    });
  }, [store, delay]);
  
  return debouncedValue;
}

// Usage - debounced updates for expensive operations
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

## React Development Tools Integration

### 1. DevTools Support

```typescript
// Enable React DevTools integration
import { enableDevTools } from '@context-action/react';

if (process.env.NODE_ENV === 'development') {
  enableDevTools({
    logStateChanges: true,
    logActionDispatches: true,
    showComponentUpdates: true
  });
}
```

### 2. Debug Components

```typescript
// components/debug/StoreDebugger.tsx
export function StoreDebugger({ storeName }: { storeName: string }) {
  const registry = useUserRegistry();
  const [debugInfo, setDebugInfo] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const store = registry.getStore(storeName);
    
    const unsubscribe = store.subscribe((newValue) => {
      setDebugInfo({
        storeName,
        value: newValue,
        timestamp: Date.now(),
        subscribers: store.getSubscriberCount?.() || 'unknown'
      });
    });
    
    return unsubscribe;
  }, [registry, storeName]);
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white',
      padding: '10px',
      fontSize: '12px'
    }}>
      <h4>Store Debug: {storeName}</h4>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
}
```

## React 18+ Features

### 1. Concurrent Features Support

```typescript
// Automatic support for React 18 concurrent features
import { startTransition } from 'react';

function useOptimizedUpdates() {
  const dispatch = useUserAction();
  
  const updateWithTransition = useCallback((data: any) => {
    startTransition(() => {
      // Non-urgent update wrapped in transition
      dispatch('updateProfile', { data });
    });
  }, [dispatch]);
  
  return { updateWithTransition };
}
```

### 2. Suspense Integration

```typescript
// Suspense-compatible data fetching
function UserProfileSuspense() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  // Throw promise for Suspense if profile is loading
  if (profile.isLoading) {
    throw profile.loadingPromise;
  }
  
  return <div>{profile.name}</div>;
}

// Usage with Suspense
function App() {
  return (
    <React.Suspense fallback={<div>Loading user...</div>}>
      <UserProfileSuspense />
    </React.Suspense>
  );
}
```

## Testing React Integration

### 1. Component Testing

```typescript
// __tests__/UserProfile.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from '../components/UserProfile';
import { createTestProvider } from '../test-utils';

describe('UserProfile', () => {
  it('should update profile on form submission', async () => {
    const TestProvider = createTestProvider({
      initialStores: {
        profile: { id: '1', name: 'John', email: 'john@test.com' }
      }
    });
    
    const { getByLabelText, getByText } = render(
      <TestProvider>
        <UserProfile />
      </TestProvider>
    );
    
    // Edit mode
    fireEvent.click(getByText('Edit'));
    
    // Update name
    const nameInput = getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Jane' } });
    
    // Save
    fireEvent.click(getByText('Save'));
    
    // Verify update
    await waitFor(() => {
      expect(getByText('Jane')).toBeInTheDocument();
    });
  });
});
```

### 2. Hook Testing

```typescript
// __tests__/useUserProfile.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useUserProfile } from '../hooks/useUserProfile';
import { createTestProvider } from '../test-utils';

describe('useUserProfile', () => {
  it('should return profile data and update functions', async () => {
    const TestProvider = createTestProvider({
      initialStores: {
        profile: { id: '1', name: 'John', email: 'john@test.com' }
      }
    });
    
    const { result } = renderHook(() => useUserProfile(), {
      wrapper: TestProvider
    });
    
    expect(result.current.profile.name).toBe('John');
    expect(result.current.displayName).toBe('John');
    
    // Test update
    await act(async () => {
      await result.current.updateProfile({ name: 'Jane' });
    });
    
    expect(result.current.profile.name).toBe('Jane');
  });
});
```

---

## Summary

React integration with Context-Action provides:

- **Seamless Hooks Integration**: Native React hooks for stores and actions
- **Provider-Based Architecture**: Clean context boundaries with React Context API
- **Performance Optimizations**: Selective subscriptions and React.memo compatibility
- **Advanced Patterns**: HOCs, render props, and isolated components
- **Development Tools**: DevTools integration and debugging components
- **Modern React Support**: Concurrent features and Suspense compatibility

The framework leverages React's strengths while providing type-safe, scalable state management with clear architectural boundaries.

---

::: tip Next Steps
- Explore [Jotai Integration](./jotai-integration) for atom-based state management
- Learn [Performance Optimization](./performance) for large-scale React applications
- See [Testing Strategies](./testing) for comprehensive testing approaches
:::