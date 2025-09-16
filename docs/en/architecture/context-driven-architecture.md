# Context-Driven Architecture

A guide to document-centric state management and business logic architecture based on the **Context-Action Framework**.

## Overview

Context-Driven Architecture is an innovative architectural approach that overcomes the fundamental limitations of complex state management through **document-centric context separation** and **effective artifact management**, based on the core design principles of the Context-Action framework.

### Core Philosophy

> **"The document is the architecture."** - Each context exists as a unit for managing the documents and deliverables of its domain.

A context signifies a **unit for defining concepts**. Based on this standard, the visual UI is composed of Storybook components, and business logic is structured as an Action Pipeline.

## Context Definition and Separation Principles

### Unit of Context Definition

#### Atomic Context Types

The Context-Action Framework defines two primary types of atomic contexts:

**1. Domain Context** - Business Domain Entities
- **Purpose**: Core business domain entities and their essential logic
- **Characteristics**: Contains fundamental business rules, can have sub-features that may evolve into independent domains
- **Examples**: User, Product, Order, Payment, Authentication, Search
- **Evolution**: Domain features can grow into independent domains (`domains/user/profile` → `domains/user-profile`)

**2. Page Context** - Page-specific State
- **Purpose**: UI state and logic specific to a particular page
- **Characteristics**: Used only within specific pages, can depend on domain contexts, isolated from other pages
- **Examples**: User Dashboard Page, Product List Page, Checkout Flow Page
- **Features**: Page features remain within the page context and don't become independent domains

#### Context Hierarchy and Evolution

```
📁 Domain Contexts    - Independent Business Logic
  ├── 📦 Core domains (User, Product, Order)
  ├── 🔄 Evolved domains (User-Profile, Shopping-Cart, Authentication)
  ├── 🔗 Domain dependencies allowed (child → parent)
  └── 🌐 Reusable across multiple pages

📁 Page Contexts     - Isolated Page Logic
  ├── 🎯 Page-specific UI state and logic
  ├── 👤 Can depend on domains but isolated from other pages
  ├── 📱 Page features stay within page boundaries
  └── ❌ No dependencies on other pages

🔄 Evolution Pattern:
Domain Feature → Independent Domain (when complex enough)
Page Feature → Stays in Page (never becomes independent domain)
```

### Context Separation Principles

#### 1. Separation of Concerns
- A parent context does not perform the functions of a child context.
- A child context does not directly use the data of a parent context.
- Each context has a clear, single responsibility.

#### 2. Dependency Direction

**Domain to Domain Dependencies:**
```
Domain (Child) → Domain (Parent) (Allowed)
Domain (Parent) → Domain (Child) (Forbidden)
```

**Page to Domain Dependencies:**
```
Page → Domain (Allowed)
Domain → Page (Forbidden)
```

**Page to Page Dependencies:**
```
Page ↔ Page (Forbidden - Complete Isolation)
```

- **Allowed**: Child domain using parent domain data, pages using any domain data
- **Forbidden**: Parent domain accessing child domain data, domains accessing page data, pages accessing other pages
- **Evolution**: When domain features become complex, they evolve into independent child domains that depend on their parent

#### 3. Event-Based Delegation Pattern

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

## Implementation with Context-Action Framework

### 1. Action Pipeline System (ActionRegister)

The core of Context-Action, `ActionRegister`, provides priority-based handler execution.

#### Key Features
- **Priority-Based Execution**: Handlers are sorted and executed by `priority`.
- **Multiple Execution Modes**: Supports `sequential`, `parallel`, and `race` modes.
- **Advanced Control**: Supports `throttle`, `debounce`, and `abort`.
- **Memory Safety**: Automatic cleanup and management of `unregister` functions.

#### Implementation Example

