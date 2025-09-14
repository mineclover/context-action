# Context-Driven Architecture

A guide to document-centric state management and business logic architecture based on the **Context-Action Framework**.

## Overview

Context-Driven Architecture is an innovative architectural approach that overcomes the fundamental limitations of complex state management through **document-centric context separation** and **effective artifact management**, based on the core design principles of the Context-Action framework.

### Core Philosophy

> **"The document is the architecture."** - Each context exists as a unit for managing the documents and deliverables of its domain.

A context signifies a **unit for defining concepts**. Based on this standard, the visual UI is composed of Storybook components, and business logic is structured as an Action Pipeline.

## Context Definition and Separation Principles

### Unit of Context Definition

#### Basic Structure
- **Topic Context**: Manages large units of functionality, plans, or pages.
- **Composition Context**: The implementation unit for individual features.
- **Nested Structure**: One composition can become the topic for other compositions.

#### Context Hierarchy

```
📁 Domain Context     - Prioritizes reusability
  ├── 📄 Business Model Design
  ├── 🔄 Meta-functional Implementation
  └── 🌐 Reused across multiple places

📁 Page Context      - Focuses on current accessibility
  ├── 🎯 Tailored to specific interfaces
  ├── 👤 Optimized for the current user experience
  └── 📱 Specialized features per page
```

### Context Separation Principles

#### 1. Separation of Concerns
- A parent context does not perform the functions of a child context.
- A child context does not directly use the data of a parent context.
- Each context has a clear, single responsibility.

#### 2. Dependency Direction
```
Parent Context → Child Context (Allowed)
Child Context ← Parent Context (Forbidden)
```

- **Allowed**: A child context using the data or styles of a parent context.
- **Forbidden**: A parent context directly accessing the data of a child context.
- **Solution**: Adopt a pattern of delegating the definition itself to the parent context.

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

#### 4-Layer Structure

```
📁 contexts/     # 🗄️ Context Definition (Type definitions and context creation)
├── UserActionContext.ts    # Action context definition
└── UserStoreContext.ts     # Store context definition

📁 handlers/     # ⚙️ Handler Logic (Business logic via props-based DI)
├── UserProfileHandlers.tsx # Profile-related business logic
└── UserAuthHandlers.tsx    # Authentication-related business logic

📁 actions/      # 🚀 Action Dispatch (Dispatching actions and callbacks)
├── useUserProfileActions.ts # Profile action hooks
└── useUserAuthActions.ts    # Authentication action hooks

📁 hooks/        # 🔗 Store Subscription (Subscribing to store values)
├── useUserProfile.ts       # Profile state hooks
└── useUserPreferences.ts   # Settings state hooks

📁 views/        # 🖼️ Pure UI (Event handling and rendering)
├── UserProfile.tsx         # Profile UI component
└── UserSettings.tsx        # Settings UI component

📄 UserPage.tsx  # 🎯 Integration Point (Handler registration and composition)
```

#### Integration Example

```typescript
// contexts/UserContexts.ts
export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore
} = createStoreContext('UserStores', {
  profile: { name: '', email: '', isLoggedIn: false },
  preferences: { theme: 'light' as const }
});

// handlers/UserProfileHandlers.tsx - Props-based DI pattern
interface UserProfileHandlersProps {
  profileStore: Store<UserProfile>;
  preferencesStore: Store<UserPreferences>;
}

export function UserProfileHandlers({
  profileStore,
  preferencesStore,
  children
}: UserProfileHandlersProps & { children: ReactNode }) {

  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    const currentProfile = profileStore.getValue();
    const preferences = preferencesStore.getValue();

    // Apply business rules
    const updatedProfile = applyBusinessRules(payload, preferences);

    profileStore.setValue(updatedProfile);
    await syncWithServer(updatedProfile);
  }, [profileStore, preferencesStore]));

  return children;
}

// UserPage.tsx - Integration Point
export function UserPage() {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserPageContent />
      </UserStoreProvider>
    </UserActionProvider>
  );
}

function UserPageContent() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');

  return (
    <UserProfileHandlers
      profileStore={profileStore}
      preferencesStore={preferencesStore}
    >
      <UserProfileView />
      <UserSettingsView />
    </UserProfileHandlers>
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

Context-Driven Architecture, based on the powerful features of the Context-Action framework, enables:

1. **Clear domain separation** through document-centric design.
2. **Predictable business logic processing** with the Action Pipeline.
3. **Safe state management** using the declarative store pattern.
4. **Improved maintainability** via context isolation.

This allows for the implementation of an architecture that is **observable**, **maintainable**, and **incrementally developable**, even in large-scale applications.

This architecture is not just a technical solution but creates a **living architecture where documentation and code align**, supporting team collaboration and the sustainable development of the project.
