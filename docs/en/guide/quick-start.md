# Quick Start Guide

Get up and running with the Context-Action framework in minutes. This guide shows you the essential patterns to start building type-safe, scalable React applications.

## Installation

```bash
npm install @context-action/core @context-action/react
# or
yarn add @context-action/core @context-action/react
# or  
pnpm add @context-action/core @context-action/react
```

## 5-Minute Implementation

### Step 1: Define Your Domain

Create a domain with stores and actions:

```typescript
// stores/user.store.ts
import { createDeclarativeStores, createActionContext } from '@context-action/react';

// Define your data structure
export interface UserData {
  profile: { id: string; name: string; email: string };
  preferences: { theme: 'light' | 'dark'; language: string };
}

// Define your actions
export interface UserActions {
  updateProfile: { name: string; email: string };
  toggleTheme: void;
  login: { email: string; password: string };
}

// Create domain-specific hooks
export const {
  Provider: UserProvider,
  useStore: useUserStore,
  useStores: useUserStores  // New clearer naming
} = createDeclarativeStores<UserData>('User', {
  profile: { initialValue: { id: '', name: '', email: '' } },
  preferences: { initialValue: { theme: 'light', language: 'en' } }
});

export const {
  Provider: UserActionProvider,
  useAction: useUserAction,
  useActionHandler: useUserActionHandler  // New clearer naming
} = createActionContext<UserActions>({ name: 'UserAction' });
```

### Step 2: Create Action Handlers

Define your business logic:

```typescript
// hooks/useUserHandlers.ts
import { useEffect, useCallback } from 'react';
import { useUserActionHandler, useUserStores } from '../stores/user.store';

export function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // Update profile handler
  const updateProfileHandler = useCallback(async (payload, controller) => {
    const profileStore = stores.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // Simple validation
    if (!payload.email.includes('@')) {
      controller.abort('Invalid email format');
      return;
    }
    
    // Update the store
    profileStore.setValue({
      ...currentProfile,
      name: payload.name,
      email: payload.email
    });
    
    return { success: true };
  }, [registry]);
  
  // Toggle theme handler
  const toggleThemeHandler = useCallback(async (payload, controller) => {
    const prefsStore = stores.getStore('preferences');
    const currentPrefs = prefsStore.getValue();
    
    prefsStore.setValue({
      ...currentPrefs,
      theme: currentPrefs.theme === 'light' ? 'dark' : 'light'
    });
  }, [registry]);
  
  // Register handlers with cleanup
  useEffect(() => {
    if (!register) return;
    
    const unaddHandlerUpdate = addHandler('updateProfile', updateProfileHandler, {
      priority: 100,
      blocking: true
    });
    
    const unaddHandlerTheme = addHandler('toggleTheme', toggleThemeHandler, {
      priority: 50,
      blocking: true
    });
    
    // Cleanup on unmount
    return () => {
      unregisterUpdate();
      unregisterTheme();
    };
  }, [register, updateProfileHandler, toggleThemeHandler]);
}
```

### Step 3: Create Your Component

Build a reactive UI component:

```typescript
// components/UserProfile.tsx
import React, { useState } from 'react';
import { useStoreValue } from '@context-action/react';
import { useUserStore, useUserAction } from '../stores/user.store';

export function UserProfile() {
  const profileStore = useUserStore('profile');
  const prefsStore = useUserStore('preferences');
  
  // Reactive subscriptions
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(prefsStore);
  const dispatch = useUserAction();
  
  // Local form state
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  
  const handleSave = () => {
    dispatch('updateProfile', { name, email });
  };
  
  const handleThemeToggle = () => {
    dispatch('toggleTheme');
  };
  
  return (
    <div style={{ 
      backgroundColor: preferences.theme === 'dark' ? '#333' : '#fff',
      color: preferences.theme === 'dark' ? '#fff' : '#333',
      padding: '20px'
    }}>
      <h2>User Profile</h2>
      
      <div>
        <label>Name:</label>
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div>
        <label>Email:</label>
        <input 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <button onClick={handleSave}>
        Save Profile
      </button>
      
      <button onClick={handleThemeToggle}>
        Toggle Theme ({preferences.theme})
      </button>
      
      <div>
        <p>Current: {profile.name} ({profile.email})</p>
        <p>Theme: {preferences.theme}</p>
      </div>
    </div>
  );
}
```

### Step 4: Setup Your App

Wire everything together:

```typescript
// App.tsx
import React from 'react';
import { 
  UserProvider, 
  UserActionProvider 
} from './stores/user.store';
import { useUserHandlers } from './hooks/useUserHandlers';
import { UserProfile } from './components/UserProfile';

// Handler setup component
function UserHandlersSetup() {
  useUserHandlers();
  return null;
}

// App with proper provider nesting
function App() {
  return (
    <UserProvider>
      <UserActionProvider>
        <UserHandlersSetup />
        <div style={{ padding: '20px' }}>
          <h1>Context-Action Quick Start</h1>
          <UserProfile />
        </div>
      </UserActionProvider>
    </UserProvider>
  );
}

export default App;
```

## What You Just Built

🎉 **Congratulations!** You now have a working Context-Action application with:

- **Type-Safe Actions**: `updateProfile` and `toggleTheme` with full TypeScript support
- **Reactive State**: Components automatically re-render when stores change
- **Domain Isolation**: User domain is completely self-contained
- **Business Logic Separation**: Handlers contain all business logic
- **Memory Safety**: Proper cleanup when components unmount

## Key Patterns You Learned

### 1. Domain-Specific Hooks

```typescript
const profile = useUserStore('profile');     // Typed store access
const dispatch = useUserAction();            // Typed action dispatch
```

### 2. Reactive Subscriptions

```typescript
const profile = useStoreValue(profileStore); // Auto re-render on changes
```

### 3. Handler Registration with Cleanup

```typescript
useEffect(() => {
  const unaddHandler = addHandler('action', handler);
  return unregister; // Important cleanup
}, [register, handler]);
```

### 4. Provider Composition

```typescript
<UserProvider>
  <UserActionProvider>
    <Components />
  </UserActionProvider>
</UserProvider>
```

## Next Steps

### Add More Domains

```typescript
// Add cart functionality
const CartStores = createContextStorePattern('Cart');
const CartActions = createActionContext<CartActions>();

// Add order management
const OrderStores = createContextStorePattern('Order');  
const OrderActions = createActionContext<OrderActions>();
```

### Advanced Patterns

- **[Cross-Domain Integration](./cross-domain-integration)** - Make domains work together
- **[Logic Fit Hooks](./logic-fit-hooks)** - Combine business and UI logic
- **[Performance Optimization](./performance)** - Optimize for large applications

### Testing Your Code

```typescript
// Easy to test handlers in isolation
describe('updateProfile handler', () => {
  it('should update profile data', async () => {
    const mockRegistry = createMockRegistry();
    const handler = createUpdateProfileHandler(mockRegistry);
    
    await handler({ name: 'John', email: 'john@test.com' }, mockController);
    
    expect(mockRegistry.getStore('profile').setValue).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@test.com'
    });
  });
});
```

## Common Patterns

### Loading States

```typescript
const loadingHandler = useCallback(async (payload, controller) => {
  const uiStore = stores.getStore('ui');
  
  // Set loading
  uiStore.setValue({ ...uiStore.getValue(), loading: true });
  
  try {
    // Do work
    await someAsyncOperation();
  } finally {
    // Clear loading
    uiStore.setValue({ ...uiStore.getValue(), loading: false });
  }
}, [registry]);
```

### Error Handling

```typescript
const errorHandler = useCallback(async (payload, controller) => {
  try {
    // Risky operation
    await riskyOperation();
  } catch (error) {
    controller.abort('Operation failed', error);
    return { success: false, error: error.message };
  }
}, []);
```

### Conditional Logic

```typescript
const conditionalHandler = useCallback(async (payload, controller) => {
  const userStore = stores.getStore('profile');
  const user = userStore.getValue();
  
  if (!user.id) {
    controller.abort('User must be logged in');
    return;
  }
  
  // Continue with authenticated user logic
}, [registry]);
```

---

## Summary

You've built a complete Context-Action application in just a few steps! The framework provides:

- **Type Safety** out of the box
- **Reactive State Management** with minimal boilerplate  
- **Clear Architecture** with separated concerns
- **Scalable Patterns** that grow with your application

---

::: tip Ready for More?
- Check out the **[Full Implementation Guide](./full)** for comprehensive patterns
- Explore **[Advanced Patterns](./advanced-patterns)** for complex scenarios
- See **[Real Examples](../examples/)** for production-ready code
:::

::: details Troubleshooting
**Handler not executing?** Make sure you're using `blocking: true` for async handlers.

**Component not re-rendering?** Verify you're using `useStoreValue()` for reactive subscriptions.

**TypeScript errors?** Check that your action payload matches the interface definition.

**Memory issues?** Ensure all handler registrations return cleanup functions.
:::