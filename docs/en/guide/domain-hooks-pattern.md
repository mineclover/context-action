# Domain-Specific Hooks Pattern

The Domain-Specific Hooks Pattern is the core philosophy of the Context-Action framework. It transforms generic, untyped APIs into domain-specific, fully-typed interfaces through destructuring assignments.

## The Pattern Philosophy

### Traditional Generic Approach

```typescript
// ❌ Generic, untyped approach
const store = useStore('user-profile');     // any
const dispatch = useDispatch();             // (action: string, payload: any) => void
const register = useActionRegister();       // (name: string, handler: any) => void

// No type safety, no domain clarity
dispatch('updateUser', { anyData: 'here' }); // Runtime errors only
```

### Domain-Specific Approach

```typescript
// ✅ Domain-specific, fully-typed approach
const store = useUserStore('profile');      // Store<UserProfile>
const dispatch = useUserAction();           // (action: keyof UserActions, payload: UserActions[action]) => void
const register = useUserActionRegister();   // Type-safe handler registration

// Full type safety, clear domain boundaries
dispatch('updateProfile', { data: { name: 'John' } }); // Compile-time safety
```

## Creating Domain-Specific Hooks

### Step 1: Define Domain Data Structure

```typescript
// Domain data interface
export interface UserBusinessData {
  profile: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  session: {
    lastLogin: number;
    isActive: boolean;
  };
}

// Domain actions interface
export interface UserBusinessActions {
  login: { email: string; password: string };
  logout: void;
  updateProfile: { data: Partial<UserBusinessData['profile']> };
  updatePreferences: { data: Partial<UserBusinessData['preferences']> };
}
```

### Step 2: Create Store Hooks via Destructuring

```typescript
// Transform generic hooks into domain-specific ones
export const {
  Provider: UserBusinessProvider,
  useStore: useUserBusinessStore,          // Domain-specific store hook
  useRegistry: useUserBusinessRegistry,    // Domain-specific registry hook
  useCreateStore: useCreateUserBusinessStore
} = createDeclarativeStores<UserBusinessData>('UserBusiness', {
  profile: {
    initialValue: {
      id: '',
      name: '',
      email: '',
      role: 'guest'
    }
  },
  preferences: {
    initialValue: {
      theme: 'light',
      language: 'en',
      notifications: true
    }
  },
  session: {
    initialValue: {
      lastLogin: 0,
      isActive: false
    }
  }
});
```

### Step 3: Create Action Hooks via Destructuring

```typescript
// Transform generic action hooks into domain-specific ones
export const {
  Provider: UserBusinessActionProvider,
  useAction: useUserBusinessAction,        // Domain-specific action dispatcher
  useActionRegister: useUserBusinessActionRegister,
  useActionWithResult: useUserBusinessActionWithResult
} = createActionContext<UserBusinessActions>({ 
  name: 'UserBusinessAction' 
});
```

## Benefits of Domain-Specific Naming

### 1. Full Type Inference

```typescript
function UserProfile() {
  // Automatic type inference - no manual typing needed
  const profileStore = useUserBusinessStore('profile'); // Store<UserBusinessData['profile']>
  const profile = useStoreValue(profileStore);          // UserBusinessData['profile']
  const dispatch = useUserBusinessAction();             // Typed dispatcher
  
  // TypeScript knows exactly what actions are available
  dispatch('updateProfile', { 
    data: { name: 'New Name' } // ✅ Correct payload structure
  });
  
  // Compile-time error for invalid actions
  dispatch('invalidAction', {}); // ❌ TS Error: 'invalidAction' doesn't exist
}
```

### 2. Clear Domain Boundaries

```typescript
// Each domain has its own isolated hooks
const userProfile = useUserBusinessStore('profile');    // User domain
const cartItems = useCartStore('items');                // Cart domain  
const orderHistory = useOrderStore('history');          // Order domain

// No confusion about which domain you're working with
const userDispatch = useUserBusinessAction();           // User actions only
const cartDispatch = useCartAction();                   // Cart actions only
```

### 3. Refactoring Safety

```typescript
// Rename domain interfaces safely
interface UserBusinessData {
  userProfile: UserProfile; // Renamed from 'profile'
}

// TypeScript will catch ALL references that need updating
const profileStore = useUserBusinessStore('userProfile'); // ✅ Must update
const oldStore = useUserBusinessStore('profile');         // ❌ TS Error
```

### 4. Team Scalability

```typescript
// Different teams can work on different domains without conflicts

// Team A: User Management
export const {
  useStore: useUserStore,
  useAction: useUserAction
} = createUserDomain();

// Team B: E-commerce
export const {
  useStore: useCartStore,
  useAction: useCartAction
} = createCartDomain();

// Team C: Analytics
export const {
  useStore: useAnalyticsStore,
  useAction: useAnalyticsAction
} = createAnalyticsDomain();

// No naming collisions, clear ownership
```

## Pattern Implementation Examples

### Basic Domain Setup

