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

This guide provides concrete implementation patterns for the Context-Action Framework:

### ✅ **Core Implementation Concepts**
- **Atomic Context Structure** - Each context as independent top-level folder
- **5-Layer Architecture** - Clear layer responsibilities and separation
- **Single-Layer Default** - Most contexts use flat structure
- **Hierarchical Organization** - Use `features/` only for large-scale contexts (10+ components)
- **Type-Safe Patterns** - Full TypeScript support with strict conventions

### 🎯 **Key Benefits**
- **Independent Development** - Each context can be developed and tested separately
- **Clear Organization** - Predictable structure and file naming
- **Scalable Growth** - Start simple, add complexity only when needed

> **Architectural Philosophy**: For theoretical foundation and principles, see [Context-Driven Architecture](context-driven-architecture.md)

---

## Atomic Context Architecture

### Context Unit Types

#### 1. **Domain Context** - Business Logic
- **Purpose**: Core business domain entities and their logic
- **Characteristics**: Reusable across multiple pages, contains business rules
- **Examples**: `user/`, `product/`, `authentication/`, `shopping-cart/`
- **Standard Structure**: Single-layer organization (actions/, hooks/, handlers/, viewmodels/, views/)
- **Large-Scale**: Use `features/` namespace when components exceed ~10 items per layer

#### 2. **Page Context** - UI-Specific State
- **Purpose**: UI state and logic specific to a particular page
- **Characteristics**: Used only within specific pages, isolated from other pages
- **Examples**: `user-dashboard-page/`, `product-list-page/`, `checkout-flow-page/`
- **Standard Structure**: Single-layer organization
- **Large-Scale**: Use `features/` namespace for complex pages with many widgets

### Truly Atomic Context Folder Structure

Each context is a completely independent, top-level atomic unit:

```
src/
├── user/                           # 🔍 User Domain (Standard Size)
│   ├── contexts/                   # Context definitions
│   │   ├── UserContext.ts
│   │   └── index.ts
│   ├── actions/                    # Action dispatch (single-layer)
│   │   ├── useUserActions.ts
│   │   └── index.ts
│   ├── hooks/                      # Store subscriptions (single-layer)
│   │   ├── useUserState.ts
│   │   └── index.ts
│   ├── handlers/                   # Business logic (single-layer)
│   │   ├── UserHandlers.tsx
│   │   └── index.ts
│   ├── viewmodels/                 # View interfaces (single-layer)
│   │   ├── useUserViewModel.ts
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
│   ├── actions/                    # Single-layer (< 10 components)
│   ├── hooks/
│   ├── handlers/
│   ├── viewmodels/
│   ├── views/                      # DashboardWidget1.tsx, DashboardWidget2.tsx, etc.
│   ├── spec.md                     # Depends on domain contexts
│   ├── dependencies.md
│   └── index.ts
│
├── large-ecommerce/                # 🔍 Large Domain (Hierarchical Example)
│   ├── contexts/
│   ├── actions/                    # Core actions
│   ├── hooks/                      # Core hooks
│   ├── handlers/                   # Core handlers
│   ├── viewmodels/                 # Core viewmodels
│   ├── views/                      # Core views
│   ├── features/                   # Hierarchical (10+ components)
│   │   ├── product-catalog/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── handlers/
│   │   │   ├── viewmodels/
│   │   │   └── views/
│   │   ├── shopping-cart/
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── handlers/
│   │   │   ├── viewmodels/
│   │   │   └── views/
│   │   └── payment-processing/
│   │       ├── actions/
│   │       ├── hooks/
│   │       ├── handlers/
│   │       ├── viewmodels/
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

#### Context Scale Pattern
- **Default: Single-Layer Organization** - Most contexts use flat structure
- **Large-Scale: Hierarchical Organization** - When components exceed ~10 items, use `features/`
- **Domain Evolution** - Large hierarchical sub-features can become independent atomic contexts
- **Page Constraint** - Page hierarchical sub-features remain within page context

---

## 5-Layer Architecture (Within Each Atomic Context)

Each atomic context implements a **Context-Layered Architecture** with clear responsibilities:

```
[context-name]/           # Each atomic context has complete structure
├── contexts/         # 📋 Context Definitions (providers, hooks, types)
├── actions/          # 🚀 Action Dispatching Layer
├── hooks/            # 🔗 Store Subscription Layer
├── handlers/         # ⚙️ Business Logic Layer
├── viewmodels/       # 🎯 View Isolation Layer
├── views/            # 🖼️ View Components Layer
├── features/         # 🌐 Sub-features namespace (optional)
├── spec.md           # Atomic context specification
├── dependencies.md   # Dependencies documentation
└── index.ts          # Context exports
```

### Layer Responsibilities

#### Layer 1: Context Definitions (`contexts/`)
- Pure context declarations and type definitions
- Store and action context creation
- Provider component exports

#### Layer 2: Action Dispatching (`actions/`)
- Action dispatch functions as custom hooks
- No store subscriptions, dispatch only
- Returns action dispatcher interfaces

#### Layer 3: Store Subscription (`hooks/`)
- Store subscriptions and computed values
- No action dispatching, state observation only
- Returns store values and derived state

#### Layer 4: Business Logic (`handlers/`)
- Action handler registration and business logic
- Implements 3-Step Store Integration: read → logic → update
- No JSX rendering, pure logic only

#### Layer 5: View Isolation (`viewmodels/`)
- Composes actions + hooks into view-ready interfaces
- View-specific logic and data transformation
- No direct context access, uses actions and hooks layers

#### Layer 6: View Components (`views/`)
- UI rendering and user interaction
- Consumes ViewModels only
- No direct context access

---

## Implementation Patterns

### Basic Atomic Context Implementation

```typescript
// contexts/UserContext.ts
export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserDomain');

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext<UserStores>('UserDomain', {
  users: { initialValue: [] },
  currentUser: { initialValue: null }
});
```

```typescript
// actions/useUserActions.ts
export function useUserActions() {
  const dispatch = useUserAction();
  return {
    createUser: useCallback((userData) => {
      dispatch('createUser', { userData });
    }, [dispatch]),
    updateUser: useCallback((id, updates) => {
      dispatch('updateUser', { id, updates });
    }, [dispatch])
  };
}
```

```typescript
// hooks/useUserState.ts
export function useUserState() {
  const usersStore = useUserStore('users');
  const currentUserStore = useUserStore('currentUser');

  return {
    users: useStoreValue(usersStore),
    currentUser: useStoreValue(currentUserStore),
    hasUsers: useStoreValue(usersStore).length > 0
  };
}
```

```typescript
// handlers/UserHandlers.tsx
export function UserHandlers({ children }) {
  const usersStore = useUserStore('users');

  useUserActionHandler('createUser', useCallback(async (payload) => {
    // Step 1: Read current state
    const currentUsers = usersStore.getValue();

    // Step 2: Execute business logic
    const processedData = await processUserData(payload.userData);

    // Step 3: Update stores
    usersStore.setValue([...currentUsers, processedData]);
  }, [usersStore]));

  return children;
}
```

```typescript
// viewmodels/useUserViewModel.ts
export function useUserViewModel() {
  const { users, currentUser, hasUsers } = useUserState();
  const { createUser, updateUser } = useUserActions();

  return {
    users,
    currentUser,
    hasUsers,
    createUser,
    updateUser,
    displayName: currentUser?.name || 'Guest'
  };
}
```

```typescript
// views/UserComponent.tsx
export function UserComponent() {
  const { currentUser, displayName, updateUser } = useUserViewModel();

  return (
    <div>
      <h1>{displayName}</h1>
      <button onClick={() => updateUser(currentUser.id, { name: 'Updated' })}>
        Update
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
        <UserHandlers>
          {children}
        </UserHandlers>
      </UserStoreProvider>
    </UserActionProvider>
  );
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
- **General Case**: Keep everything in single layers (`actions/`, `hooks/`, `handlers/`, `viewmodels/`, `views/`)
- **Large Scale Only**: Use `features/` namespace when components exceed ~10 items per layer
- **Hierarchical Organization**: Break down complex domains into manageable sub-features

### Large Domain Example (Hierarchical)

```typescript
// user/features/profile/actions/useProfileActions.ts
export function useProfileActions() {
  const dispatch = useUserAction(); // Use parent context's dispatcher

  return {
    updateProfile: useCallback((updates) => {
      dispatch('updateProfile', { updates });
    }, [dispatch])
  };
}

// user/features/profile/viewmodels/useProfileViewModel.ts
export function useProfileViewModel() {
  const { profile } = useUserState(); // Access parent context state
  const { updateProfile } = useProfileActions();

  return {
    profile,
    updateProfile,
    isComplete: profile?.status === 'complete'
  };
}
```

### Evolution: Hierarchical → Independent Atomic Context

**Before (Hierarchical Sub-feature):**
```
user/                           # Large-scale user domain
├── features/                   # Hierarchical organization needed
│   └── profile/                # Profile sub-feature (10+ components)
│       ├── actions/
│       ├── hooks/
│       ├── handlers/
│       ├── viewmodels/
│       └── views/
└── spec.md
```

**After (Independent Atomic Context):**
```
user/                           # Simplified original context
├── actions/                    # Back to single-layer
├── hooks/
├── handlers/
├── viewmodels/
├── views/
└── spec.md

user-profile/                   # New independent atomic context
├── contexts/                   # Own context definitions
├── actions/
├── hooks/
├── handlers/
├── viewmodels/
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
contexts/[Context]Context.ts    # Context implementation
spec.md                        # Context specification
dependencies.md               # Dependencies documentation

// Layer files
actions/use[Context]Actions.ts     # Action layer hooks
hooks/use[Context]State.ts         # Hook layer hooks
handlers/[Context]Handlers.tsx     # Handler layer components
viewmodels/use[Context]ViewModel.ts # ViewModel layer hooks
views/[Component].tsx              # View layer components
```

### Context Structure Pattern
```
[atomic-context]/
├── contexts/               # Context definitions
│   ├── [Context].ts        # Context implementation
│   └── index.ts           # Context exports
├── actions/                # Action dispatch layer
│   ├── use[Context]Actions.ts
│   └── index.ts
├── hooks/                  # Store subscription layer
│   ├── use[Context]State.ts
│   └── index.ts
├── handlers/               # Business logic layer
│   ├── [Context]Handlers.tsx
│   └── index.ts
├── viewmodels/             # View isolation layer
│   ├── use[Context]ViewModel.ts
│   └── index.ts
├── views/                  # UI components
│   ├── [Component].tsx
│   └── index.ts
├── features/               # Sub-features namespace (optional)
│   └── [feature-name]/     # Sub-feature with own layer structure
├── spec.md                 # Atomic context specification
├── dependencies.md         # Dependencies documentation
└── index.ts               # Main context exports
```

### Layer Separation Rules

**Layer Responsibilities**:
- **contexts/**: Pure context declarations, no business logic
- **actions/**: Action dispatch only, no store subscriptions
- **hooks/**: Store subscriptions only, no action dispatching
- **handlers/**: Business logic with 3-step process, no JSX
- **viewmodels/**: Compose actions + hooks, no direct context access
- **views/**: ViewModel consumption only, no direct context access

**Key Pattern**: Each layer has single responsibility with clear boundaries

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
// Handler memoization
const createUserHandler = useCallback(async (payload) => {
  const currentUsers = userStore.getValue();
  // Handler logic...
}, [userStore]);

useUserActionHandler('createUser', createUserHandler);

// ViewModel memoization
export function useUserViewModel() {
  const { users } = useUserState();

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
- Layer compliance must follow strict separation rules
- TypeScript strict mode compliance across all files
- Dependencies must follow hierarchy rules

#### Validation Checklist
- ✅ Each context is truly atomic and independent
- ✅ Layer separation rules are followed strictly
- ✅ Store update patterns use proper immutability
- ✅ Handler registration uses proper memoization
- ✅ Dependencies are explicitly documented

---

## Implementation Summary

### ✅ **Key Implementation Patterns**
1. **Atomic Context Structure** - Each context as independent top-level folder with complete 5-layer architecture
2. **Single-Layer Default** - Most contexts use flat organization in each layer
3. **Hierarchical Organization** - Use `features/` namespace only for large-scale contexts (10+ components)
4. **Clear Layer Separation** - Each layer with single responsibility and proper dependencies
5. **Type-Safe Implementation** - Full TypeScript support with strict mode compliance

### 🚀 **Development Benefits**
- **Independent Development** - Each atomic context can be developed and tested independently
- **Clear Code Organization** - Predictable folder structure and file naming conventions
- **Scalable Architecture** - Start simple, add complexity only when needed
- **Quality Assurance** - Built-in validation, error handling, and performance guidelines

### 📈 **Next Steps**
1. **Review [Context-Driven Architecture](context-driven-architecture.md)** for architectural principles
2. **Start with simple atomic contexts** using single-layer organization
3. **Apply hierarchical organization** only when contexts become large (10+ components)
4. **Follow development conventions** for consistent codebase quality
5. **Implement quality gates** for production-ready applications

This guide enables teams to implement Context-Action patterns effectively, creating maintainable and scalable applications with clear architectural boundaries.