```typescript
// 1. Define Action Types (Business Logic)
interface UserActions {
  updateProfile: { name: string; email: string };
  deleteUser: { userId: string };
  logout: void;
}

// 2. Create Action Context (Business Logic Layer)
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// 3. Implement Business Logic (Handler Layer)
function UserBusinessLogic({ children }) {
  const userStore = useUserStore('profile');

  // High-priority handler (Security validation)
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Step 1: Read current state
    const currentProfile = userStore.getValue();

    // Step 2: Execute business logic
    if (!validateProfile(payload)) {
      throw new Error('Invalid profile data');
    }

    // Step 3: Update state
    userStore.setValue({
      ...currentProfile,
      ...payload,
      lastUpdated: Date.now()
    });

    // API call
    await saveProfile(payload);
  }, [userStore]), { priority: 100 });

  // Low-priority handler (Logging)
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    console.log('Profile updated:', payload);
    // Send analytics data
    analytics.track('profile_updated', payload);
  }, []), { priority: 0 });

  return children;
}

// 4. UI Component (Pure Presentation)
function UserProfile() {
  const dispatch = useUserAction();
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);

  return (
    <div>
      <h1>{profile.name}</h1>
      <button onClick={() => dispatch('updateProfile', {
        name: 'New Name',
        email: 'new@email.com'
      })}>
        Update Profile
      </button>
    </div>
  );
}
```

### 2. Store Pattern System

#### Declarative Store Pattern
Context-Action's `createStoreContext` provides type-safe and declarative store management.

```typescript
// 1. Define Store (Data Layer)
const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext('UserStores', {
  profile: {
    initialValue: { name: '', email: '', isLoggedIn: false },
    strategy: 'shallow',
    description: 'User profile information'
  },
  preferences: {
    initialValue: { theme: 'light' as const, language: 'en' },
    strategy: 'reference'
  },
  // Direct values are also supported (for simple cases)
  sessionTimeout: 30 * 60 * 1000 // 30 minutes
});

// 2. Use Store Manager
function DataLayer({ children }) {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');

  // Store initialization logic
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      profileStore.setValue(JSON.parse(savedProfile));
    }
  }, [profileStore]);

  return children;
}
```

### 3. Context-Layered Architecture Integration

#### Context-Layered Architecture with Atomic Contexts

```
📁 contexts/     # 🗄️ Atomic Context Definitions
├── domains/
│   ├── user/
│   │   ├── context.ts          # User domain context
│   │   ├── spec.md             # Context specification
│   │   └── dependencies.md     # Dependency documentation
│   ├── user-profile/           # Evolved from user domain feature
│   │   ├── context.ts          # User profile as independent domain
│   │   ├── spec.md
│   │   └── dependencies.md
│   └── authentication/         # Core domain for auth functionality
│       ├── context.ts
│       ├── spec.md
│       └── dependencies.md
└── pages/
    ├── user-dashboard/         # Page-specific context
    │   ├── context.ts          # Dashboard page context
    │   ├── spec.md
    │   └── dependencies.md
    └── user-profile-page/      # Profile page context
        ├── context.ts
        ├── spec.md
        └── dependencies.md

📁 actions/      # 🚀 Action Dispatch Layer
├── domains/
│   ├── user/useUserActions.ts
│   ├── user-profile/useUserProfileActions.ts
│   └── authentication/useAuthActions.ts
└── pages/
    └── user-dashboard/useUserDashboardActions.ts

📁 hooks/        # 🔗 Store Subscription Layer
├── domains/
│   ├── user/useUserState.ts
│   ├── user-profile/useUserProfileState.ts
│   └── authentication/useAuthState.ts
└── pages/
    └── user-dashboard/useUserDashboardState.ts

📁 handlers/     # ⚙️ Business Logic Layer
├── domains/
│   ├── user/UserHandlers.tsx
│   ├── user-profile/UserProfileHandlers.tsx
│   └── authentication/AuthHandlers.tsx
└── pages/
    └── user-dashboard/UserDashboardHandlers.tsx

📁 viewmodels/   # 🎯 View Isolation Layer
├── domains/
│   ├── user/UserViewModel.ts
│   ├── user-profile/UserProfileViewModel.ts
│   └── authentication/AuthViewModel.ts
└── pages/
    └── user-dashboard/UserDashboardViewModel.ts

📁 views/        # 🖼️ View Components Layer
├── pages/
│   ├── UserDashboardPage.tsx
│   └── UserProfilePage.tsx
├── components/
│   ├── domains/
│   │   ├── user/UserProfile.tsx
│   │   ├── user-profile/UserProfileForm.tsx
│   │   └── authentication/LoginForm.tsx
│   └── pages/
│       └── user-dashboard/DashboardWidget.tsx
└── shared/
    ├── Button.tsx
    └── Card.tsx
```

