# Core Concepts

Understanding the fundamental concepts of the Context-Action framework is essential for effective implementation. This guide covers the key building blocks and their relationships.

## Architecture Overview

The Context-Action framework implements a clean separation of concerns through three main layers:

```
┌─────────────────────────────────────────────┐
│                VIEW LAYER                   │
│            React Components                 │
│          (UI Presentation)                  │
└─────────────────┬───────────────────────────┘
                  │ dispatch actions
                  ▼
┌─────────────────────────────────────────────┐
│              VIEWMODEL LAYER                │
│             Action Handlers                 │
│           (Business Logic)                  │
└─────────────────┬───────────────────────────┘
                  │ update stores
                  ▼
┌─────────────────────────────────────────────┐
│               MODEL LAYER                   │
│              Store System                   │
│            (State Management)               │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. Domain-Specific Hooks Pattern

The foundation of the framework is creating domain-specific hooks through destructuring assignments:

```typescript
// Define your domain data structure
interface UserData {
  profile: { id: string; name: string; email: string };
  preferences: { theme: 'light' | 'dark'; language: string };
}

// Create domain-specific store hooks
export const {
  Provider: UserProvider,
  useStore: useUserStore,        // Domain-specific store access
  useStores: useUserStores,      // Store registry access
} = createDeclarativeStores<UserData>('User', {
  profile: { initialValue: { id: '', name: '', email: '' } },
  preferences: { initialValue: { theme: 'light', language: 'en' } }
});

// Create domain-specific action hooks
export const {
  Provider: UserActionProvider,
  useAction: useUserAction,      // Domain-specific action dispatcher
  useActionRegister: useUserActionRegister
} = createActionContext<UserActions>({ name: 'UserAction' });
```

**Benefits:**
- Full TypeScript inference
- Clear domain boundaries
- Intuitive, autocomplete-friendly APIs
- Refactoring safety

### 2. Store System

Stores manage state with singleton behavior within provider boundaries:

```typescript
function UserProfile() {
  // Get domain-specific store
  const profileStore = useUserStore('profile');
  
  // Subscribe to changes (reactive)
  const profile = useStoreValue(profileStore);
  
  // Direct store manipulation (when needed)
  const updateName = (name: string) => {
    profileStore.setValue({ ...profile, name });
  };
  
  return <div>Hello, {profile.name}!</div>;
}
```

**Store Patterns:**

1. **Singleton Behavior:** Same store name returns same instance within provider scope
2. **Reactive Subscriptions:** Components automatically re-render on changes
3. **Type Safety:** Full TypeScript support with domain-specific types

### 3. Action Pipeline System

Actions flow through a priority-based handler system:

```typescript
// Define action interface
interface UserActions {
  updateProfile: { data: Partial<UserData['profile']> };
  deleteUser: { userId: string };
  resetUser: void;
}

// Register handlers
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  const updateProfileHandler = useCallback(async (payload, controller) => {
    // Get current state (lazy evaluation)
    const profileStore = registry.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // Validation
    if (!payload.data.email?.includes('@')) {
      controller.abort('Invalid email format');
      return;
    }
    
    // Business logic
    const updatedProfile = { ...currentProfile, ...payload.data };
    profileStore.setValue(updatedProfile);
    
    // Return result
    return { success: true, profile: updatedProfile };
  }, [registry]);
  
  // Register with cleanup
  useEffect(() => {
    if (!register) return;
    const unregister = register('updateProfile', updateProfileHandler, {
      priority: 100,
      blocking: true,
      id: 'profile-updater'
    });
    return unregister; // Important: cleanup on unmount
  }, [register, updateProfileHandler]);
}
```

**Handler Features:**

- **Priority-based execution:** Higher priority handlers run first
- **Blocking/Non-blocking:** Control async execution flow
- **Result collection:** Gather results from multiple handlers
- **Error handling:** Built-in error management and abort mechanisms

### 4. Provider Composition

Organize domains with nested providers:

```typescript
// Domain-specific provider composition
function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <UserHandlersSetup />
        {children}
      </UserActionProvider>
    </UserStoreProvider>
  );
}

// Handler setup component
function UserHandlersSetup() {
  useUserHandlers(); // Register all domain handlers
  return null;
}

// Usage
function App() {
  return (
    <UserProvider>
      <UserProfile />
    </UserProvider>
  );
}
```

## Data Flow Patterns

### 1. Component → Action → Store → Component

The standard reactive flow:

```typescript
function UserEditor() {
  // Subscribe to store
  const profile = useStoreValue(useUserStore('profile'));
  const dispatch = useUserAction();
  
  // Trigger action
  const handleSave = () => {
    dispatch('updateProfile', { 
      data: { name: 'Updated Name' } 
    });
  };
  
  // Component re-renders when profile changes
  return (
    <form onSubmit={handleSave}>
      <input defaultValue={profile.name} />
      <button type="submit">Save</button>
    </form>
  );
}
```

### 2. Handler Access Patterns

Three valid patterns for accessing stores:

```typescript
// Pattern 1: Component access (reactive)
const store = useUserStore('profile');
const profile = useStoreValue(store);

