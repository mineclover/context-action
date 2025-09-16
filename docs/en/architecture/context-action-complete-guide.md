# Context-Action Framework: Complete Architecture & Implementation Guide

A comprehensive guide to document-centric state management and atomic context architecture based on the **Context-Action Framework**.

## 📋 Table of Contents

1. [Architectural Foundation](#architectural-foundation)
2. [Atomic Context Architecture](#atomic-context-architecture)
3. [Context-Layered Structure](#context-layered-structure)
4. [Implementation Patterns](#implementation-patterns)
5. [Development Conventions](#development-conventions)
6. [Quality & Performance](#quality-performance)
7. [Advanced Topics](#advanced-topics)

---

## Architectural Foundation

### Core Philosophy

> **"The document is the architecture."** - Each context exists as a unit for managing the documents and deliverables of its domain.

Context-Driven Architecture is an innovative architectural approach that overcomes the fundamental limitations of complex state management through **document-centric context separation** and **effective artifact management**, based on the core design principles of the Context-Action framework.

#### Problems with Existing Libraries
- **High React Coupling**: Tight integration makes component modularization and props handling difficult
- **Binary State Approach**: Simple global/local state dichotomy fails to handle specific scope-based separation
- **Inadequate Handler/Trigger Management**: Poor support for complex interactions and business logic processing

#### Context-Action's Solution
- **Document-Artifact Centered Design**: Context separation based on document themes and deliverable management
- **Perfect Separation of Concerns**:
  - View design in isolation → Design Context
  - Development architecture in isolation → Architecture Context
  - Business logic in isolation → Business Context
  - Data validation in isolation → Validation Context
- **Clear Boundaries**: Implementation results maintain distinct, well-defined domain boundaries
- **Effective Document-Artifact Management**: State management library that actively supports the relationship between documentation and deliverables

### Context Definition and Separation Principles

#### Unit of Context Definition

A context signifies a **unit for defining concepts**. Based on this standard, the visual UI is composed of Storybook components, and business logic is structured as an Action Pipeline.

#### Context Separation Principles

##### 1. Separation of Concerns
- A parent context does not perform the functions of a child context.
- A child context does not directly use the data of a parent context.
- Each context has a clear, single responsibility.

##### 2. Dependency Direction
```
Parent Context → Child Context (Allowed)
Child Context ← Parent Context (Forbidden)
```

- **Allowed**: A child context using the data or styles of a parent context.
- **Forbidden**: A parent context directly accessing the data of a child context.
- **Solution**: Adopt a pattern of delegating the definition itself to the parent context.

##### 3. Event-Based Delegation Pattern

```typescript
// Parent Context: Defines the event
const {
  Provider: ParentActionProvider,
  useActionDispatch: useParentAction
} = createActionContext<ParentActions>('ParentContext');

// Child Context: Executes the parent event
function ChildComponent() {
  const parentDispatch = useParentAction();

  const handleChildAction = () => {
    // After performing child tasks, trigger the parent event
    parentDispatch('parentEvent', childData);
  };
}
```

---

## Atomic Context Architecture

### Context Unit Types

The Context-Action Framework defines two primary types of atomic contexts, with features being sub-components of these primary types:

#### 1. **Domain Context** - Business Domain Entities
- **Purpose**: Core business domain entities and their essential logic
- **Characteristics**:
  - Contains fundamental business rules and data
  - Can have sub-features that may become independent domains
  - Independent of UI and page concerns
  - Reusable across multiple pages
- **Examples**: User, Product, Order, Payment, Authentication, Search
- **Location**: Top-level atomic contexts: `user/`, `product/`, `order/`, `authentication/`
- **Standard Structure**: Most domains use single-layer organization (actions/, hooks/, handlers/, viewmodels/, views/)
- **Large-Scale Hierarchical**: Use `features/` namespace only when components exceed ~10 items per layer
- **Evolution to Independent**: Large hierarchical sub-features can become independent atomic contexts
  - `large-ecommerce/features/shopping-cart/` → can become independent `shopping-cart/`

#### 2. **Page Context** - Page-specific State
- **Purpose**: UI state and logic specific to a particular page
- **Characteristics**:
  - Used only within specific pages
  - Can depend on domain contexts but isolated from other pages
  - Contains page-specific UI logic and features
  - Can have sub-features specific to that page
- **Examples**: User Dashboard Page, Product List Page, Checkout Flow Page
- **Location**: Top-level atomic contexts: `user-dashboard-page/`, `product-list-page/`, `checkout-flow-page/`
- **Standard Structure**: Most pages use single-layer organization
- **Large-Scale Hierarchical**: Use `features/` namespace only when widgets/components exceed ~10 items
- **Page Sub-features**: Hierarchical page sub-features remain within the page context and do not become independent domains

### Atomic Context Dependencies and Hierarchy

#### Dependency Rules for Atomic Contexts

**Context Type Classification:**
```typescript
// Domain Contexts (Business Logic)
user/                    # Core user domain
user-profile/           # User profile domain (can depend on user/)
authentication/         # Auth domain (may depend on user/)
shopping-cart/          # Cart domain (may depend on user/, product/)

// Page Contexts (UI-Specific)
user-dashboard-page/    # Dashboard page (can depend on domain contexts)
checkout-flow-page/     # Checkout page (can depend on domain contexts)
product-list-page/      # Product listing page
```

**Allowed Dependencies:**
```typescript
// ✅ Domain to Domain Dependencies
user-profile/ → user/                    # Profile depends on core user
shopping-cart/ → user/                   # Cart needs user info
shopping-cart/ → product/                # Cart contains products
authentication/ → user/                  # Auth manages user sessions

// ✅ Page to Domain Dependencies
user-dashboard-page/ → user/             # Dashboard displays user info
user-dashboard-page/ → user-profile/     # Dashboard shows profile
user-dashboard-page/ → authentication/   # Dashboard requires auth
checkout-flow-page/ → shopping-cart/     # Checkout processes cart
checkout-flow-page/ → authentication/    # Checkout requires auth

// ❌ Forbidden Dependencies
user/ → user-profile/                    # Parent domain cannot depend on child
user/ → user-dashboard-page/             # Domain cannot depend on page
user-dashboard-page/ → checkout-flow-page/  # Page cannot depend on other pages
```

**Sub-feature Dependencies:**
```typescript
// ✅ Sub-feature to Parent Dependencies
user/features/profile/ → user/contexts/  # Feature uses parent context
user/features/profile/ → user/actions/   # Feature uses parent actions

// ✅ Sub-feature to External Dependencies
user/features/profile/ → authentication/ # Feature can depend on other domains

// ❌ Forbidden Sub-feature Dependencies
user/contexts/ → user/features/profile/  # Parent cannot depend on sub-feature
```

**Evolution Rules:**
```typescript
// ✅ Feature Evolution Path
1. Simple: user/ (with basic profile code)
2. Namespace: user/features/profile/ (complex enough for sub-feature)
3. Atomic: user-profile/ (independent domain with user/ dependency)

// ✅ Dependencies After Evolution
user-profile/ → user/                    # Child domain depends on parent
user/ (no profile code)                  # Parent cleaned of child functionality

// ✅ Page Sub-features Stay in Page
user-dashboard-page/features/widgets/    # Always remains page sub-feature
```

#### **Context Scale and Organization Pattern**
- **Default: Single-Layer Organization**: Most atomic contexts use flat structure with all components in main layers
- **Large-Scale: Hierarchical Organization**: When components exceed ~10 items, use `features/` namespace for organization
- **Domain Evolution**: Large hierarchical domain sub-features can become independent atomic contexts
- **Page Constraint**: Page hierarchical sub-features remain within page context (never become independent domains)
- **Atomic Independence**: Each context is completely self-contained with its own 5-layer architecture

### Truly Atomic Context Folder Structure

Each context becomes a completely independent, top-level atomic unit:

```
src/
├── user/                           # 🔍 User Domain (Atomic Context Unit - Standard Size)
│   ├── contexts/                   # Context definitions
│   │   ├── UserContext.ts
│   │   └── index.ts
│   ├── actions/                    # Action dispatch layer (single-layer)
│   │   ├── useUserActions.ts
│   │   └── index.ts
│   ├── hooks/                      # Store subscription layer (single-layer)
│   │   ├── useUserState.ts
│   │   └── index.ts
│   ├── handlers/                   # Business logic layer (single-layer)
│   │   ├── UserHandlers.tsx
│   │   └── index.ts
│   ├── viewmodels/                 # View isolation layer (single-layer)
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
├── user-profile/                   # 🔍 User Profile Domain (Independent Atomic Context)
│   ├── contexts/                   # Profile-specific context
│   ├── actions/
│   ├── hooks/
│   ├── handlers/
│   ├── viewmodels/
│   ├── views/
│   ├── spec.md                     # Depends on user domain
│   ├── dependencies.md
│   └── index.ts
│
├── authentication/                 # 🔍 Authentication Domain (Atomic Context Unit)
│   ├── contexts/
│   ├── actions/
│   ├── hooks/
│   ├── handlers/
│   ├── viewmodels/
│   ├── views/
│   ├── spec.md                     # May depend on user domain
│   ├── dependencies.md
│   └── index.ts
│
├── shopping-cart/                  # 🔍 Shopping Cart Domain (Atomic Context Unit)
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
├── user-dashboard-page/            # 🔍 User Dashboard Page (Atomic Context Unit - Standard Size)
│   ├── contexts/                   # Page-specific context
│   ├── actions/                    # Single-layer (< 10 components)
│   ├── hooks/
│   ├── handlers/
│   ├── viewmodels/
│   ├── views/                      # DashboardWidget1.tsx, DashboardWidget2.tsx, etc.
│   ├── spec.md                     # Depends on domain contexts
│   ├── dependencies.md
│   └── index.ts
│
├── checkout-flow-page/             # 🔍 Checkout Page (Atomic Context Unit - Standard Size)
│   ├── contexts/
│   ├── actions/                    # Single-layer (< 10 components)
│   ├── hooks/
│   ├── handlers/
│   ├── viewmodels/
│   ├── views/                      # PaymentStep.tsx, ConfirmationStep.tsx, etc.
│   ├── spec.md
│   ├── dependencies.md
│   └── index.ts
│
├── large-ecommerce/                # 🔍 Large E-commerce Domain (Hierarchical Example)
│   ├── contexts/
│   ├── actions/                    # Core e-commerce actions
│   ├── hooks/                      # Core e-commerce hooks
│   ├── handlers/                   # Core e-commerce handlers
│   ├── viewmodels/                 # Core e-commerce viewmodels
│   ├── views/                      # Core e-commerce views
│   ├── features/                   # Hierarchical organization (10+ widgets)
│   │   ├── product-catalog/        # Product catalog sub-feature
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── handlers/
│   │   │   ├── viewmodels/
│   │   │   └── views/
│   │   ├── shopping-cart/          # Shopping cart sub-feature
│   │   │   ├── actions/
│   │   │   ├── hooks/
│   │   │   ├── handlers/
│   │   │   ├── viewmodels/
│   │   │   └── views/
│   │   └── payment-processing/     # Payment processing sub-feature
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


#### Context Specification Format

Each atomic context includes a `spec.md` file defining its boundaries and responsibilities:

```markdown
# [Context Name] Context Specification

## Context Information
- **Context ID**: `[type]/[name]`
- **Context Type**: Domain | Feature | Page
- **Version**: x.y.z
- **Created**: Date
- **Last Updated**: Date
- **Owner**: Team Name

## Purpose
Clear description of what this context manages

## Scope
### Included
- List of responsibilities

### Excluded
- What this context does NOT handle (with references to appropriate contexts)

## Context API
### Actions
```typescript
interface [Context]Actions {
  // Action definitions
}
```

### Stores
```typescript
interface [Context]Stores {
  // Store definitions
}
```

## Dependencies
- List of contexts this depends on

## Reusability
- ✅/❌ Reusable across pages
- ✅/❌ Independently testable
- ✅/❌ Can be extended by other contexts
```

---

## Context-Layered Structure

### 5-Layer Architecture (Within Each Atomic Context)

Each atomic context implements a **Context-Layered Architecture** with 5 distinct layers, each with clear responsibilities:

```
[context-name]/           # Each atomic context has its own complete structure
├── contexts/         # 📋 Context Definitions (Providers, hooks, types)
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

#### Layer 1: Context Definitions (`contexts/`)
- **Role**: Atomic context declarations and specifications
- **Rules**: No business logic, pure declarations only
- **Output**: Context providers, hooks, and type definitions

#### Layer 2: Action Dispatching (`actions/`)
- **Role**: Action dispatch functions as custom hooks
- **Rules**: No store subscriptions, dispatch only
- **Output**: Custom hooks that return action dispatcher functions

#### Layer 3: Store Subscription (`hooks/`)
- **Role**: Store subscriptions and computed values
- **Rules**: No action dispatching, state subscription only
- **Output**: Custom hooks that return store values and computed state

#### Layer 4: Business Logic (`handlers/`)
- **Role**: Action handler registration and business logic implementation
- **Rules**: No JSX rendering, pure logic only
- **Output**: Components that register action handlers

#### Layer 5: View Isolation (`viewmodels/`)
- **Role**: View interface composition from actions + hooks
- **Rules**: View-specific logic only, no direct context access
- **Output**: Custom hooks that provide view-ready interfaces

#### Layer 6: View Components (`views/`)
- **Role**: UI rendering and user interaction
- **Rules**: ViewModel consumption only, no direct context access
- **Output**: React components for pages, features, and shared UI


---

## Implementation Patterns

### Atomic Domain Context Implementation

Each atomic domain context is completely self-contained with all layers:

```typescript
// user/contexts/UserContext.ts
interface UserActions extends ActionPayloadMap {
  createUser: { userData: CreateUserData };
  updateUser: { id: string; updates: Partial<User> };
  deleteUser: { id: string };
  fetchUser: { id: string };
  fetchUsers: { filters?: UserFilters };
}

interface UserStores {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

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
  currentUser: { initialValue: null },
  isLoading: { initialValue: false },
  error: { initialValue: null }
});
```

### Atomic Authentication Context Implementation

Authentication as an independent atomic context that depends on user context:

```typescript
// authentication/contexts/AuthContext.ts
import { useUserStore } from '../../user'; // ✅ Atomic context to atomic context dependency

interface AuthActions extends ActionPayloadMap {
  login: { email: string; password: string };
  logout: void;
  refreshToken: void;
  validateSession: void;
  checkPermission: { permission: string };
}

interface AuthStores {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
}

export const {
  Provider: AuthActionProvider,
  useActionDispatch: useAuthAction,
  useActionHandler: useAuthActionHandler
} = createActionContext<AuthActions>('Authentication');

export const {
  Provider: AuthStoreProvider,
  useStore: useAuthStore
} = createStoreContext<AuthStores>('Authentication', {
  session: { initialValue: null },
  isAuthenticated: { initialValue: false },
  isLoading: { initialValue: false },
  permissions: { initialValue: [] }
});
```

### Atomic Page Context Implementation

Page contexts as atomic units that depend on domain contexts:

```typescript
// user-dashboard-page/contexts/DashboardContext.ts
import { useUserStore } from '../../user'; // ✅ Page atomic context to domain atomic context
import { useAuthStore } from '../../authentication'; // ✅ Page atomic context to domain atomic context

interface UserDashboardActions extends ActionPayloadMap {
  toggleWidget: { widgetId: string };
  updateLayout: { layout: DashboardLayout };
  setFilter: { filterType: string; value: any };
  resetDashboard: void;
}

interface UserDashboardStores {
  layout: DashboardLayout;
  visibleWidgets: string[];
  filters: DashboardFilters;
  isCustomizing: boolean;
}

export const {
  Provider: UserDashboardActionProvider,
  useActionDispatch: useUserDashboardAction,
  useActionHandler: useUserDashboardActionHandler
} = createActionContext<UserDashboardActions>('UserDashboard');

export const {
  Provider: UserDashboardStoreProvider,
  useStore: useUserDashboardStore
} = createStoreContext<UserDashboardStores>('UserDashboard', {
  layout: { initialValue: DEFAULT_LAYOUT },
  visibleWidgets: { initialValue: DEFAULT_WIDGETS },
  filters: { initialValue: {} },
  isCustomizing: { initialValue: false }
});
```

### Action Layer Implementation (Within Atomic Context)

Action layer provides clean interfaces for dispatching actions:

```typescript
// user/actions/useUserActions.ts
export function useUserActions() {
  const dispatch = useUserAction();

  return {
    createUser: useCallback((userData: CreateUserData) => {
      dispatch('createUser', { userData });
    }, [dispatch]),

    updateUser: useCallback((id: string, updates: Partial<User>) => {
      dispatch('updateUser', { id, updates });
    }, [dispatch]),

    deleteUser: useCallback((id: string) => {
      dispatch('deleteUser', { id });
    }, [dispatch]),

    fetchUser: useCallback((id: string) => {
      dispatch('fetchUser', { id });
    }, [dispatch]),

    fetchUsers: useCallback((filters?: UserFilters) => {
      dispatch('fetchUsers', { filters });
    }, [dispatch])
  };
}
```

### Hook Layer Implementation (Within Atomic Context)

Hook layer provides store subscriptions and computed values:

```typescript
// user/hooks/useUserState.ts
export function useUserState() {
  const usersStore = useUserStore('users');
  const currentUserStore = useUserStore('currentUser');
  const isLoadingStore = useUserStore('isLoading');
  const errorStore = useUserStore('error');

  const users = useStoreValue(usersStore);
  const currentUser = useStoreValue(currentUserStore);
  const isLoading = useStoreValue(isLoadingStore);
  const error = useStoreValue(errorStore);

  return {
    users,
    currentUser,
    isLoading,
    error,
    hasUsers: users.length > 0,
    isCurrentUserAdmin: currentUser?.role === 'admin',
    displayName: currentUser ?
      `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Anonymous'
      : 'Guest'
  };
}
```

### Handler Layer Implementation (Within Atomic Context)

Handler layer implements business logic through action handlers:

```typescript
// user/handlers/UserHandlers.tsx
export function UserHandlers({ children }: { children: React.ReactNode }) {
  const usersStore = useUserStore('users');
  const currentUserStore = useUserStore('currentUser');
  const isLoadingStore = useUserStore('isLoading');
  const errorStore = useUserStore('error');

  // Create User Handler
  useUserActionHandler('createUser', useCallback(async (payload, controller) => {
    try {
      isLoadingStore.setValue(true);
      errorStore.setValue(null);

      // Business logic validation
      const validation = validateUserData(payload.userData);
      if (!validation.isValid) {
        controller.abort('Validation failed', validation.errors);
        return;
      }

      // API call
      const newUser = await userAPI.create(payload.userData);

      // Update store
      const currentUsers = usersStore.getValue();
      usersStore.setValue([...currentUsers, newUser]);

      // Set result
      controller.setResult(newUser);

    } catch (error) {
      errorStore.setValue(error.message);
      controller.abort('User creation failed', error);
    } finally {
      isLoadingStore.setValue(false);
    }
  }, [usersStore, currentUserStore, isLoadingStore, errorStore]));

  // Update User Handler
  useUserActionHandler('updateUser', useCallback(async (payload, controller) => {
    try {
      isLoadingStore.setValue(true);
      errorStore.setValue(null);

      // Business logic
      const updatedUser = await userAPI.update(payload.id, payload.updates);

      // Update stores
      const currentUsers = usersStore.getValue();
      const updatedUsers = currentUsers.map(user =>
        user.id === payload.id ? updatedUser : user
      );
      usersStore.setValue(updatedUsers);

      // Update current user if it's the same
      const currentUser = currentUserStore.getValue();
      if (currentUser?.id === payload.id) {
        currentUserStore.setValue(updatedUser);
      }

      controller.setResult(updatedUser);

    } catch (error) {
      errorStore.setValue(error.message);
      controller.abort('User update failed', error);
    } finally {
      isLoadingStore.setValue(false);
    }
  }, [usersStore, currentUserStore, isLoadingStore, errorStore]));

  return children;
}
```

### ViewModel Layer Implementation (Within Atomic Context)

ViewModel layer provides view-ready interfaces by combining actions and hooks:

```typescript
// user/viewmodels/UserViewModel.ts
import { useUserState } from '../hooks';
import { useUserActions } from '../actions';

export function useUserViewModel() {
  // State subscription (from hooks layer)
  const {
    users,
    currentUser,
    isLoading,
    error,
    hasUsers,
    isCurrentUserAdmin,
    displayName
  } = useUserState();

  // Action dispatching (from actions layer)
  const {
    createUser,
    updateUser,
    deleteUser,
    fetchUser,
    fetchUsers
  } = useUserActions();

  // View-specific logic
  const canManageUsers = isCurrentUserAdmin;
  const shouldShowEmptyState = !isLoading && !hasUsers;

  // View utility functions
  const getUserById = useCallback((id: string) => {
    return users.find(user => user.id === id);
  }, [users]);

  const getUserDisplayName = useCallback((user: User) => {
    return `${user.firstName} ${user.lastName}`.trim() || 'Anonymous';
  }, []);

  // View interface
  return {
    // State for view
    users,
    currentUser,
    displayName,
    isLoading,
    error,
    hasUsers,
    canManageUsers,
    shouldShowEmptyState,

    // Actions for view
    createUser,
    updateUser,
    deleteUser,
    fetchUser,
    fetchUsers,

    // View utilities
    getUserById,
    getUserDisplayName
  };
}
```

### View Layer Implementation (Within Atomic Context)

View layer consumes ViewModels and focuses purely on UI rendering:

```typescript
// user/views/UserProfile.tsx
import { useUserViewModel } from '../viewmodels';

export function UserProfile() {
  // ViewModel consumption only (no direct context access)
  const {
    currentUser,
    displayName,
    isLoading,
    canManageUsers,
    updateUser,
    getUserDisplayName
  } = useUserViewModel();

  const handleUpdateProfile = useCallback(() => {
    if (currentUser) {
      updateUser(currentUser.id, {
        bio: 'Updated bio from profile component'
      });
    }
  }, [currentUser, updateUser]);

  if (isLoading) {
    return <div>Loading user profile...</div>;
  }

  if (!currentUser) {
    return <div>No user selected</div>;
  }

  return (
    <div className="user-profile">
      <h1>{displayName}</h1>
      <p>Email: {currentUser.email}</p>
      <p>Role: {currentUser.role}</p>

      {currentUser.bio && (
        <div>
          <h3>Bio</h3>
          <p>{currentUser.bio}</p>
        </div>
      )}

      {canManageUsers && (
        <button onClick={handleUpdateProfile}>
          Update Profile
        </button>
      )}
    </div>
  );
}
```

### Sub-features: Hierarchical Organization for Large-Scale Contexts

**Sub-features** are used only when a single atomic context becomes very large and complex. Most contexts should use a **single-layer approach** with all components in the main layers.

#### When to Use Sub-features
- **General Case**: Keep everything in single layers (`actions/`, `hooks/`, `handlers/`, `viewmodels/`, `views/`)
- **Large Scale Only**: Use `features/` namespace when components exceed ~10 items per layer
- **Hierarchical Organization**: Break down complex domains into manageable sub-features

#### Evolution Stages
1. **Single Layer** (Default): All code directly in atomic context layers
2. **Namespace Hierarchical** (Large Scale): Use `features/[feature-name]/` when complexity demands organization
3. **Independent Atomic Context**: Evolved to top-level `[context-name]/` when sub-feature becomes domain-worthy

#### Example: Large User Domain with Hierarchical Sub-features

**Note**: This example shows a large-scale user domain that has grown complex enough to warrant hierarchical organization:

```typescript
// user/features/profile/actions/useProfileActions.ts
export function useProfileActions() {
  const dispatch = useUserAction(); // Use parent context's action dispatcher

  return {
    updateProfile: useCallback((updates: Partial<UserProfile>) => {
      dispatch('updateProfile', { updates }); // Dispatch to parent context
    }, [dispatch]),

    uploadAvatar: useCallback((file: File) => {
      dispatch('uploadAvatar', { file });
    }, [dispatch])
  };
}

// user/features/profile/hooks/useProfileState.ts
export function useProfileState() {
  const userStore = useUserStore('currentUser'); // Access parent context stores
  const currentUser = useStoreValue(userStore);

  return {
    profile: currentUser?.profile || null,
    hasProfile: !!currentUser?.profile,
    isProfileComplete: currentUser?.profile?.completeness === 100
  };
}

// user/features/profile/viewmodels/useProfileViewModel.ts
export function useProfileViewModel() {
  const profileState = useProfileState();
  const profileActions = useProfileActions();

  return {
    ...profileState,
    ...profileActions,
    canEditProfile: profileState.hasProfile
  };
}

// user/features/profile/views/ProfileEditor.tsx
export function ProfileEditor() {
  const { profile, updateProfile, canEditProfile } = useProfileViewModel();

  if (!canEditProfile) {
    return <div>Profile not available</div>;
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateProfile({ bio: 'Updated bio' });
    }}>
      <input value={profile?.bio || ''} />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

#### Example: Large Dashboard Page with Many Widgets

**Note**: This example shows a dashboard page with 10+ widgets requiring hierarchical organization:

```typescript
// user-dashboard-page/features/widgets/actions/useWidgetActions.ts
export function useWidgetActions() {
  const dispatch = useUserDashboardAction(); // Use parent page context

  return {
    addWidget: useCallback((widgetType: string) => {
      dispatch('addWidget', { widgetType });
    }, [dispatch]),

    removeWidget: useCallback((widgetId: string) => {
      dispatch('removeWidget', { widgetId });
    }, [dispatch])
  };
}

// user-dashboard-page/features/widgets/hooks/useWidgetState.ts
export function useWidgetState() {
  const widgetsStore = useUserDashboardStore('visibleWidgets');
  const layoutStore = useUserDashboardStore('layout');

  const widgets = useStoreValue(widgetsStore);
  const layout = useStoreValue(layoutStore);

  return {
    widgets,
    layout,
    widgetCount: widgets.length,
    canAddMoreWidgets: widgets.length < layout.maxWidgets
  };
}
```

#### Sub-feature Provider Integration

```typescript
// user/index.ts
export { UserHandlers } from './handlers';
export { useUserViewModel } from './viewmodels';

// Export sub-feature components
export { ProfileEditor } from './features/profile/views';
export { PreferencesPanel } from './features/preferences/views';

// Main provider includes sub-feature handler registration
function UserDomainProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserHandlers> {/* Handles both core and sub-feature actions */}
          {children}
        </UserHandlers>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

#### Evolution from Hierarchical Sub-feature to Independent Atomic Context

When a hierarchical sub-feature becomes complex enough (domain-worthy), it evolves to an independent atomic context:

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
├── actions/                    # Back to single-layer (profile code removed)
├── hooks/
├── handlers/
├── viewmodels/
├── views/
└── spec.md

user-profile/                   # New independent atomic context
├── contexts/                   # Own context definitions
├── actions/                    # Profile-specific actions
├── hooks/                      # Profile-specific hooks
├── handlers/                   # Profile-specific handlers
├── viewmodels/                 # Profile-specific viewmodels
├── views/                      # Profile-specific views
├── spec.md                     # Documents dependency on user/
├── dependencies.md
└── index.ts
```

**Migration Process:**
1. Create new `user-profile/` atomic context with full 5-layer structure
2. Move profile-specific code from `user/features/profile/` to `user-profile/`
3. Update `user-profile/` to depend on `user/` context
4. Remove `user/features/profile/` folder
5. Update imports and provider composition
6. Document dependencies in `user-profile/dependencies.md`

---

## Development Conventions

### Naming Conventions

#### Atomic Context Naming Rules
```
[domain-name]/              # Domain atomic contexts (user/, product/, order/)
[page-name-page]/           # Page atomic contexts (user-dashboard-page/, product-list-page/)
[evolved-domain]/           # Evolved from sub-features (user-profile/, shopping-cart/)
```

#### File Naming Rules
```typescript
// Context files
context.ts              # Context definitions
spec.md                # Context specification
dependencies.md        # Dependency documentation

// Layer files
use[Context]Actions.ts     # Action layer hooks
use[Context]State.ts       # Hook layer hooks
[Context]Handlers.tsx      # Handler layer components
[Context]ViewModel.ts      # ViewModel layer hooks
[Context]Component.tsx     # View layer components
```

### File Structure Standards

Each atomic context is completely independent and follows this structure:

```
[atomic-context]/
├── contexts/               # Context definitions (stores, actions, providers)
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

### Type Definitions

#### Action Payload Interfaces
```typescript
// Always extend ActionPayloadMap for compatibility
interface UserActions extends ActionPayloadMap {
  createUser: { userData: CreateUserData };
  updateUser: { id: string; updates: Partial<User> };
  deleteUser: { id: string };
  fetchUser: { id: string };
  fetchUsers: { filters?: UserFilters };
}

// For simpler cases (future approach)
interface UserActions {
  createUser: { userData: CreateUserData };
  updateUser: { id: string; updates: Partial<User> };
  deleteUser: { id: string };
}
```

#### Store Type Interfaces
```typescript
// Store interface for type safety
interface UserStores {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

// Alternative approach with direct values
const userStoreConfig = {
  users: { initialValue: [] as User[] },
  currentUser: { initialValue: null as User | null },
  isLoading: { initialValue: false },
  error: { initialValue: null as string | null }
};
```

### Code Style Guidelines

#### Layer Separation Rules

**contexts/** - Pure Declarations
```typescript
// ✅ Correct: Pure context declarations
export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserDomain');

// ❌ Incorrect: Business logic in contexts
// No useEffect, API calls, or business rules
```

**actions/** - Action Dispatch Only
```typescript
// ✅ Correct: Pure action dispatching
export function useUserActions() {
  const dispatch = useUserAction();
  return {
    createUser: useCallback((userData) => {
      dispatch('createUser', { userData });
    }, [dispatch])
  };
}

// ❌ Incorrect: Store subscriptions in actions
// No useStoreValue or store access
```

**hooks/** - Store Subscription Only
```typescript
// ✅ Correct: Pure store subscriptions
export function useUserState() {
  const usersStore = useUserStore('users');
  const users = useStoreValue(usersStore);
  return { users, hasUsers: users.length > 0 };
}

// ❌ Incorrect: Action dispatching in hooks
// No dispatch calls or action handlers
```

**handlers/** - Business Logic Only
```typescript
// ✅ Correct: Pure business logic
export function UserHandlers({ children }) {
  useUserActionHandler('createUser', useCallback(async (payload) => {
    // Business logic implementation
  }, []));

  return children;
}

// ❌ Incorrect: UI rendering in handlers
// No JSX besides children passthrough
```

**viewmodels/** - View Interface Only
```typescript
// ✅ Correct: View interface composition
export function useUserViewModel() {
  const state = useUserState();    // Hook layer
  const actions = useUserActions(); // Action layer

  return { ...state, ...actions };
}

// ❌ Incorrect: Direct context access
// No direct useUserStore or useUserAction calls
```

**views/** - ViewModel Consumption Only
```typescript
// ✅ Correct: ViewModel consumption
export function UserProfile() {
  const { users, createUser } = useUserViewModel();
  return <div>{users.length}</div>;
}

// ❌ Incorrect: Direct context access
// No useUserStore, useUserAction, or useUserActionHandler
```

### Provider Composition Patterns

#### Atomic Context Providers

Each atomic context has its own complete provider:

```typescript
// user/index.ts - User Atomic Context Provider
export function UserProvider({ children }: { children: React.ReactNode }) {
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

// authentication/index.ts - Authentication Atomic Context Provider
export function AuthenticationProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthActionProvider>
      <AuthStoreProvider>
        <AuthHandlers>
          {children}
        </AuthHandlers>
      </AuthStoreProvider>
    </AuthActionProvider>
  );
}

// shopping-cart/index.ts - Shopping Cart Atomic Context Provider
export function ShoppingCartProvider({ children }: { children: React.ReactNode }) {
  return (
    <ShoppingCartActionProvider>
      <ShoppingCartStoreProvider>
        <ShoppingCartHandlers>
          {children}
        </ShoppingCartHandlers>
      </ShoppingCartStoreProvider>
    </ShoppingCartActionProvider>
  );
}

// user-dashboard-page/index.ts - User Dashboard Page Atomic Context Provider
export function UserDashboardPageProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserDashboardActionProvider>
      <UserDashboardStoreProvider>
        <UserDashboardHandlers>
          {children}
        </UserDashboardHandlers>
      </UserDashboardStoreProvider>
    </UserDashboardActionProvider>
  );
}
```

#### Hierarchical Atomic Context Composition

Following atomic context dependency hierarchy:

```typescript
function App() {
  return (
    {/* Atomic Domain Contexts - Independent with clear dependencies */}
    <UserProvider>                          {/* Base user domain */}
      <ProductProvider>                     {/* Independent product domain */}
        <AuthenticationProvider>            {/* Auth depends on user */}
          <ShoppingCartProvider>            {/* Cart depends on user & product */}

            {/* Atomic Page Contexts - Depend on domain contexts */}
            <UserDashboardPageProvider>
              <UserDashboardPage />
            </UserDashboardPageProvider>

          </ShoppingCartProvider>
        </AuthenticationProvider>
      </ProductProvider>
    </UserProvider>
  );
}

// Alternative: Separate page apps with same domain foundation
function CheckoutApp() {
  return (
    {/* Same atomic domain foundation */}
    <UserProvider>
      <ProductProvider>
        <AuthenticationProvider>
          <ShoppingCartProvider>

            {/* Different atomic page context */}
            <CheckoutFlowPageProvider>
              <CheckoutFlowPage />
            </CheckoutFlowPageProvider>

          </ShoppingCartProvider>
        </AuthenticationProvider>
      </ProductProvider>
    </UserProvider>
  );
}

// Route-based composition for SPA
function AppRouter() {
  return (
    <UserProvider>
      <AuthenticationProvider>
        <Router>
          <Routes>
            <Route path="/dashboard" element={
              <UserDashboardPageProvider>
                <UserDashboardPage />
              </UserDashboardPageProvider>
            } />
            <Route path="/checkout" element={
              <ShoppingCartProvider>
                <CheckoutFlowPageProvider>
                  <CheckoutFlowPage />
                </CheckoutFlowPageProvider>
              </ShoppingCartProvider>
            } />
          </Routes>
        </Router>
      </AuthenticationProvider>
    </UserProvider>
  );
}
```

---

## Quality & Performance

### Store Update Conventions

#### Immutability Rules

Context-Action Framework uses **Immer** internally for store state management. All store updates must follow proper conventions:

**Correct Store Update Methods:**
```typescript
const userStore = useUserStore('users');

// ✅ Complete value replacement
userStore.setValue([{ id: '1', name: 'John' }]);

// ✅ Partial updates with Immer
userStore.update(draft => {
  draft.push(newUser);
  draft[0].name = 'Updated Name';
  return draft; // Optional: Immer handles this
});

// ✅ Map/Set operations
const cacheStore = useAppStore('cache');
cacheStore.update(draft => {
  draft.memoryCache.set('key', value);
  draft.redisCache.delete('oldKey');
});
```

**Forbidden Patterns:**
```typescript
// ❌ Direct mutation of store values
const users = useStoreValue(userStore);
users.push(newUser); // Throws: Immer frozen object error

// ❌ Direct property assignment
const user = useStoreValue(userStore);
user.name = 'John'; // Throws: Cannot assign to read only property
```

#### Store Integration 3-Step Process

All action handlers must follow this standardized pattern:

```typescript
useActionHandler('updateUser', useCallback(async (payload, controller) => {
  // Step 1: Read current state
  const currentUsers = usersStore.getValue();
  const currentUser = currentUserStore.getValue();

  // Step 2: Execute business logic
  const validation = validateUserUpdate(payload);
  if (!validation.isValid) {
    controller.abort('Validation failed', validation.errors);
    return;
  }

  const updatedUser = {
    ...currentUser,
    ...payload.updates,
    updatedAt: new Date().toISOString()
  };

  // Step 3: Update stores using proper methods
  const updatedUsers = currentUsers.map(user =>
    user.id === payload.id ? updatedUser : user
  );
  usersStore.setValue(updatedUsers);

  // Side effects (API calls, notifications)
  await syncUserToAPI(updatedUser);

}, [usersStore, currentUserStore]));
```

### Performance Guidelines

#### Store Optimization

**Comparison Strategy Selection:**
```typescript
const {
  Provider: DataStoreProvider,
  useStore: useDataStore
} = createStoreContext('Data', {
  // Primitive values: reference (default)
  counter: 0,
  isLoading: false,

  // Objects with property changes: shallow
  userProfile: {
    initialValue: { name: '', email: '' },
    strategy: 'shallow'
  },

  // Deeply nested objects: deep
  complexForm: {
    initialValue: { nested: { deep: { values: {} } } },
    strategy: 'deep'
  },

  // Performance-critical: reference
  largeDataset: {
    initialValue: [] as DataItem[],
    strategy: 'reference'
  }
});
```

#### Memoization Patterns

**Handler Memoization:**
```typescript
function UserHandlers() {
  const userStore = useUserStore('users');

  // Proper memoization with dependencies
  const createUserHandler = useCallback(async (payload) => {
    const currentUsers = userStore.getValue();
    // Handler logic...
  }, [userStore]);

  useUserActionHandler('createUser', createUserHandler);
}
```

**ViewModel Memoization:**
```typescript
export function useUserViewModel() {
  const { users, isLoading } = useUserState();
  const { createUser } = useUserActions();

  // Computed value memoization
  const userStats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length
  }), [users]);

  return {
    users,
    userStats,
    isLoading,
    createUser
  };
}
```

#### Action Optimization

**Debounce/Throttle Configuration:**
```typescript
// Search actions use debounce
useSearchActionHandler('performSearch', searchHandler, {
  debounce: 300,
  id: 'search-handler'
});