#### Integration Example with Atomic Contexts

```typescript
// contexts/domains/user/context.ts - User Domain Context
export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserDomain');

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext('UserDomain', {
  basicInfo: { name: '', email: '' },
  settings: { theme: 'light' as const }
});

// contexts/domains/user-profile/context.ts - User Profile Domain Context (Evolved from User)
import { useUserStore } from '../user'; // ✅ Child domain depends on parent

export const {
  Provider: UserProfileActionProvider,
  useActionDispatch: useUserProfileAction,
  useActionHandler: useUserProfileActionHandler
} = createActionContext<UserProfileActions>('UserProfile');

export const {
  Provider: UserProfileStoreProvider,
  useStore: useUserProfileStore
} = createStoreContext('UserProfile', {
  profile: { bio: '', avatar: '', isComplete: false }
});

// contexts/pages/user-dashboard/context.ts - Dashboard Page Context
import { useUserStore } from '../../domains/user'; // ✅ Page depends on domains
import { useUserProfileStore } from '../../domains/user-profile';

export const {
  Provider: UserDashboardActionProvider,
  useActionDispatch: useUserDashboardAction,
  useActionHandler: useUserDashboardActionHandler
} = createActionContext<UserDashboardActions>('UserDashboard');

export const {
  Provider: UserDashboardStoreProvider,
  useStore: useUserDashboardStore
} = createStoreContext('UserDashboard', {
  layout: { widgets: [], isCustomizing: false }
});

// viewmodels/domains/user-profile/UserProfileViewModel.ts - View Isolation
import { useUserState } from '../../../hooks/domains/user';
import { useUserProfileState } from '../../../hooks/domains/user-profile';
import { useUserProfileActions } from '../../../actions/domains/user-profile';

export function useUserProfileViewModel() {
  const { basicInfo } = useUserState(); // Parent domain state
  const { profile } = useUserProfileState(); // Own domain state
  const { updateProfile } = useUserProfileActions(); // Own domain actions

  return {
    user: basicInfo,
    profile,
    displayName: basicInfo.name || 'Anonymous',
    isProfileComplete: profile.isComplete,
    updateProfile
  };
}

// views/pages/UserDashboardPage.tsx - Page Integration Point
export function UserDashboardPage() {
  return (
    {/* Domain Contexts - Independent domains with dependencies */}
    <UserActionProvider>
      <UserStoreProvider>
        <UserProfileActionProvider>       {/* Child domain */}
          <UserProfileStoreProvider>

            {/* Page Context - Isolated page logic */}
            <UserDashboardActionProvider>
              <UserDashboardStoreProvider>
                <UserDashboardPageContent />
              </UserDashboardStoreProvider>
            </UserDashboardActionProvider>

          </UserProfileStoreProvider>
        </UserProfileActionProvider>
      </UserStoreProvider>
    </UserActionProvider>
  );
}

function UserDashboardPageContent() {
  return (
    {/* Handler Registration */}
    <UserHandlers>
      <UserProfileHandlers>            {/* Business logic for user profile domain */}
        <UserDashboardHandlers>         {/* Business logic for dashboard page */}

          {/* UI Components using ViewModels */}
          <UserDashboardView />

        </UserDashboardHandlers>
      </UserProfileHandlers>
    </UserHandlers>
  );
}

// views/components/pages/user-dashboard/UserDashboardView.tsx - ViewModel Consumption
import { useUserDashboardViewModel } from '../../../../viewmodels/pages/user-dashboard';
import { useUserProfileViewModel } from '../../../../viewmodels/domains/user-profile';

export function UserDashboardView() {
  const { layout, updateLayout } = useUserDashboardViewModel(); // Page ViewModel
  const { displayName, profile } = useUserProfileViewModel();   // Domain ViewModel

  return (
    <div>
      <h1>Welcome, {displayName}!</h1>
      <UserProfileSummary profile={profile} />
      <DashboardWidgets layout={layout} onUpdateLayout={updateLayout} />
    </div>
  );
}
```

