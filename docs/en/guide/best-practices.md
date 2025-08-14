# Best Practices

Follow these conventions and best practices when using the Context-Action framework.

## Naming Conventions

### Domain-Based Renaming Pattern

The core convention is **domain-specific renaming** for clear context separation.

#### Store Pattern Renaming
```tsx
// ✅ Recommended: Domain-specific renaming
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {...});

// ❌ Avoid: Direct object access
const UserStores = createDeclarativeStorePattern('User', {...});
const userStore = UserStores.useStore('profile'); // Domain unclear
```

#### Action Pattern Renaming
```tsx
// ✅ Recommended: Domain-specific renaming with explicit types
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// ❌ Avoid: Generic names
const {
  Provider,
  useActionDispatch,
  useActionHandler
} = createActionContext<UserActions>('UserActions');
```

### Context Naming Rules

#### Domain-Based Naming
```tsx
// ✅ Recommended: Clear domain separation
'UserProfile'     // User profile related
'ShoppingCart'    // Shopping cart related  
'ProductCatalog'  // Product catalog related
'OrderManagement' // Order management related
'AuthSystem'      // Authentication system related

// ❌ Avoid: Ambiguous names
'Data'           // Too broad
'State'          // Not specific
'App'            // Unclear scope (use only at root level)
'Manager'        // Unclear role
```

#### Action vs Store Distinction
```tsx
// Action Context (behavior/event focused)
'UserActions'         // User actions
'PaymentActions'      // Payment actions
'NavigationActions'   // Navigation actions

// Store Context (data/state focused)  
'UserData'           // User data
'PaymentData'        // Payment data
'AppSettings'        // Application settings
```

## File Structure

### Recommended Directory Structure
```
src/
├── contexts/
│   ├── user/
│   │   ├── UserActions.tsx     # Action context
│   │   ├── UserStores.tsx      # Store context
│   │   └── types.ts            # User-related types
│   ├── payment/
│   │   ├── PaymentActions.tsx
│   │   ├── PaymentStores.tsx
│   │   └── types.ts
│   └── index.ts                # Export all contexts
├── components/
├── pages/
└── utils/
```

### Context File Organization
```tsx
// contexts/user/UserActions.tsx
import { createActionContext } from '@context-action/react';
import type { UserActions } from './types';

export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// contexts/user/UserStores.tsx
import { createDeclarativeStorePattern } from '@context-action/react';
import type { UserStoreConfig } from './types';

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', userStoreConfig);
```

## Pattern Usage

### Action Pattern Best Practices

#### Handler Registration
```tsx
// ✅ Recommended: Use useCallback for stable handlers
function UserComponent() {
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      await updateUserProfile(payload);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, [])); // Empty deps for stable handler
}

// ❌ Avoid: Inline handlers (causes re-registration)
function UserComponent() {
  useUserActionHandler('updateProfile', async (payload) => {
    await updateUserProfile(payload); // Re-registers on every render
  });
}
```

#### Error Handling
```tsx
// ✅ Recommended: Use controller.abort for proper error handling
useActionHandler('riskyAction', (payload, controller) => {
  try {
    // Business logic that might fail
    processData(payload);
  } catch (error) {
    controller.abort('Processing failed', error);
  }
});
```

### Store Pattern Best Practices

#### Store Access
```tsx
// ✅ Recommended: Specific store subscriptions
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}

// ❌ Avoid: Unnecessary store access
function UserProfile() {
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings'); // Not used
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}
```

#### Store Updates
```tsx
// ✅ Recommended: Functional updates for complex changes
const { updateStore } = useUserStoreManager();

const updateProfile = (changes: Partial<UserProfile>) => {
  updateStore('profile', prevProfile => ({
    ...prevProfile,
    ...changes,
    updatedAt: Date.now()
  }));
};

// ✅ Acceptable: Direct updates for simple changes
const setUserName = (name: string) => {
  updateStore('profile', { ...currentProfile, name });
};
```

## Type Definitions

### Action Types
```tsx
// ✅ Recommended: Extend ActionPayloadMap
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  deleteAccount: { confirmationCode: string };
  logout: void; // For actions without payload
}

// ❌ Avoid: Plain interfaces
interface UserActions {
  updateProfile: { name: string; email: string }; // Missing ActionPayloadMap
}
```

### Store Types
```tsx
// ✅ Recommended: Clear type definitions
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

const userStoreConfig = {
  profile: { 
    initialValue: {
      id: '',
      name: '',
      email: '',
      createdAt: 0,
      updatedAt: 0
    } as UserProfile
  },
  settings: { 
    initialValue: {
      theme: 'light',
      notifications: true,
      language: 'en'
    } as UserSettings
  }
};
```

## Performance Guidelines

### Handler Optimization
```tsx
// ✅ Recommended: Memoized handlers
const optimizedHandler = useCallback(async (payload: UserActions['updateProfile']) => {
  await updateUserProfile(payload);
}, []);

useUserActionHandler('updateProfile', optimizedHandler);
```

### Store Subscription Optimization
```tsx
// ✅ Recommended: Subscribe to specific values
const userName = useStoreValue(profileStore)?.name;

// ❌ Avoid: Unnecessary full object subscriptions when only partial data needed
const fullProfile = useStoreValue(profileStore);
const userName = fullProfile.name; // Re-renders on any profile change
```

## Pattern Composition

### Provider Hierarchy
```tsx
// ✅ Recommended: Logical provider ordering
function App() {
  return (
    <UserStoreProvider>      {/* Data layer first */}
      <UserActionProvider>   {/* Action layer second */}
        <PaymentStoreProvider>
          <PaymentActionProvider>
            <AppContent />
          </PaymentActionProvider>
        </PaymentStoreProvider>
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

### Cross-Pattern Communication
```tsx
// ✅ Recommended: Actions update stores
function UserComponent() {
  const { updateStore } = useUserStoreManager();
  
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      const updatedProfile = await updateUserProfile(payload);
      updateStore('profile', updatedProfile); // Update store after API call
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  }, [updateStore]));
}
```

## Common Pitfalls

### Avoid These Patterns
```tsx
// ❌ Don't: Mix action dispatch with direct store updates
function BadComponent() {
  const dispatch = useUserAction();
  const { updateStore } = useUserStoreManager();
  
  const handleUpdate = () => {
    updateStore('profile', newProfile);  // Direct store update
    dispatch('updateProfile', newProfile); // AND action dispatch - redundant!
  };
}

// ❌ Don't: Create contexts inside components
function BadComponent() {
  const { Provider } = createActionContext<UserActions>('User'); // Wrong!
  return <Provider>...</Provider>;
}

// ❌ Don't: Register handlers with dependencies that change frequently
function BadComponent({ userId }: { userId: string }) {
  useUserActionHandler('updateProfile', async (payload) => {
    await updateUserProfile(userId, payload); // userId closure changes frequently
  }); // Missing useCallback and userId in deps
}
```