// Scroll actions use throttle
useUIActionHandler('updateScrollPosition', scrollHandler, {
  throttle: 100,
  id: 'scroll-handler'
});

// Critical actions are blocking
useUserActionHandler('saveUser', saveHandler, {
  blocking: true,
  once: false,
  id: 'save-user-handler'
});
```

### Error Handling

#### Context-Level Error Boundaries

```typescript
// Domain-specific error boundary
function UserDomainErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={<UserErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('User domain error:', error, errorInfo);
        // Domain-specific error reporting
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function UserDomainProvider({ children }) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserDomainErrorBoundary>
          <UserHandlers>
            {children}
          </UserHandlers>
        </UserDomainErrorBoundary>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

#### Action Error Handling

```typescript
useUserActionHandler('createUser', useCallback(async (payload, controller) => {
  try {
    // Input validation
    if (!payload.userData || !payload.userData.email) {
      controller.abort('Invalid user data: email is required');
      return;
    }

    // Business logic
    const result = await userAPI.create(payload.userData);

    // Success state update
    const currentUsers = usersStore.getValue();
    usersStore.setValue([...currentUsers, result]);

    // Set result
    controller.setResult(result);

  } catch (error) {
    // Typed error handling
    if (error instanceof ValidationError) {
      controller.abort('User validation failed', error);
    } else if (error instanceof NetworkError) {
      controller.abort('Network error occurred', error);
    } else {
      controller.abort('User creation failed', error);
    }
  }
}, [usersStore]));
```

---

## Advanced Topics

### Design System Integration

#### CVA-Based Component Styling

Components in each context integrate with design systems via **CVA (Class Variance Authority)**:

```typescript
// Separate style and interaction parameters
interface ButtonProps {
  // Style parameters
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';

  // Interaction parameters
  onClick: () => void;
  disabled?: boolean;
}

const buttonVariants = cva(
  "button-base", // Base style
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white",
        secondary: "bg-gray-200 text-gray-800",
        danger: "bg-red-500 text-white"
      },
      size: {
        sm: "px-2 py-1 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
      }
    }
  }
);

// Control style changes via interactions
const [variant, setVariant] = useState<'primary' | 'secondary'>('primary');

const handleInteraction = () => {
  // Change the parameter, not the style directly
  setVariant(prev => prev === 'primary' ? 'secondary' : 'primary');
};
```

#### Design Token System

```css
/* Base layer tokenization */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;

  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;

  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
}
```

### Business Logic Management

#### Data Flow and Validation System

```typescript
// Domain data definition
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
}

// Business rule validation
class UserProfileValidator {
  static validate(profile: Partial<UserProfile>): ValidationResult {
    const errors: string[] = [];

    if (profile.name && profile.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// API service definition
class UserAPIService {
  static async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      throw new UserAPIError(`Update failed: ${response.statusText}`);
    }

    return response.json();
  }
}
```

#### State Scenario Definition

```typescript
// User journey state definition
type UserJourneyState =
  | 'unauthenticated'
  | 'authenticating'
  | 'profile_incomplete'
  | 'profile_complete'
  | 'email_verification_required'
  | 'account_suspended';

// State transition logic
const UserJourneyMachine = {
  transitions: {
    unauthenticated: ['authenticating'],
    authenticating: ['profile_incomplete', 'profile_complete', 'account_suspended'],
    profile_incomplete: ['profile_complete', 'email_verification_required'],
    profile_complete: ['unauthenticated', 'account_suspended'],
    email_verification_required: ['profile_complete', 'unauthenticated'],
    account_suspended: ['unauthenticated']
  },

  canTransition(from: UserJourneyState, to: UserJourneyState): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
};

// State-based UI rendering with ViewModels
function useUserJourneyViewModel() {
  const { journeyState } = useUserState();

  const getComponentForState = useCallback(() => {
    switch (journeyState) {
      case 'unauthenticated':
        return 'LoginForm';
      case 'authenticating':
        return 'LoadingSpinner';
      case 'profile_incomplete':
        return 'ProfileSetupForm';
      case 'profile_complete':
        return 'Dashboard';
      case 'email_verification_required':
        return 'EmailVerificationPrompt';
      case 'account_suspended':
        return 'SuspensionNotice';
      default:
        return 'ErrorFallback';
    }
  }, [journeyState]);

  return {
    journeyState,
    componentToRender: getComponentForState(),
    canTransition: (to: UserJourneyState) =>
      UserJourneyMachine.canTransition(journeyState, to)
  };
}
```

### Migration Guidelines

#### From Legacy Patterns

**Before (Legacy Pattern):**
```typescript
// Mixed responsibilities
function UserComponent() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const createUser = async (userData) => {
    setIsLoading(true);
    try {
      const newUser = await api.createUser(userData);
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => createUser({name: 'John'})}>
        Create User
      </button>
    </div>
  );
}
```

**After (Context-Action Atomic Pattern):**
```typescript
// 1. Atomic Context
// user/contexts/UserContext.ts
export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserDomain');

// 2. Action Layer
// user/actions/useUserActions.ts
export function useUserActions() {
  const dispatch = useUserAction();
  return {
    createUser: useCallback((userData) => {
      dispatch('createUser', { userData });
    }, [dispatch])
  };
}

// 3. Hook Layer
// user/hooks/useUserState.ts
export function useUserState() {
  const usersStore = useUserStore('users');
  const isLoadingStore = useUserStore('isLoading');

  return {
    users: useStoreValue(usersStore),
    isLoading: useStoreValue(isLoadingStore)
  };
}

// 4. Handler Layer
// user/handlers/UserHandlers.tsx
export function UserHandlers({ children }) {
  const usersStore = useUserStore('users');
  const isLoadingStore = useUserStore('isLoading');

  useUserActionHandler('createUser', useCallback(async (payload) => {
    try {
      isLoadingStore.setValue(true);
      const newUser = await api.createUser(payload.userData);
      const currentUsers = usersStore.getValue();
      usersStore.setValue([...currentUsers, newUser]);
    } catch (error) {
      console.error(error);
    } finally {
      isLoadingStore.setValue(false);
    }
  }, [usersStore, isLoadingStore]));

  return children;
}

// 5. ViewModel Layer
// user/viewmodels/UserViewModel.ts
export function useUserViewModel() {
  const { users, isLoading } = useUserState();
  const { createUser } = useUserActions();

  return {
    users,
    isLoading,
    createUser,
    hasUsers: users.length > 0
  };
}

// 6. View Layer
// user/views/UserComponent.tsx
export function UserComponent() {
  const { users, isLoading, createUser, hasUsers } = useUserViewModel();

  const handleCreateUser = useCallback(() => {
    createUser({ name: 'John' });
  }, [createUser]);

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {hasUsers ? (
        users.map(user => (
          <div key={user.id}>{user.name}</div>
        ))
      ) : (
        <div>No users found</div>
      )}
      <button onClick={handleCreateUser}>
        Create User
      </button>
    </div>
  );
}

// 7. Provider Setup
function App() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserHandlers>
          <UserComponent />
        </UserHandlers>
      </UserStoreProvider>
    </UserActionProvider>
  );
}
```

### Best Practices Summary

#### Architectural Principles

1. **Context Isolation**: Each atomic context has clear boundaries and responsibilities
2. **Layer Separation**: Each layer has a single responsibility and clear interfaces
3. **Dependency Hierarchy**: Follow the domain → feature → page dependency flow
4. **View Isolation**: Views consume ViewModels only, never direct contexts
5. **Business Logic Centralization**: All business logic in handlers, never in components

#### Development Workflow

1. **Context Design**: Start with context specifications and dependencies
2. **Layer Implementation**: Implement layers in dependency order (contexts → actions → hooks → handlers → viewmodels → views)
3. **Testing Strategy**: Test each layer independently and integration between layers
4. **Provider Composition**: Follow hierarchical provider composition patterns
5. **Performance Monitoring**: Monitor store update frequencies and handler execution times

#### Quality Gates

1. **Context Specification**: Each context must have complete spec.md and dependencies.md
2. **Layer Compliance**: Each file must follow layer-specific rules and restrictions
3. **Type Safety**: All interfaces must be properly typed with TypeScript strict mode
4. **Dependency Validation**: Dependencies must follow hierarchy rules and be documented
5. **Performance Validation**: Store strategies must be appropriate for data characteristics

---

## Conclusion

Context-Driven Architecture with atomic context isolation enables:

1. **Clear Domain Separation** through document-centric design and atomic context specifications
2. **Predictable Business Logic Processing** with the 5-layer Context-Layered architecture
3. **Safe State Management** using Immer-based store patterns and immutability enforcement
4. **Improved Maintainability** via context isolation, layer separation, and dependency hierarchy
5. **Enhanced Scalability** through reusable domain/feature contexts and composable patterns

This architecture creates a **living system where documentation and code align**, supporting team collaboration and sustainable development of large-scale applications through atomic context management and clear separation of concerns.

The Context-Action Framework provides not just a technical solution, but a comprehensive approach to building maintainable, scalable, and well-documented applications that evolve gracefully over time.