## Design System Integration

### CVA-Based Component Styling

Components in each context are integrated with the design system via **CVA (Class Variance Authority)**.

#### Implementation Principles

1. **Separate Style and Interaction Parameters**
   ```typescript
   interface ButtonProps {
     // Style parameters
     variant: 'primary' | 'secondary' | 'danger';
     size: 'sm' | 'md' | 'lg';

     // Interaction parameters
     onClick: () => void;
     disabled?: boolean;
   }
   ```

2. **Control Style Changes via Interactions**
   ```typescript
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

   // Interaction changes the style props
   const [variant, setVariant] = useState<'primary' | 'secondary'>('primary');

   const handleInteraction = () => {
     // Change the parameter, not the style directly
     setVariant(prev => prev === 'primary' ? 'secondary' : 'primary');
   };
   ```

### Design Token System

#### Base Layer
```css
/* Color tokenization */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;

  /* Spacing system */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;

  /* Typography */
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
}
```

#### Extend Layer
```typescript
// Headless component
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cardVariants({ variant, className })}
        {...props}
      />
    );
  }
);

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        destructive: "border-red-200 bg-red-50",
        success: "border-green-200 bg-green-50"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
```

## Business Logic Management

### Data Flow and Validation System

#### 1. Data Definition and Type System

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
}
```

#### 2. API Integration and State Management

```typescript
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

// Using API in an action handler
useUserActionHandler('updateProfile', useCallback(async (payload, controller) => {
  try {
    // 1. Validation
    const validation = UserProfileValidator.validate(payload);
    if (!validation.isValid) {
      controller.abort('Validation failed', validation.errors);
      return;
    }

    // 2. Read current state
    const currentProfile = profileStore.getValue();

    // 3. API call
    const updatedProfile = await UserAPIService.updateProfile({
      ...currentProfile,
      ...payload,
      updatedAt: new Date()
    });

    // 4. Update state
    profileStore.setValue(updatedProfile);

    // 5. Set result
    controller.setResult(updatedProfile);
  } catch (error) {
    controller.abort('Update failed', error);
  }
}, [profileStore]));
```

#### 3. State Scenario Definition

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

// State-based UI rendering
function UserInterfaceController() {
  const journeyStore = useUserStore('journeyState');
  const journeyState = useStoreValue(journeyStore);

  switch (journeyState) {
    case 'unauthenticated':
      return <LoginForm />;
    case 'authenticating':
      return <LoadingSpinner />;
    case 'profile_incomplete':
      return <ProfileSetupForm />;
    case 'profile_complete':
      return <Dashboard />;
    case 'email_verification_required':
      return <EmailVerificationPrompt />;
    case 'account_suspended':
      return <SuspensionNotice />;
    default:
      return <ErrorFallback />;
  }
}
```

## Architectural Advantages

### 1. Design Component Observability

- **Storybook Integration**: Visually inspect all components in Storybook.
- **Parameter-Based Control**: Control style changes with predictable parameters.
- **Event Tracking**: Explicitly manage all events originating from components.

### 2. Clear Event-Driven Architecture

- **Action Pipeline**: All events are processed through the `ActionRegister`.
- **Priority Control**: Clearly define the execution order of business logic.
- **Error Handling**: Integrated error handling and recovery mechanisms.

### 3. Update Isolation and Control

