# Type Safety Best Practices

Essential recommendations for maintaining type safety and excellent developer experience with Context-Action.

## 🎯 Core Principles

### 1. Prefer Type Inference Over Manual Annotations

```typescript
// ✅ Good: Let TypeScript infer types
const { Provider, useStore } = createStoreContext('MyApp', {
  user: { name: 'John', age: 30 },        // Types inferred automatically
  settings: { theme: 'dark' as const },   // Explicit const for literals
  items: ['apple', 'banana']              // Array type inferred
});

// ❌ Avoid: Over-annotating when inference works
const { Provider, useStore } = createStoreContext<{
  user: { name: string; age: number };   // Unnecessary manual typing
  settings: { theme: string };           // Loses literal type information
  items: string[];
}>('MyApp', {
  user: { name: 'John', age: 30 },
  settings: { theme: 'dark' },
  items: ['apple', 'banana']
});
```

### 2. Use Const Assertions for Literal Types

```typescript
// ✅ Good: Preserve literal types with const assertion
const appConfig = {
  theme: 'dark',
  mode: 'production',
  features: ['auth', 'analytics']
} as const;

// Type: { readonly theme: 'dark'; readonly mode: 'production'; readonly features: readonly ['auth', 'analytics'] }

// ✅ Good: Const assertion in stores
const { Provider, useStore } = createStoreContext('Config', {
  theme: 'dark' as const,              // Type: 'dark' (not string)
  validModes: ['dev', 'prod'] as const // Type: readonly ['dev', 'prod']
});

// ❌ Avoid: Losing literal type information
const appConfig = {
  theme: 'dark',     // Type: string (too wide)
  mode: 'production' // Type: string (too wide)
};
```

### 3. Define Clear Action Interfaces

```typescript
// ✅ Good: Clear, specific action interfaces
interface UserActions {
  updateProfile: { name: string; email: string };
  deleteAccount: { confirmationCode: string };
  changePassword: { currentPassword: string; newPassword: string };
  logout: void; // No payload needed
}

// ✅ Good: Use branded types for IDs
type UserId = TypeUtils.Brand<string, 'UserId'>;

interface UserActions {
  loadUser: { userId: UserId };
  updateUser: { userId: UserId; data: Partial<User> };
}

// ❌ Avoid: Vague or overly generic actions
interface BadActions {
  doSomething: any;                    // Too vague
  update: { data: object };           // Too generic
  process: { input: unknown };        // Unclear purpose
}
```

## 🛡️ Type Safety Patterns

### 1. Strict TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict type checks
    "noImplicitAny": true,            // Error on implicit 'any'
    "strictNullChecks": true,         // Strict null checking
    "strictFunctionTypes": true,      // Strict function type checking
    "noImplicitReturns": true,        // Error on missing return statements
    "noUncheckedIndexedAccess": true, // Add 'undefined' to index signatures
    "exactOptionalPropertyTypes": true // Strict optional property handling
  }
}
```

### 2. Defensive Type Guards

```typescript
// ✅ Good: Runtime type validation with type guards
function isValidUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

// ✅ Good: Use in action handlers
useActionHandler('updateUser', async (payload, controller) => {
  if (!isValidUser(payload.userData)) {
    controller.abort('Invalid user data');
    return;
  }

  // TypeScript knows payload.userData is User
  userStore.setValue(payload.userData);
});

// ✅ Good: Store-level validation
const { Provider, useStore } = createStoreContext('App', {
  user: {
    initialValue: null as User | null,
    validator: (value: unknown): value is User | null => {
      return value === null || isValidUser(value);
    }
  }
});
```

### 3. Exhaustive Type Checking

```typescript
// ✅ Good: Exhaustive switch statements
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered';

function getStatusMessage(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Order is pending';
    case 'confirmed':
      return 'Order confirmed';
    case 'shipped':
      return 'Order shipped';
    case 'delivered':
      return 'Order delivered';
    default:
      // ✅ Compile-time error if new status added
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}
```

## 🔧 Store Management Best Practices

### 1. Proper Store Configuration

```typescript
// ✅ Good: Explicit initial values with proper types
const { Provider, useStore } = createStoreContext('App', {
  // Primitive types
  count: 0,                           // Type: number
  isLoading: false,                   // Type: boolean

  // Objects with const assertions for literals
  user: {
    id: '',
    name: '',
    role: 'user' as const             // Type: 'user' (not string)
  },

  // Arrays with proper typing
  items: [] as Item[],                // Type: Item[]
  tags: ['default'] as readonly string[], // Type: readonly string[]

  // Complex configuration objects
  settings: {
    initialValue: { theme: 'light', locale: 'en' },
    strategy: 'shallow' as const,     // Comparison strategy
    description: 'Application settings'
  }
});

