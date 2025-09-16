# Context-Action Framework: Complete Implementation Guide

A comprehensive implementation guide with practical patterns, folder structures, and development conventions for the **Context-Action Framework**.

> **For architectural principles and philosophy, see [Context-Driven Architecture](context-driven-architecture.md)**

## 📋 Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Atomic Context Architecture](#atomic-context-architecture)
3. [5-Layer Architecture](#5-layer-architecture-within-each-atomic-context)
4. [Implementation Patterns](#implementation-patterns)
5. [Sub-features Organization](#sub-features-hierarchical-organization-for-large-scale-contexts)
6. [Development Conventions](#development-conventions)
7. [Quality & Performance](#quality-performance)

---

## Implementation Overview

This guide provides concrete implementation patterns for the Context-Action Framework with the new **5-Layer Hook Architecture**:

### ✅ **Core Implementation Concepts**
- **Atomic Context Structure** - Each context as independent top-level folder
- **5-Layer Hook Architecture** - Specialized hook layers with single responsibilities
- **Delayed Evaluation Pattern** - Handlers get latest values through `store.getValue()`
- **Selective Subscription Model** - UI-focused selective state subscriptions
- **Execution State Observability** - Advanced patterns with useRef + useState + currying
- **Single-Layer Default** - Most contexts use flat structure within each layer
- **Hierarchical Organization** - Use `features/` only for large-scale contexts (10+ components)

### 🎯 **Key Benefits**
- **Independent Development** - Each atomic context can be developed and tested separately
- **Clear Hook Separation** - Each layer has specific hook responsibilities
- **Delayed Evaluation** - Always access latest state values in handlers
- **Selective Performance** - Subscribe only to needed state changes
- **Observable Execution** - Track handler execution state for debugging
- **Scalable Growth** - Start simple, add complexity only when needed

### 🔄 **New Data Flow Pattern**
```
Views → Dispatchers (on~) → Contexts → Registries → Handlers (delayed eval)
  ↑                                                        ↓
Subscriptions ←───────── Store Updates ←──────────────────┘
```

> **Architectural Philosophy**: For theoretical foundation and principles, see [Context-Driven Architecture](context-driven-architecture.md)

---

## Atomic Context Architecture

### Context Unit Types

#### 1. **Domain Context** - Business Logic
- **Purpose**: Core business domain entities and their logic
- **Characteristics**: Reusable across multiple pages, contains business rules
- **Examples**: `user/`, `product/`, `authentication/`, `shopping-cart/`
- **Standard Structure**: 5-layer hook architecture (contexts/, handlers/, subscriptions/, registries/, dispatchers/, views/)
- **Large-Scale**: Use `features/` namespace when hooks exceed ~10 items per layer

#### 2. **Page Context** - UI-Specific State
- **Purpose**: UI state and logic specific to a particular page
- **Characteristics**: Used only within specific pages, isolated from other pages
- **Examples**: `user-dashboard-page/`, `product-list-page/`, `checkout-flow-page/`
- **Standard Structure**: 5-layer hook architecture
- **Large-Scale**: Use `features/` namespace for complex pages with many hook definitions

### Truly Atomic Context Folder Structure

Each context is a completely independent, top-level atomic unit:

```
src/
├── user/                           # 🔍 User Domain (Standard Size)
│   ├── contexts/                   # Context resource type definitions
│   │   ├── UserContext.ts
│   │   └── index.ts
│   ├── handlers/                   # Internal function definitions (single-layer)
│   │   ├── useUserHandlerDefinitions.ts
│   │   └── index.ts
│   ├── subscriptions/              # Selective state subscriptions (single-layer)
│   │   ├── useUserSubscriptions.ts
│   │   └── index.ts
│   ├── registries/                 # Handler registration (single-layer)
│   │   ├── useUserHandlerRegistry.ts
│   │   └── index.ts
│   ├── dispatchers/                # on~ function generation (single-layer)
│   │   ├── useUserDispatchers.ts
│   │   └── index.ts
│   ├── views/                      # UI components (single-layer)
│   │   ├── UserProfile.tsx
│   │   ├── UserList.tsx
│   │   └── index.ts
│   ├── spec.md                     # Context specification
│   ├── dependencies.md             # Dependencies documentation
│   └── index.ts                    # Main exports
│
├── user-profile/                   # 🔍 Independent Evolved Domain
│   ├── contexts/
│   ├── actions/
│   ├── hooks/
│   ├── handlers/
│   ├── viewmodels/
│   ├── views/
│   ├── spec.md                     # Documents dependency on user/
│   ├── dependencies.md
│   └── index.ts
│
├── authentication/                 # 🔍 Authentication Domain
│   ├── contexts/
│   ├── actions/
│   ├── hooks/
│   ├── handlers/
│   ├── viewmodels/
│   ├── views/
│   ├── spec.md
│   ├── dependencies.md
│   └── index.ts
│
├── user-dashboard-page/            # 🔍 Dashboard Page (Standard Size)
│   ├── contexts/
│   ├── handlers/                   # Single-layer (< 10 hook definitions)
│   ├── subscriptions/
│   ├── registries/
│   ├── dispatchers/
│   ├── views/                      # DashboardWidget1.tsx, DashboardWidget2.tsx, etc.
│   ├── spec.md                     # Depends on domain contexts
│   ├── dependencies.md
│   └── index.ts
│
├── large-ecommerce/                # 🔍 Large Domain (Hierarchical Example)
│   ├── contexts/
│   ├── handlers/                   # Core internal function definitions
│   ├── subscriptions/              # Core state subscriptions
│   ├── registries/                 # Core handler registrations
│   ├── dispatchers/                # Core on~ functions
│   ├── views/                      # Core views
│   ├── features/                   # Hierarchical (10+ components)
│   │   ├── product-catalog/
│   │   │   ├── handlers/
│   │   │   ├── subscriptions/
│   │   │   ├── registries/
│   │   │   ├── dispatchers/
│   │   │   └── views/
│   │   ├── shopping-cart/
│   │   │   ├── handlers/
│   │   │   ├── subscriptions/
│   │   │   ├── registries/
│   │   │   ├── dispatchers/
│   │   │   └── views/
│   │   └── payment-processing/
│   │       ├── handlers/
│   │       ├── subscriptions/
│   │       ├── registries/
│   │       ├── dispatchers/
│   │       └── views/
│   ├── spec.md
│   ├── dependencies.md
│   └── index.ts
│
└── shared/                         # 🛠️ Shared utilities (not atomic contexts)
    ├── utils/
    ├── types/
    └── constants/
```

### Atomic Context Dependencies

#### Dependency Rules
```typescript
// ✅ Domain to Domain Dependencies
user-profile/ → user/                    # Profile depends on core user
shopping-cart/ → user/                   # Cart needs user info
authentication/ → user/                  # Auth manages user sessions

// ✅ Page to Domain Dependencies
user-dashboard-page/ → user/             # Dashboard displays user info
user-dashboard-page/ → authentication/   # Dashboard requires auth
checkout-flow-page/ → shopping-cart/     # Checkout processes cart

// ❌ Forbidden Dependencies
user/ → user-profile/                    # Parent cannot depend on child
user/ → user-dashboard-page/             # Domain cannot depend on page
user-dashboard-page/ → checkout-flow-page/  # Page cannot depend on other pages
```

#### Hook-Level Dependency Patterns
```typescript
// ✅ Child domain accessing parent context hooks
// user-profile/subscriptions/useProfileSubscriptions.ts
export function useProfileSubscriptions() {
  const { users, currentUser } = useUserSubscriptions(); // Access parent subscriptions
  const profileStore = useUserStore('profile'); // Access parent stores

  return {
    users,
    currentUser,
    profile: useStoreValue(profileStore),
    isProfileComplete: useStoreValue(profileStore)?.completeness === 100
  };
}

// ✅ Child domain using parent dispatcher
// user-profile/dispatchers/useProfileDispatchers.ts
export function useProfileDispatchers() {
  const dispatch = useUserAction(); // Use parent context dispatcher

  return {
    onUpdateProfile: useCallback((updates, options) => {
      dispatch('updateProfile', { updates }, options);
    }, [dispatch])
  };
}

// ❌ Forbidden: Parent accessing child hooks
// user/subscriptions/useUserSubscriptions.ts
export function useUserSubscriptions() {
  // ❌ Cannot use useProfileSubscriptions() - parent cannot depend on child
  return {
    users: useStoreValue(useUserStore('users')),
    currentUser: useStoreValue(useUserStore('currentUser'))
  };
}
```

#### Context Scale Pattern
- **Default: Single-Layer Organization** - Most contexts use flat structure within each hook layer
- **Large-Scale: Hierarchical Organization** - When hook definitions exceed ~10 items per layer, use `features/`
- **Domain Evolution** - Large hierarchical sub-features can become independent atomic contexts
- **Page Constraint** - Page hierarchical sub-features remain within page context
- **Hook Complexity Threshold** - Use `features/` when handler definitions, dispatchers, or subscriptions become numerous

---

## 5-Layer Architecture (Within Each Atomic Context)

Each atomic context implements a **Context-Layered Architecture** with clear responsibilities:

```
[context-name]/           # Each atomic context has complete structure
├── contexts/         # 🏗️ Context Resource Type Definitions
├── handlers/         # 🔧 Pipe Registration Internal Function Definition Hooks
├── subscriptions/    # 🔗 Selective State Subscription Hooks
├── registries/       # ⚙️ Handler Registration with Context Hooks
├── dispatchers/      # 🚀 on~ Function Generation Hooks (View Interface)
├── views/            # 🖼️ View Components Layer
├── features/         # 🌐 Sub-features namespace (optional)
├── spec.md           # Atomic context specification
├── dependencies.md   # Dependencies documentation
└── index.ts          # Context exports
```

### Layer Responsibilities

#### Layer 1: Context Resource Type Definitions (`contexts/`)
- Define types for available resources through context
- Store and action context creation with type definitions
- Pure context declarations only, no business logic

#### Layer 2: Internal Function Definition Hooks (`handlers/`)
- Define internal functions to be registered in pipe at appropriate timing
- Pre-define handler functions with delayed evaluation
- Implement 3-Step Store Integration: read → logic → update
- Use `useCallback` for memoization, access latest values via `store.getValue()`

#### Layer 3: Selective State Subscription Hooks (`subscriptions/`)
- Selective state subscription or get subscribed state from parent context hooks
- UI update-focused selective subscriptions
- Computed values and derived state
- Access parent context subscriptions when needed

#### Layer 4: Handler Registration Hooks (`registries/`)
- Bring context and register handlers with delayed evaluation
- Register handlers to execute with latest values obtained through delayed evaluation
- Manage handler registration lifecycle
- Observable registration state for debugging

#### Layer 5: on~ Function Generation Hooks (`dispatchers/`)
- Generate on~ functions to execute subscribed actions with appropriate execution options
- View interface layer for action dispatching
- Provide execution options and configuration
- Used by views for user interactions

#### Layer 6: View Components (`views/`)
- UI rendering and user interaction
- Use dispatchers and subscriptions layers only
- No direct context access

---

## Implementation Patterns

### New 5-Layer Implementation Pattern

```typescript
// contexts/UserContext.ts - Resource Type Definitions
interface UserActions {
  createUser: { userData: UserData };
  updateUser: { id: string; updates: Partial<User> };
}

interface UserStores {
  users: User[];
  currentUser: User | null;
}

export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('User');

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext<UserStores>('User', {
  users: { initialValue: [] },
  currentUser: { initialValue: null }
});
```

```typescript
// handlers/useUserHandlerDefinitions.ts - Internal Function Definitions
export function useUserHandlerDefinitions() {
  const usersStore = useUserStore('users');

  const createUserHandler = useCallback(async (payload) => {
    // Step 1: Get latest values (delayed evaluation)
    const currentUsers = usersStore.getValue();

    // Step 2: Business logic
    const processedUser = await processUserData(payload.userData);

    // Step 3: Update stores
    usersStore.setValue([...currentUsers, processedUser]);
  }, [usersStore]);

  const updateUserHandler = useCallback(async (payload) => {
    const users = usersStore.getValue();
    const updatedUsers = users.map(user =>
      user.id === payload.id ? { ...user, ...payload.updates } : user
    );
    usersStore.setValue(updatedUsers);
  }, [usersStore]);

  return {
    createUserHandler,
    updateUserHandler
  };
}
```

```typescript
// subscriptions/useUserSubscriptions.ts - Selective State Subscription
export function useUserSubscriptions() {
  const usersStore = useUserStore('users');
  const currentUserStore = useUserStore('currentUser');

  return {
    users: useStoreValue(usersStore),
    currentUser: useStoreValue(currentUserStore),
    hasUsers: useStoreValue(usersStore).length > 0,
    // Access parent context subscriptions if needed
    authStatus: useAuthSubscriptions?.().status
  };
}
```

```typescript
// registries/useUserHandlerRegistry.ts - Handler Registration
export function useUserHandlerRegistry() {
  const { createUserHandler, updateUserHandler } = useUserHandlerDefinitions();

  // Register handlers at appropriate timing
  useUserActionHandler('createUser', createUserHandler);
  useUserActionHandler('updateUser', updateUserHandler);

  return {
    isRegistered: true,
    handlers: ['createUser', 'updateUser']
  };
}
```

```typescript
// dispatchers/useUserDispatchers.ts - on~ Function Generation
export function useUserDispatchers() {
  const dispatch = useUserAction();

  return {
    onCreateUser: useCallback((userData: UserData, options?: ExecutionOptions) => {
      dispatch('createUser', { userData }, options);
    }, [dispatch]),

    onUpdateUser: useCallback((id: string, updates: Partial<User>, options?: ExecutionOptions) => {
      dispatch('updateUser', { id, updates }, options);
    }, [dispatch])
  };
}
```

```typescript
// views/UserComponent.tsx - View Component
export function UserComponent() {
  const { users, currentUser, hasUsers } = useUserSubscriptions();
  const { onCreateUser, onUpdateUser } = useUserDispatchers();

  return (
    <div>
      <h1>Users: {users.length}</h1>
      {hasUsers && (
        <button onClick={() => onUpdateUser(currentUser.id, { name: 'Updated' })}>
          Update Current User
        </button>
      )}
      <button onClick={() => onCreateUser({ name: 'New User', email: 'new@example.com' })}>
        Create User
      </button>
    </div>
  );
}
```

### Provider Integration Pattern

```typescript
// user/index.ts - Complete Atomic Context Provider
export function UserProvider({ children }) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserHandlerRegistry>  {/* Handler registration component */}
          {children}
        </UserHandlerRegistry>
      </UserStoreProvider>
    </UserActionProvider>
  );
}

// user/registries/UserHandlerRegistry.tsx
function UserHandlerRegistry({ children }) {
  useUserHandlerRegistry(); // Register handlers
  return children;
}

// App composition
function App() {
  return (
    <UserProvider>                          {/* Base domain */}
      <AuthProvider>                        {/* Auth depends on user */}
        <DashboardPageProvider>
          <DashboardPage />
        </DashboardPageProvider>
      </AuthProvider>
    </UserProvider>
  );
}
```

---

## Sub-features: Hierarchical Organization for Large-Scale Contexts

**Sub-features** are used only when a single atomic context becomes very large and complex. Most contexts should use **single-layer approach**.

### When to Use Sub-features
- **General Case**: Keep everything in single layers (`handlers/`, `subscriptions/`, `registries/`, `dispatchers/`, `views/`)
- **Large Scale Only**: Use `features/` namespace when hook definitions exceed ~10 items per layer
- **Hierarchical Organization**: Break down complex domains into manageable sub-features
- **Hook Complexity**: Consider hierarchical when handler definitions, dispatchers, or subscriptions become numerous

### Large Domain Example (Hierarchical)

```typescript
// user/features/profile/handlers/useProfileHandlerDefinitions.ts
export function useProfileHandlerDefinitions() {
  const dispatch = useUserAction(); // Use parent context's dispatcher
  const profileStore = useUserStore('profile'); // Access parent context store

  const updateProfileHandler = useCallback(async (payload) => {
    const currentProfile = profileStore.getValue();
    const updatedProfile = { ...currentProfile, ...payload.updates };
    profileStore.setValue(updatedProfile);
  }, [profileStore]);

  return { updateProfileHandler };
}

// user/features/profile/dispatchers/useProfileDispatchers.ts
export function useProfileDispatchers() {
  const dispatch = useUserAction(); // Use parent context's dispatcher

  return {
    onUpdateProfile: useCallback((updates, options) => {
      dispatch('updateProfile', { updates }, options);
    }, [dispatch])
  };
}

// user/features/profile/subscriptions/useProfileSubscriptions.ts
export function useProfileSubscriptions() {
  const { profile, users } = useUserSubscriptions(); // Access parent subscriptions

  return {
    profile,
    users,
    isComplete: profile?.completeness === 100
  };
}
```

### Special Case: Observable Execution State Hook

```typescript
// handlers/useObservableUserHandlers.ts - Advanced Pattern
export function useObservableUserHandlers() {
  const [executionState, setExecutionState] = useState({
    createUser: { isRunning: false, lastResult: null },
    updateUser: { isRunning: false, lastResult: null }
  });

  const stateRef = useRef(executionState);
  stateRef.current = executionState;

  // Currying for observable handler generation
  const createObservableHandler = useCallback((actionName: string) => {
    return useCallback(async (payload) => {
      // Update execution start state
      setExecutionState(prev => ({
        ...prev,
        [actionName]: { ...prev[actionName], isRunning: true }
      }));

      try {
        // Execute business logic with latest values
        const result = await executeBusinessLogic(payload);

        // Update success state
        setExecutionState(prev => ({
          ...prev,
          [actionName]: { isRunning: false, lastResult: result }
        }));

        return result;
      } catch (error) {
        // Update error state
        setExecutionState(prev => ({
          ...prev,
          [actionName]: { isRunning: false, lastResult: { error } }
        }));
        throw error;
      }
    }, [actionName]);
  }, []);

  return {
    handlers: {
      createUser: createObservableHandler('createUser'),
      updateUser: createObservableHandler('updateUser')
    },
    executionState: stateRef.current,
    isAnyRunning: Object.values(stateRef.current).some(state => state.isRunning)
  };
}
```

### Evolution: Hierarchical → Independent Atomic Context

**Before (Hierarchical Sub-feature):**
```
user/                           # Large-scale user domain
├── features/                   # Hierarchical organization needed
│   └── profile/                # Profile sub-feature (10+ hook definitions)
│       ├── handlers/
│       ├── subscriptions/
│       ├── registries/
│       ├── dispatchers/
│       └── views/
└── spec.md
```

**After (Independent Atomic Context):**
```
user/                           # Simplified original context
├── handlers/                   # Back to single-layer
├── subscriptions/
├── registries/
├── dispatchers/
├── views/
└── spec.md

user-profile/                   # New independent atomic context
├── contexts/                   # Own context definitions
├── handlers/
├── subscriptions/
├── registries/
├── dispatchers/
├── views/
├── spec.md                     # Documents dependency on user/
├── dependencies.md
└── index.ts
```

---

## Development Conventions

### Atomic Context Naming
```
[domain-name]/              # Domain contexts (user/, product/, order/)
[page-name-page]/           # Page contexts (user-dashboard-page/, product-list-page/)
[evolved-domain]/           # Evolved from sub-features (user-profile/, shopping-cart/)
```

### File Naming Standards
```typescript
// Context files
contexts/[Context]Context.ts                    # Context resource type definitions
spec.md                                        # Context specification
dependencies.md                               # Dependencies documentation

// Layer files
handlers/use[Context]HandlerDefinitions.ts    # Internal function definition hooks
subscriptions/use[Context]Subscriptions.ts    # Selective state subscription hooks
registries/use[Context]HandlerRegistry.ts     # Handler registration hooks
dispatchers/use[Context]Dispatchers.ts        # on~ function generation hooks
views/[Component].tsx                          # View layer components

// Registry components (optional)
registries/[Context]HandlerRegistry.tsx       # Handler registration components
```

### Context Structure Pattern
```
[atomic-context]/
├── contexts/               # Context resource type definitions
│   ├── [Context]Context.ts # Context implementation with types
│   └── index.ts           # Context exports
├── handlers/               # Internal function definition layer
│   ├── use[Context]HandlerDefinitions.ts
│   └── index.ts
├── subscriptions/          # Selective state subscription layer
│   ├── use[Context]Subscriptions.ts
│   └── index.ts
├── registries/             # Handler registration layer
│   ├── use[Context]HandlerRegistry.ts
│   ├── [Context]HandlerRegistry.tsx  # Optional component
│   └── index.ts
├── dispatchers/            # on~ function generation layer
│   ├── use[Context]Dispatchers.ts
│   └── index.ts
├── views/                  # UI components
│   ├── [Component].tsx
│   └── index.ts
├── features/               # Sub-features namespace (optional)
│   └── [feature-name]/     # Sub-feature with own 5-layer structure
├── spec.md                 # Atomic context specification
├── dependencies.md         # Dependencies documentation
└── index.ts               # Main context exports
```

### Layer Separation Rules

**Layer Responsibilities**:
- **contexts/**: Context resource type definitions only, no business logic
- **handlers/**: Internal function definitions for pipe registration, delayed evaluation
- **subscriptions/**: Selective state subscriptions, parent context access allowed
- **registries/**: Handler registration with context, observable registration state
- **dispatchers/**: on~ function generation with execution options
- **views/**: Use dispatchers and subscriptions layers only, no direct context access

**Key Pattern**: Each layer has single responsibility with delayed evaluation and selective access

---

## Quality & Performance

### Store Update Conventions

#### Immutability Rules (Immer-based)
```typescript
// ✅ Complete value replacement
userStore.setValue([{ id: '1', name: 'John' }]);

// ✅ Partial updates with Immer
userStore.update(draft => {
  draft.push(newUser);
  draft[0].name = 'Updated Name';
});

// ❌ Direct mutation
const users = useStoreValue(userStore);
users.push(newUser); // Throws: Immer frozen object error
```

#### Store Integration 3-Step Process
```typescript
useActionHandler('updateUser', useCallback(async (payload, controller) => {
  // Step 1: Read current state
  const currentUsers = usersStore.getValue();

  // Step 2: Execute business logic
  const validation = validateData(payload);
  if (!validation.isValid) {
    controller.abort('Validation failed', validation.errors);
    return;
  }

  // Step 3: Update stores
  const updatedUsers = currentUsers.map(user =>
    user.id === payload.id ? { ...user, ...payload.updates } : user
  );
  usersStore.setValue(updatedUsers);
}, [usersStore]));
```

### Performance Guidelines

#### Store Optimization
```typescript
const { Provider, useStore } = createStoreContext('Data', {
  counter: 0,                    // Primitive: reference (default)
  userProfile: {                 // Objects: shallow
    initialValue: { name: '', email: '' },
    strategy: 'shallow'
  },
  complexForm: {                 // Deep nested: deep
    initialValue: { nested: { deep: { values: {} } } },
    strategy: 'deep'
  }
});
```

#### Memoization Patterns
```typescript
// Handler definition memoization
export function useUserHandlerDefinitions() {
  const userStore = useUserStore('users');

  const createUserHandler = useCallback(async (payload) => {
    const currentUsers = userStore.getValue(); // Delayed evaluation
    // Handler logic...
  }, [userStore]);

  return { createUserHandler };
}

// Registry memoization
export function useUserHandlerRegistry() {
  const { createUserHandler } = useUserHandlerDefinitions();

  useUserActionHandler('createUser', createUserHandler); // Auto-memoized

  return { isRegistered: true };
}

// Subscription memoization
export function useUserSubscriptions() {
  const usersStore = useUserStore('users');
  const users = useStoreValue(usersStore);

  const userStats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length
  }), [users]);

  return { users, userStats };
}
```

### Quality Gates

#### Context Specification Requirements
- Each atomic context must have complete `spec.md` and `dependencies.md`
- Hook layer compliance must follow strict separation rules
- TypeScript strict mode compliance across all hook definitions
- Dependencies must follow hierarchy rules
- Delayed evaluation pattern must be used in handlers

#### Validation Checklist
- ✅ Each context is truly atomic and independent
- ✅ Hook layer separation rules are followed strictly
- ✅ Store update patterns use proper immutability with delayed evaluation
- ✅ Handler definitions use proper memoization with `useCallback`
- ✅ Dispatcher functions provide execution options
- ✅ Subscription hooks are selective and performance-optimized
- ✅ Registry hooks manage handler lifecycle properly
- ✅ Dependencies are explicitly documented with hook-level access patterns

---

## Implementation Summary

### ✅ **Key Implementation Patterns**
1. **Atomic Context Structure** - Each context as independent top-level folder with complete 5-layer hook architecture
2. **5-Layer Hook Architecture** - Specialized hook layers with single responsibilities and delayed evaluation
3. **Single-Layer Default** - Most contexts use flat organization within each hook layer
4. **Hierarchical Organization** - Use `features/` namespace only for large-scale contexts (10+ hook definitions per layer)
5. **Delayed Evaluation Pattern** - Handlers access latest state through `store.getValue()`
6. **Selective Subscription Model** - UI-focused selective state subscriptions for performance
7. **Observable Execution State** - Advanced patterns with useRef + useState + currying for debugging
8. **Type-Safe Hook Implementation** - Full TypeScript support with strict mode compliance

### 🚀 **Development Benefits**
- **Independent Development** - Each atomic context can be developed and tested independently
- **Clear Hook Separation** - Each layer has specific hook responsibilities with delayed evaluation
- **Performance Optimization** - Selective subscriptions and latest state access patterns
- **Observable Execution** - Track handler execution state for advanced debugging
- **Scalable Architecture** - Start simple, add hook complexity only when needed
- **Quality Assurance** - Built-in validation, error handling, and performance guidelines

### 🔄 **Data Flow Pattern**
```
Views → Dispatchers (on~) → Contexts → Registries → Handlers (delayed eval)
  ↑                                                        ↓
Subscriptions ←───────── Store Updates ←──────────────────┘
```

### 📈 **Next Steps**
1. **Review [Context-Driven Architecture](context-driven-architecture.md)** for architectural principles
2. **Start with simple atomic contexts** using single-layer hook organization
3. **Implement delayed evaluation pattern** in all handler definitions
4. **Use selective subscriptions** for optimal performance
5. **Apply hierarchical organization** only when hook definitions become numerous (10+ per layer)
6. **Follow hook separation rules** for consistent codebase quality
7. **Implement observable execution patterns** for advanced debugging needs
8. **Apply quality gates** for production-ready applications

This guide enables teams to implement Context-Action hook patterns effectively, creating maintainable and scalable applications with clear architectural boundaries and optimal performance characteristics.