- **Immutability Guarantee**: Ensure data immutability with `safeGet`/`safeSet` of the Store.
- **Rerendering Optimization**: Accurate change detection based on `useSyncExternalStore`.
- **Memory Management**: Prevent memory leaks with automatic `cleanup` and `dispose` patterns.

### 4. Logic Transparency

- **Pipeline Control**: Control execution flow with `abort`, `jump`, `priority`, etc.
- **Result Collection**: Track results from all handlers with `dispatchWithResult`.
- **Debugging Support**: Detailed logging and performance monitoring in development mode.

### 5. Implementation Simplification

- **Declarative API**: Simple setup with `createActionContext` and `createStoreContext`.
- **Type Safety**: Prevent compile-time errors with TypeScript.
- **Automatic Inference**: Automatic type inference based on initial values.

### 6. Potential for Incremental Development

- **Context Isolation**: Partial development and testing with independent contexts.
- **Phased Migration**: Gradually transition from existing code.
- **Extensibility**: Easily add new contexts and handlers.

## Implementation Guidelines

### 1. Context Design

```typescript
// ✅ Correct context separation
// Domain Context (General-purpose)
const UserDomainContext = createActionContext<UserDomainActions>('UserDomain');
const ProductDomainContext = createActionContext<ProductActions>('ProductDomain');

// Page Context (Specialized)
const CheckoutPageContext = createActionContext<CheckoutActions>('CheckoutPage');
const ProfilePageContext = createActionContext<ProfileActions>('ProfilePage');

// ❌ Incorrect dependency
// The domain should not use the page context.
```

### 2. Handler Registration Pattern

```typescript
// ✅ Correct handler registration
function UserBusinessLogic({ children }) {
  const userStore = useUserStore('profile');

  // Priority-based handler registration
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // Implement business logic
  }, [userStore]), { priority: 100, id: 'update-profile-handler' });

  return children;
}

// ❌ Handling business logic directly in a component
function UserComponent() {
  const handleUpdate = async (data) => {
    // Business logic should not be in the component.
  };
}
```

### 3. Store Usage Pattern

```typescript
// ✅ Correct store usage
function DataAccessComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // Reactive subscription

  const handleUpdate = () => {
    const currentUser = userStore.getValue(); // Read the current value
    // Process business logic
    userStore.setValue({ ...currentUser, updated: true });
  };
}

// ❌ Incorrect direct access
const user = userStore.getValue(); // Do not use directly in component rendering.
```

### 4. Error Handling Pattern

```typescript
// ✅ Integrated error handling
useUserActionHandler('riskyOperation', useCallback(async (payload, controller) => {
  try {
    const result = await riskyAPICall(payload);
    controller.setResult(result);
  } catch (error) {
    // Propagate error through the controller
    controller.abort('Operation failed', error);
  }
}, []), { priority: 100 });

// ❌ Ignoring errors
useUserActionHandler('riskyOperation', useCallback(async (payload) => {
  try {
    await riskyAPICall(payload);
  } catch (error) {
    // Errors should not be ignored.
  }
}, []), { priority: 100 });
```

## Conclusion

Context-Driven Architecture with atomic context isolation, based on the powerful features of the Context-Action framework, enables:

1. **Clear domain separation** through document-centric design and atomic context specifications
2. **Predictable business logic processing** with the Context-Layered architecture (contexts → actions → hooks → handlers → viewmodels → views)
3. **Safe state management** using Immer-based store patterns with immutability enforcement
4. **Improved maintainability** via atomic context isolation with independent domain and page contexts
5. **Context evolution patterns** where domain features can grow into independent domains while maintaining clear dependency hierarchies

This allows for the implementation of an architecture that is **observable**, **maintainable**, **scalable**, and **incrementally developable**, even in large-scale applications with complex domain requirements.

This architecture creates a **living system where documentation and code align** through atomic context specifications (spec.md, dependencies.md), supporting team collaboration and sustainable development of projects that evolve gracefully over time.