// ❌ Avoid: Ambiguous or untyped initial values
const badStores = {
  data: null,                         // Type: null (too restrictive)
  items: [],                          // Type: never[] (no type info)
  config: {},                         // Type: {} (too loose)
  status: 'loading'                   // Type: string (too wide)
};
```

### 2. Store Access Patterns

```typescript
// ✅ Good: Reactive store subscriptions
function UserComponent() {
  const userStore = useStore('user');
  const user = useStoreValue(userStore);  // ✅ Reactive subscription

  return <div>{user.name}</div>;
}

// ✅ Good: Direct store access in handlers
useActionHandler('updateUser', async (payload) => {
  const userStore = useStore('user');
  const currentUser = userStore.getValue(); // ✅ Current state access

  const updatedUser = { ...currentUser, ...payload };
  userStore.setValue(updatedUser);
});

// ❌ Avoid: Direct store access in render
function BadComponent() {
  const userStore = useStore('user');
  const user = userStore.getValue();     // ❌ Not reactive!

  return <div>{user.name}</div>;
}
```

### 3. Store Update Patterns

```typescript
// ✅ Good: Type-safe store updates
const userStore = useStore('user');

// Immutable updates
userStore.update(user => ({
  ...user,
  name: 'New Name',
  lastUpdated: Date.now()
}));

// Conditional updates with type safety
userStore.update(user => {
  if (user.role === 'admin') {
    return { ...user, permissions: ['read', 'write', 'delete'] };
  }
  return user;
});

// ❌ Avoid: Mutations or invalid types
userStore.update(user => {
  user.name = 'New Name';  // ❌ Direct mutation
  return user;
});

userStore.setValue({ invalid: 'data' }); // ❌ Type error
```

## 🚀 Action Handler Best Practices

### 1. Handler Registration Patterns

```typescript
// ✅ Good: Early handler registration with proper cleanup
function UserLogic({ children }: { children: React.ReactNode }) {
  const userStore = useStore('user');

  // Register handlers early and memoize
  const updateHandler = useCallback(async (payload: UpdateUserPayload) => {
    const currentUser = userStore.getValue();
    const updatedUser = { ...currentUser, ...payload };
    userStore.setValue(updatedUser);
  }, [userStore]);

  useActionHandler('updateUser', updateHandler);

  return <>{children}</>;
}

// ✅ Good: Handler composition with dependencies
function useUserHandlers() {
  const userStore = useStore('user');
  const settingsStore = useStore('settings');

  useActionHandler('updateProfile', useCallback(async (payload) => {
    // Complex handler with multiple store dependencies
    const user = userStore.getValue();
    const settings = settingsStore.getValue();

    // Business logic here
    userStore.setValue({ ...user, ...payload });
  }, [userStore, settingsStore]));
}

// ❌ Avoid: Late registration or missing dependencies
function BadComponent() {
  const dispatch = useActionDispatch();

  // Handler registered after potential dispatch
  useEffect(() => {
    dispatch('updateUser', { name: 'John' }); // ❌ Handler not ready
  }, []);

  useActionHandler('updateUser', handler); // ❌ Registered too late
}
```

### 2. Error Handling in Handlers

```typescript
// ✅ Good: Comprehensive error handling
useActionHandler('saveUser', async (payload, controller) => {
  try {
    // Validation
    if (!payload.user.email.includes('@')) {
      controller.abort('Invalid email format');
      return;
    }

    // Business logic
    const result = await api.saveUser(payload.user);

    if (!result.success) {
      controller.abort('Save failed', new Error(result.error));
      return;
    }

    // Success handling
    userStore.setValue(result.user);
    return { success: true, user: result.user };

  } catch (error) {
    controller.abort('Unexpected error', error);
  }
});

// ✅ Good: Error boundary integration
const dispatch = useActionDispatch();

const handleSave = async () => {
  try {
    const result = await dispatch('saveUser', { user });
    if (result) {
      // Handle success
    }
  } catch (error) {
    // Handle dispatch errors
    console.error('Save failed:', error);
  }
};
```

### 3. Async Handler Patterns

```typescript
// ✅ Good: Proper async/await usage
useActionHandler('fetchUserData', async (payload, controller) => {
  // Set loading state
  loadingStore.setValue(true);

  try {
    // Parallel async operations
    const [user, settings, preferences] = await Promise.all([
      api.fetchUser(payload.userId),
      api.fetchSettings(payload.userId),
      api.fetchPreferences(payload.userId)
    ]);

    // Update stores
    userStore.setValue(user);
    settingsStore.setValue(settings);
    preferencesStore.setValue(preferences);

    return { success: true };

  } catch (error) {
    controller.abort('Failed to fetch user data', error);
  } finally {
    loadingStore.setValue(false);
  }
});

// ✅ Good: Debounced actions for frequent updates
const debouncedSearch = useMemo(
  () => debounce(async (query: string) => {
    const results = await api.search(query);
    resultsStore.setValue(results);
  }, 300),
  []
);