// Pattern 2: Handler access (lazy evaluation)
const handler = async (payload, controller) => {
  const profileStore = registry.getStore('profile');
  const currentProfile = profileStore.getValue(); // Fresh value
};

// Pattern 3: Context Store Pattern (isolated)
const store = UserStores.useStore('profile', initialValue);
```

### 3. Cross-Domain Communication

When domains need to interact:

```typescript
function useUserCartIntegration() {
  // Access multiple domains
  const userProfile = useUserStore('profile');
  const cartItems = useCartStore('items');
  const userAction = useUserAction();
  const cartAction = useCartAction();
  
  const profile = useStoreValue(userProfile);
  const items = useStoreValue(cartItems);
  
  const processCheckout = useCallback(async () => {
    // Cross-domain validation
    if (!profile.id) {
      await userAction('requireLogin', {});
      return;
    }
    
    // Cross-domain action
    await cartAction('processCheckout', {
      userId: profile.id,
      items: items
    });
  }, [profile.id, items, userAction, cartAction]);
  
  return { processCheckout };
}
```

## Handler Registration Patterns

### Best Practice Pattern

Always use `useActionRegister` + `useEffect` with cleanup:

```typescript
function useUserHandlers() {
  const register = useUserActionRegister();
  const registry = useUserRegistry();
  
  // Wrap handler with useCallback
  const handler = useCallback(async (payload, controller) => {
    // Handler logic here
  }, [registry]);
  
  // Register with cleanup
  useEffect(() => {
    if (!register) return;
    
    const unregister = register('actionName', handler, {
      priority: 100,
      blocking: true,
      id: 'unique-handler-id'
    });
    
    return unregister; // Critical: cleanup on unmount
  }, [register, handler]);
}
```

### Handler Configuration Options

```typescript
interface HandlerConfig {
  priority?: number;        // Execution order (higher = first)
  blocking?: boolean;       // Wait for async completion
  tags?: string[];         // For filtering
  id?: string;            // Explicit handler ID
  category?: string;      // Handler category
  returnType?: 'value';   // Enable return value collection
}
```

## Context Boundaries & Domain Isolation

### Single Domain Architecture

```typescript
// Domain-specific stores
const UserStores = createContextStorePattern('User');

// Isolated provider boundary
<UserStores.Provider registryId="user-domain">
  <UserComponents />
</UserStores.Provider>

// Domain-specific usage
const userStore = UserStores.useStore('profile', initialData);
```

### Multi-Domain Architecture

```typescript
function App() {
  return (
    <UserProvider>        {/* User domain boundary */}
      <CartProvider>      {/* Cart domain boundary */}
        <OrderProvider>   {/* Order domain boundary */}
          <ApplicationComponents />
        </OrderProvider>
      </CartProvider>
    </UserProvider>
  );
}
```

## Memory Management

### Store Lifecycle

- **Creation:** Stores are created when first accessed within a provider
- **Persistence:** Stores persist for the lifetime of their provider
- **Cleanup:** Stores are cleaned up when provider unmounts

### Handler Cleanup

```typescript
// ❌ Memory leak - no cleanup
useEffect(() => {
  register('action', handler);
}, []);

// ✅ Proper cleanup
useEffect(() => {
  if (!register) return;
  const unregister = register('action', handler);
  return unregister; // Cleanup on unmount
}, [register, handler]);
```

## Type Safety Features

### Automatic Type Inference

```typescript
// Types are automatically inferred
const store = useUserStore('profile'); // Store<UserProfile>
const profile = useStoreValue(store);  // UserProfile
const dispatch = useUserAction();      // Dispatch<UserActions>
```

### Compile-Time Safety

```typescript
// Invalid action name - compile error
dispatch('invalidAction', {}); 
// TS Error: Argument of type '"invalidAction"' is not assignable

// Invalid payload - compile error  
dispatch('updateProfile', { invalid: 'data' });
// TS Error: Object literal may only specify known properties
```

---

## Summary

The Context-Action framework's core concepts work together to provide:

- **Domain Isolation** through context boundaries
- **Type Safety** with automatic inference
- **Reactive State Management** with minimal re-renders
- **Declarative Actions** with centralized business logic
- **Memory Safety** with proper cleanup patterns

Understanding these concepts enables you to build scalable, maintainable applications with clear architectural boundaries.

---

::: tip Next Steps
Ready to implement? Check out the [Full Implementation Guide](./full) for complete patterns and examples, or jump to [Quick Start](./quick-start) for hands-on coding.
:::