```typescript
// stores/user/userBusiness.store.ts
import { createDeclarativeStores, createActionContext } from '@context-action/react';

// 1. Define your domain
export interface UserData {
  profile: { id: string; name: string };
  settings: { theme: 'light' | 'dark' };
}

export interface UserActions {
  updateProfile: { name: string };
  toggleTheme: void;
}

// 2. Create domain-specific hooks
export const {
  Provider: UserProvider,
  useStore: useUserStore,
  useRegistry: useUserRegistry
} = createDeclarativeStores<UserData>('User', {
  profile: { initialValue: { id: '', name: '' } },
  settings: { initialValue: { theme: 'light' } }
});

export const {
  Provider: UserActionProvider,
  useAction: useUserAction,
  useActionRegister: useUserActionRegister
} = createActionContext<UserActions>({ name: 'UserAction' });
```

### Multi-Layer Domain Pattern

```typescript
// Separate business logic from UI state
export interface UserBusinessData {
  profile: UserProfile;
  session: UserSession;
}

export interface UserUIState {
  isEditing: boolean;
  selectedTab: string;
  loadingState: LoadingState;
}

// Business layer hooks
export const {
  useStore: useUserBusinessStore,
  useAction: useUserBusinessAction
} = createUserBusinessDomain();

// UI layer hooks  
export const {
  useStore: useUserUIStore,
  useAction: useUserUIAction
} = createUserUIDomain();
```

### Cross-Domain Integration Pattern

```typescript
// Logic fit hooks that combine multiple domains
export function useUserCartIntegration() {
  // Access multiple domain-specific hooks
  const userProfile = useUserStore('profile');
  const cartItems = useCartStore('items');
  
  // Domain-specific action dispatchers
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  const profile = useStoreValue(userProfile);
  const items = useStoreValue(cartItems);
  
  // Combined business logic
  const processCheckout = useCallback(async () => {
    if (!profile.id) {
      await userAction('requireLogin', {});
      return;
    }
    
    await cartAction('processCheckout', {
      userId: profile.id,
      items: items
    });
  }, [profile.id, items, userAction, cartAction]);
  
  return { processCheckout };
}
```

## Advanced Pattern Techniques

### 1. HOC Pattern for Provider Composition

```typescript
// Create self-contained domain components
const UserStores = createContextStorePattern('User');

const withUserProviders = UserStores.withCustomProvider(
  ({ children }) => (
    <UserActionProvider>
      {children}
    </UserActionProvider>
  ),
  'user-with-actions'
);

// Usage - completely isolated
const UserModule = withUserProviders(() => {
  const userStore = UserStores.useStore('profile', initialData);
  const dispatch = useUserAction();
  
  return <UserInterface />;
});

// No manual provider wrapping needed
function App() {
  return <UserModule />; // Fully self-contained
}
```

### 2. Conditional Domain Loading

```typescript
// Lazy load domains based on user permissions
export function useConditionalDomains(userRole: string) {
  // Admin users get admin domain hooks
  const adminHooks = userRole === 'admin' ? {
    useAdminStore: useAdminStore,
    useAdminAction: useAdminAction
  } : null;
  
  // All users get basic hooks
  const basicHooks = {
    useUserStore: useUserStore,
    useUserAction: useUserAction
  };
  
  return { ...basicHooks, ...adminHooks };
}
```

### 3. Testing with Domain Hooks

```typescript
// Easy to mock domain-specific hooks
jest.mock('../stores/user.store', () => ({
  useUserStore: jest.fn(),
  useUserAction: jest.fn()
}));

// Test with typed mocks
const mockUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>;
const mockUserAction = useUserAction as jest.MockedFunction<typeof useUserAction>;

mockUserStore.mockReturnValue(createMockStore({ 
  id: '1', 
  name: 'Test User' 
}));
```

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

```typescript
// Clear domain naming
const useUserStore = userStores.useStore;
const useUserAction = userActions.useAction;

// Consistent interface structure
interface UserActions {
  updateProfile: { data: Partial<UserProfile> };
  deleteProfile: { userId: string };
  resetProfile: void; // For actions without payload
}

// Proper cleanup
useEffect(() => {
  if (!register) return;
  const unregister = register('action', handler);
  return unregister;
}, [register, handler]);
```

### ❌ Anti-Patterns

```typescript
// Generic naming defeats the purpose
const useStore = userStores.useStore; // Lost domain context
const useAction = userActions.useAction; // No type clarity

// Inconsistent interfaces
interface UserActions {
  updateProfile: any;           // Lost type safety
  deleteProfile: string;       // Inconsistent payload pattern
  resetProfile: { empty: {} }; // Unnecessary payload for void actions
}

// Missing cleanup
useEffect(() => {
  register('action', handler); // Memory leak
}, []);
```

---

## Summary

The Domain-Specific Hooks Pattern transforms generic APIs into typed, domain-specific interfaces through strategic destructuring. This approach provides:

- **Full Type Safety**: Automatic TypeScript inference
- **Clear Boundaries**: Domain-specific naming prevents confusion  
- **Refactoring Safety**: Compile-time errors catch breaking changes
- **Team Scalability**: Multiple teams work independently
- **Better DX**: Autocomplete, documentation, and clear APIs

This pattern is fundamental to building maintainable, scalable applications with the Context-Action framework.

---

::: tip Next Steps
Ready to see this pattern in action? Check out the [Full Implementation Guide](./full) for complete examples, or explore [MVVM Architecture](./mvvm-architecture) to understand the broader architectural context.
:::