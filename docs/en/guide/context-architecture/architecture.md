# Context-Action Architecture

## Overview

The Context-Action framework implements a clean separation of concerns through an MVVM-inspired pattern combined with **Context-based Domain Isolation**. This architecture provides:

- **Actions** handle business logic (ViewModel layer)
- **Stores** manage state (Model layer) 
- **Components** render UI (View layer)
- **Context Boundaries** isolate functional domains and enable modular architecture

## Context-Based Domain Isolation

### 1. Core Principle: Domain Separation

The framework uses React Context to create **isolated functional domains**, where each domain has its own:

- **ActionRegister instance** - Independent action pipeline
- **Store registry** - Domain-specific state management
- **Component tree** - UI components within the domain boundary

```typescript
// Each domain gets its own isolated context with all necessary components
const AuthContext = createActionContext<AuthActions>({ name: 'AuthDomain' });
const CartContext = createActionContext<CartActions>({ name: 'CartDomain' });
const UserContext = createActionContext<UserActions>({ name: 'UserDomain' });

// createActionContext returns everything needed for a context domain:
// - Provider: React component to wrap the domain
// - useAction: Hook to get dispatch function
// - useActionHandler: Hook to register handlers
// - useActionContext: Hook to access the full context
```

### 2. Context Boundary Benefits

**Isolation**: Actions and stores within one context cannot directly interfere with another context
**Modularity**: Each domain can be developed, tested, and deployed independently
**Type Safety**: Domain-specific action types are enforced within their context boundaries
**Scalability**: New domains can be added without affecting existing functionality

## Core Architecture

### 1. Context-Scoped Action Pipeline System

Each context maintains its own ActionRegister instance with an isolated action pipeline:

```typescript
// Domain-specific action definitions
interface AuthActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
  refreshToken: { token: string };
}

interface CartActions extends ActionPayloadMap {
  addItem: { productId: string; quantity: number };
  removeItem: { itemId: string };
  calculateTotal: { items: CartItem[] };
}

// Context creation returns all components for domain implementation
const {
  Provider: AuthProvider,
  useAction: useAuthAction,
  useActionHandler: useAuthHandler,
  useActionContext: useAuthContext
} = createActionContext<AuthActions>({ 
  name: 'AuthDomain' 
});

const {
  Provider: CartProvider,
  useAction: useCartAction,
  useActionHandler: useCartHandler,
  useActionContext: useCartContext
} = createActionContext<CartActions>({ 
  name: 'CartDomain' 
});

// Using the Provider from createActionContext
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
```

### 2. Context-Aware Handler Registration

Action handlers are registered within their specific context boundaries:

```typescript
function useAuthHandlers() {
  // Using the hooks returned from createActionContext
  // IMPORTANT: Wrap handlers with useCallback to prevent infinite loops
  
  const loginHandler = useCallback(async (payload, controller) => {
    // This handler only exists within AuthContext
    const authState = authStore.getValue();
    // Business logic here
  }, []); // Add dependencies as needed
  
  const logoutHandler = useCallback(async (payload, controller) => {
    // Completely isolated from other contexts
    authStore.setValue(null);
    sessionStore.clear();
  }, []);
  
  useAuthHandler('login', loginHandler);
  useAuthHandler('logout', logoutHandler);
}
```

### 3. Context-Scoped Store Integration

Action handlers within each context interact with domain-specific stores:

```typescript
// Context-scoped store integration using hooks from createActionContext
function useUserHandlers() {
  const dispatch = useUserAction();
  const registry = useStoreRegistry();
  
  // Wrap handler with useCallback to prevent re-registration
  const updateUserHandler = useCallback(async (payload, controller) => {
    // Get stores from registry within handler
    const userStore = registry.getStore('user');
    const userSettingsStore = registry.getStore('userSettings');
    const userActivityStore = registry.getStore('userActivity');
    
    // Stores are accessed within context boundary
    const currentUser = userStore.getValue();
    const userSettings = userSettingsStore.getValue();
    
    // Domain-specific business logic
    const updatedUser = {
      ...currentUser,
      ...payload,
      lastModified: Date.now(),
      theme: userSettings.theme
    };
    
    // Update domain stores
    userStore.setValue(updatedUser);
    userActivityStore.update(activities => [...activities, {
      type: 'user_updated',
      timestamp: Date.now(),
      userId: payload.id
    }]);
  }, [registry]); // Include registry in dependencies
  
  useUserHandler('updateUser', updateUserHandler);
}

// Cross-context communication (when needed)
function useCrossContextIntegration() {
  // Each context provides its own dispatch function
  const authDispatch = useAuthAction();
  const userDispatch = useUserAction();
  
  // Explicit cross-context communication
  const handleUserProfileUpdate = async (data) => {
    await userDispatch('updateUser', data);
    await authDispatch('refreshToken', { token: data.authToken });
  };
}

// Alternative pattern: Using ActionRegister directly in useEffect
function useAuthHandlersAlt() {
  const { actionRegisterRef } = useAuthContext();
  
  useEffect(() => {
    const register = actionRegisterRef.current;
    if (!register) return;
    
    // Register handlers directly
    const unregisterLogin = register.register('login', async (payload, controller) => {
      const authState = authStore.getValue();
      // Business logic here
    });
    
    const unregisterLogout = register.register('logout', async (payload, controller) => {
      authStore.setValue(null);
      sessionStore.clear();
    });
    
    // Cleanup
    return () => {
      unregisterLogin();
      unregisterLogout();
    };
  }, []); // Dependencies here
}
```

## Key Design Principles

### 1. Context Isolation

- Each context maintains independent ActionRegister instances
- Actions within one context cannot directly access another context's stores
- Context boundaries prevent unintended side effects between domains
- Type safety is enforced within each context boundary

### 2. Lazy Evaluation

- Store getters are called at execution time within context scope
- No stale closure issues - handlers always get current context state
- Context-scoped stores ensure data freshness within domain boundaries

### 3. Modular Decoupled Architecture

- Actions don't know about components or other contexts
- Stores are scoped to their context domain
- Components only know their context's action names and payloads
- Cross-context communication requires explicit bridging

### 4. Domain-Specific Type Safety

- Full TypeScript support within each context
- Context-specific action types and payloads are strongly typed
- Store values maintain type integrity within domain boundaries
- Compile-time checking prevents cross-context type errors

### 5. Isolated Testability

- Each context can be tested independently with domain-specific mock stores
- Context stores can be tested without affecting other domains
- Components can be tested with context-scoped mock dispatch
- Cross-context integration can be tested at the bridge level

## Next Steps

- **Data Flow**: Learn how data moves through the context-based system in [data-flow.md](./data-flow.md)
- **React Integration**: See how to implement these concepts in React in [integration.md](./integration.md)
- **Advanced Patterns**: Explore complex scenarios in [patterns.md](./patterns.md)