useActionHandler('search', async (payload) => {
  debouncedSearch(payload.query);
});
```

## 🎨 Component Architecture Best Practices

### 1. Separation of Concerns

```typescript
// ✅ Good: Clear separation between logic and presentation

// Business Logic Component
function UserLogic({ children }: { children: React.ReactNode }) {
  useUserHandlers();           // Register action handlers
  useUserEffects();           // Side effects
  return <>{children}</>;
}

// Pure Presentation Component
function UserProfile() {
  const dispatch = useUserAction();
  const userStore = useStore('user');
  const user = useStoreValue(userStore);

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => dispatch('updateProfile', { name: 'New Name' })}>
        Update
      </button>
    </div>
  );
}

// Integration Component
function UserPage() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserLogic>
          <UserProfile />
        </UserLogic>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

### 2. Provider Organization

```typescript
// ✅ Good: Logical provider hierarchy
function App() {
  return (
    <ErrorBoundary>
      {/* Global actions at the top */}
      <GlobalActionProvider>
        {/* Global state */}
        <GlobalStoreProvider>
          {/* Feature-specific providers */}
          <Router>
            <Routes>
              <Route path="/users" element={
                <UserActionProvider>
                  <UserStoreProvider>
                    <UserPage />
                  </UserStoreProvider>
                </UserActionProvider>
              } />
            </Routes>
          </Router>
        </GlobalStoreProvider>
      </GlobalActionProvider>
    </ErrorBoundary>
  );
}

// ✅ Good: Provider composition with HOCs
const UserPageWithProviders = withProvider(
  withProvider(UserPage, UserStoreProvider),
  UserActionProvider
);
```

### 3. Custom Hook Patterns

```typescript
// ✅ Good: Encapsulate common patterns in custom hooks
function useUser() {
  const userStore = useStore('user');
  const user = useStoreValue(userStore);
  const dispatch = useUserAction();

  const updateProfile = useCallback((updates: Partial<User>) => {
    dispatch('updateProfile', updates);
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch('logout');
  }, [dispatch]);

  return {
    user,
    updateProfile,
    logout,
    isLoggedIn: !!user.id
  };
}

// ✅ Good: Type-safe custom hooks
function useTypedStore<K extends keyof AppStores>(storeName: K) {
  const store = useStore(storeName);
  const value = useStoreValue(store);

  return {
    store,
    value,
    setValue: useCallback((newValue: AppStores[K]) => {
      store.setValue(newValue);
    }, [store]),
    update: useCallback((updater: (current: AppStores[K]) => AppStores[K]) => {
      store.update(updater);
    }, [store])
  };
}
```

## 🚨 Common Pitfalls and Solutions

### 1. Type Widening Issues

```typescript
// ❌ Problem: Type widening
const config = {
  theme: 'dark',        // Type: string (too wide)
  size: 'large'         // Type: string (too wide)
};

// ✅ Solution: Const assertion
const config = {
  theme: 'dark',
  size: 'large'
} as const;             // Type: { readonly theme: 'dark'; readonly size: 'large' }

// ✅ Solution: Explicit typing
type Theme = 'light' | 'dark';
type Size = 'small' | 'medium' | 'large';

const config: { theme: Theme; size: Size } = {
  theme: 'dark',        // Type: Theme
  size: 'large'         // Type: Size
};
```

### 2. Inference Limitations

```typescript
// ❌ Problem: Complex type inference failure
const complexStore = {
  nested: {
    deep: {
      value: computeComplexValue() // Type might be 'any'
    }
  }
};

// ✅ Solution: Explicit return type annotation
function computeComplexValue(): ComplexType {
  // Complex computation
  return result;
}

// ✅ Solution: Type assertion with validation
const complexStore = {
  nested: {
    deep: {
      value: computeComplexValue() as ComplexType
    }
  }
} satisfies StoreDefinition;
```

### 3. Handler Dependency Issues

```typescript
// ❌ Problem: Stale dependencies in handlers
function useUserHandlers() {
  const userStore = useStore('user');

  // Missing dependency array - handler recreated every render
  useActionHandler('updateUser', async (payload) => {
    const user = userStore.getValue();
    userStore.setValue({ ...user, ...payload });
  });
}

// ✅ Solution: Proper dependency management
function useUserHandlers() {
  const userStore = useStore('user');

  const updateHandler = useCallback(async (payload: UpdateUserPayload) => {
    const user = userStore.getValue();
    userStore.setValue({ ...user, ...payload });
  }, [userStore]); // ✅ Proper dependency

  useActionHandler('updateUser', updateHandler);
}
```

## 🔗 Related Sections

- [Store Type Inference](./stores.md) - Store typing fundamentals
- [Action Type Inference](./actions.md) - Action payload typing
- [Advanced Type Features](./advanced.md) - Branded types and utilities

---

**Next**: Learn about [IDE Setup and Tips](./ide-setup.md)