# Context-Action Framework: Complete Implementation Guide

A comprehensive implementation guide with practical patterns, folder structures, and development conventions for the **Context-Action Framework**.

> **For architectural principles and philosophy, see [Context-Driven Architecture](context-driven-architecture.md)**  
> **For React Compiler integration and performance optimization, see [React Compiler Integration](react-compiler-integration.md)**

## 📋 Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Atomic Context Architecture](#atomic-context-architecture)
3. [6-Layer Architecture](#6-layer-architecture-within-each-atomic-context)
4. [Implementation Patterns](#implementation-patterns)
5. [Sub-features Organization](#sub-features-hierarchical-organization-for-large-scale-contexts)
6. [Development Conventions](#development-conventions)
   - [Import and Module Organization](#import-and-module-organization)
7. [Quality & Performance](#quality-performance)

---

## Implementation Overview

This guide provides concrete implementation patterns for the Context-Action Framework with the new **6-Layer Hook Architecture**:

### ✅ **Core Implementation Concepts**
- **Atomic Context Structure** - Each context as independent top-level folder
- **6-Layer Hook Architecture** - Specialized hook layers with single responsibilities
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
- **Standard Structure**: 6-layer hook architecture (contexts/, business/, handlers/, actions/, hooks/, views/)
- **Large-Scale**: Use `features/` namespace when hooks exceed ~10 items per layer

#### 2. **Page Context** - UI-Specific State
- **Purpose**: UI state and logic specific to a particular page
- **Characteristics**: Used only within specific pages, isolated from other pages
- **Examples**: `user-dashboard-page/`, `product-list-page/`, `checkout-flow-page/`
- **Standard Structure**: 6-layer hook architecture
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

## 6-Layer Architecture (Within Each Atomic Context)

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

### New 6-Layer Implementation Pattern

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
// registries/useUserHandlerRegistry.ts - Advanced Handler Registration
export function useUserHandlerRegistry(options?: {
  trackingId?: string;
  pipelineMode?: boolean;
  mode?: 'standard' | 'trackable' | 'pipeline' | 'typed-pipeline';
}) {
  const { trackingId, pipelineMode, mode = 'standard' } = options || {};

  // Get different handler implementations
  const standardHandlers = useUserHandlerDefinitions();
  const trackableHandlers = useTrackableUserHandlers({ trackingId });
  const pipelineHandlers = usePipelineUserHandlers();
  const typedPipelineHandlers = useTypedPipelineUserHandlers();

  // Select handlers based on mode
  const selectedHandlers = useMemo(() => {
    switch (mode) {
      case 'trackable':
        return trackableHandlers.handlers;
      case 'pipeline':
        return pipelineHandlers.handlers;
      case 'typed-pipeline':
        return typedPipelineHandlers.handlers;
      default:
        return standardHandlers;
    }
  }, [mode, standardHandlers, trackableHandlers.handlers, pipelineHandlers.handlers, typedPipelineHandlers.handlers]);

  // Register selected handlers with unique registration IDs
  const registrationIds = useRef(new Map<string, string>());
  const unregisterFunctions = useRef(new Map<string, () => void>());

  useEffect(() => {
    Object.entries(selectedHandlers).forEach(([actionName, handler]) => {
      const registrationId = `${trackingId || 'default'}-${actionName}-${Date.now()}`;

      // Store registration ID
      registrationIds.current.set(actionName, registrationId);

      // Register handler with tracking
      const unregister = useUserActionHandler(actionName as keyof UserActions, handler, {
        priority: 100,
        id: registrationId,
        metadata: {
          mode,
          trackingId,
          registeredAt: Date.now()
        }
      });

      // Store unregister function
      if (unregister) {
        unregisterFunctions.current.set(actionName, unregister);
      }
    });

    // Cleanup on unmount or mode change
    return () => {
      unregisterFunctions.current.forEach(unregister => unregister());
      unregisterFunctions.current.clear();
      registrationIds.current.clear();
    };
  }, [selectedHandlers, mode, trackingId]);

  // Registry management functions
  const reregisterHandler = useCallback((actionName: string) => {
    const currentUnregister = unregisterFunctions.current.get(actionName);
    if (currentUnregister) {
      currentUnregister();
    }

    const handler = selectedHandlers[actionName];
    if (handler) {
      const newRegistrationId = `${trackingId || 'default'}-${actionName}-${Date.now()}`;
      registrationIds.current.set(actionName, newRegistrationId);

      const unregister = useUserActionHandler(actionName as keyof UserActions, handler, {
        priority: 100,
        id: newRegistrationId,
        metadata: {
          mode,
          trackingId,
          reregisteredAt: Date.now()
        }
      });

      if (unregister) {
        unregisterFunctions.current.set(actionName, unregister);
      }
    }
  }, [selectedHandlers, mode, trackingId]);

  return {
    mode,
    trackingId,
    isRegistered: true,
    registeredHandlers: Object.keys(selectedHandlers),
    registrationIds: Object.fromEntries(registrationIds.current),
    reregisterHandler,
    getRegistrationInfo: (actionName: string) => ({
      id: registrationIds.current.get(actionName),
      isRegistered: unregisterFunctions.current.has(actionName),
      mode,
      trackingId
    })
  };
}
```

```typescript
// dispatchers/useUserDispatchers.ts - Advanced on~ Function Generation
export function useUserDispatchers(options?: {
  trackingId?: string;
  mode?: 'standard' | 'tracked' | 'pipeline';
}) {
  const dispatch = useUserAction();
  const tracking = useTracking();
  const { trackingId, mode = 'standard' } = options || {};

  // Generate tracking-aware dispatchers
  const createTrackedDispatcher = useCallback(<T extends keyof UserActions>(
    actionName: T,
    payloadBuilder?: (args: any[]) => UserActions[T]
  ) => {
    return useCallback((...args: any[]) => {
      const executionId = `${trackingId || tracking.trackingId || 'default'}-${String(actionName)}-${Date.now()}`;

      const payload = payloadBuilder ? payloadBuilder(args) : args[0];
      const executionOptions = args[args.length - 1] as ExecutionOptions | undefined;

      const enhancedOptions: ExecutionOptions = {
        ...executionOptions,
        metadata: {
          ...executionOptions?.metadata,
          trackingId: trackingId || tracking.trackingId,
          executionId,
          mode,
          dispatchedAt: Date.now()
        }
      };

      return dispatch(actionName, payload, enhancedOptions);
    }, [actionName, payloadBuilder, trackingId]);
  }, [dispatch, trackingId, tracking.trackingId, mode]);

  return {
    // Standard dispatchers
    onCreateUser: createTrackedDispatcher(
      'createUser',
      ([userData, options]) => ({ userData })
    ),

    onUpdateUser: createTrackedDispatcher(
      'updateUser',
      ([id, updates, options]) => ({ id, updates })
    ),

    onDeleteUser: createTrackedDispatcher(
      'deleteUser',
      ([id, options]) => ({ id })
    ),

    // Pipeline-specific dispatchers (for typed pipelines)
    onCreateUserPipeline: mode === 'pipeline'
      ? useCallback((userData: UserData, options?: ExecutionOptions) => {
          const pipelinePayload: CreateUserPayload = { userData };
          return dispatch('createUser', pipelinePayload, {
            ...options,
            metadata: {
              ...options?.metadata,
              isPipeline: true,
              trackingId: trackingId || tracking.trackingId
            }
          });
        }, [dispatch, trackingId, tracking.trackingId])
      : undefined,

    // Batch dispatcher for multiple actions
    onBatchActions: useCallback(async (actions: Array<{
      actionName: keyof UserActions;
      payload: any;
      options?: ExecutionOptions;
    }>) => {
      const batchId = `${trackingId || tracking.trackingId || 'default'}-batch-${Date.now()}`;
      const results = [];

      for (const action of actions) {
        try {
          const result = await dispatch(action.actionName, action.payload, {
            ...action.options,
            metadata: {
              ...action.options?.metadata,
              batchId,
              trackingId: trackingId || tracking.trackingId
            }
          });
          results.push({ success: true, result });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      return results;
    }, [dispatch, trackingId, tracking.trackingId])
  };
}

// Execution options interface
interface ExecutionOptions {
  priority?: number;
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
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

### Provider Integration Pattern with Advanced Tracking

```typescript
// user/index.ts - Complete Atomic Context Provider with Tracking
export function UserProvider({
  children,
  trackingId,
  pipelineMode = false
}: {
  children: React.ReactNode;
  trackingId?: string;
  pipelineMode?: boolean;
}) {
  return (
    <UserActionProvider>
      <UserStoreProvider>
        <UserHandlerRegistry trackingId={trackingId} pipelineMode={pipelineMode}>
          {children}
        </UserHandlerRegistry>
      </UserStoreProvider>
    </UserActionProvider>
  );
}

// user/registries/UserHandlerRegistry.tsx - Advanced Registry
function UserHandlerRegistry({
  children,
  trackingId,
  pipelineMode = false
}: {
  children: React.ReactNode;
  trackingId?: string;
  pipelineMode?: boolean;
}) {
  // Choose handler pattern based on mode
  const trackableHandlers = useTrackableUserHandlers({ trackingId });
  const pipelineHandlers = usePipelineUserHandlers();
  const standardHandlers = useUserHandlerDefinitions();

  const selectedHandlers = pipelineMode
    ? pipelineHandlers.handlers
    : trackingId
      ? trackableHandlers.handlers
      : standardHandlers;

  // Register selected handlers
  Object.entries(selectedHandlers).forEach(([actionName, handler]) => {
    useUserActionHandler(actionName as keyof UserActions, handler);
  });

  // Provide tracking context to children
  return (
    <TrackingContext.Provider value={{
      trackingId: trackableHandlers.trackingId,
      executionState: trackableHandlers.executionState,
      getRunningExecutions: trackableHandlers.getRunningExecutions,
      cleanup: trackableHandlers.cleanup,
      pipelineMode
    }}>
      {children}
    </TrackingContext.Provider>
  );
}

// App composition with tracking
function App() {
  const appTrackingId = useId();

  return (
    <UserProvider trackingId={appTrackingId} pipelineMode={true}>
      <AuthProvider trackingId={`${appTrackingId}-auth`}>
        <DashboardPageProvider>
          <DashboardPage />
        </DashboardPageProvider>
      </AuthProvider>
    </UserProvider>
  );
}

// Tracking context for debugging
const TrackingContext = createContext<{
  trackingId?: string;
  executionState?: Map<string, any>;
  getRunningExecutions?: () => any[];
  cleanup?: () => void;
  pipelineMode?: boolean;
}>({});

export const useTracking = () => useContext(TrackingContext);
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

### Advanced Pattern: Currying-Based Tracking with Unique IDs

```typescript
// handlers/useTrackableUserHandlers.ts - Advanced Currying Pattern
export function useTrackableUserHandlers(props?: { trackingId?: string }) {
  const uniqueId = useId();
  const trackingId = props?.trackingId || uniqueId;

  const [executionState, setExecutionState] = useState(new Map());
  const stateRef = useRef(executionState);
  stateRef.current = executionState;

  // Currying for trackable handler generation with unique IDs
  const createTrackableHandler = useCallback((actionName: string) => {
    return useCallback(async (payload, context = {}) => {
      const executionId = `${trackingId}-${actionName}-${Date.now()}`;

      // Update execution start state with tracking
      setExecutionState(prev => {
        const newState = new Map(prev);
        newState.set(executionId, {
          actionName,
          trackingId,
          executionId,
          isRunning: true,
          startTime: Date.now(),
          payload,
          context,
          previousResult: context.previousResult || null
        });
        return newState;
      });

      try {
        // Execute business logic with tracking context
        const result = await executeBusinessLogic({
          payload,
          context: { ...context, trackingId, executionId },
          previousResult: context.previousResult
        });

        // Update success state
        setExecutionState(prev => {
          const newState = new Map(prev);
          const currentExecution = newState.get(executionId);
          newState.set(executionId, {
            ...currentExecution,
            isRunning: false,
            endTime: Date.now(),
            duration: Date.now() - currentExecution.startTime,
            result,
            status: 'success'
          });
          return newState;
        });

        return result;
      } catch (error) {
        // Update error state
        setExecutionState(prev => {
          const newState = new Map(prev);
          const currentExecution = newState.get(executionId);
          newState.set(executionId, {
            ...currentExecution,
            isRunning: false,
            endTime: Date.now(),
            duration: Date.now() - currentExecution.startTime,
            error,
            status: 'error'
          });
          return newState;
        });
        throw error;
      }
    }, [actionName, trackingId]);
  }, [trackingId]);

  // Cleanup old executions
  const cleanup = useCallback((olderThanMs = 300000) => { // 5 minutes
    const cutoff = Date.now() - olderThanMs;
    setExecutionState(prev => {
      const newState = new Map();
      for (const [id, execution] of prev) {
        if (!execution.endTime || execution.endTime > cutoff) {
          newState.set(id, execution);
        }
      }
      return newState;
    });
  }, []);

  return {
    trackingId,
    handlers: {
      createUser: createTrackableHandler('createUser'),
      updateUser: createTrackableHandler('updateUser'),
      deleteUser: createTrackableHandler('deleteUser')
    },
    executionState: stateRef.current,
    getExecutionsByAction: (actionName: string) =>
      Array.from(stateRef.current.values()).filter(exec => exec.actionName === actionName),
    getRunningExecutions: () =>
      Array.from(stateRef.current.values()).filter(exec => exec.isRunning),
    cleanup
  };
}
```

### Advanced Pattern: Pipe Chaining with Previous Results

```typescript
// handlers/usePipelineUserHandlers.ts - Pipe Chain Pattern
export function usePipelineUserHandlers() {
  const userStore = useUserStore('users');
  const profileStore = useUserStore('profile');

  // Pipeline handler with context and previous result chaining
  const createPipelineHandler = useCallback((actionName: string, steps: PipelineStep[]) => {
    return useCallback(async (initialPayload, initialContext = {}) => {
      let currentPayload = { ...initialPayload };
      let currentContext = { ...initialContext, actionName, pipeline: [] };
      let previousResult = null;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepContext = {
          ...currentContext,
          stepIndex: i,
          stepName: step.name,
          previousResult,
          // Access to latest store values via delayed evaluation
          getLatestUsers: () => userStore.getValue(),
          getLatestProfile: () => profileStore.getValue()
        };

        try {
          // Execute step with modified payload and context
          const stepResult = await step.execute(currentPayload, stepContext);

          // Update pipeline tracking
          currentContext.pipeline.push({
            stepName: step.name,
            stepIndex: i,
            input: currentPayload,
            output: stepResult.payload || currentPayload,
            result: stepResult.result,
            duration: stepResult.duration,
            timestamp: Date.now()
          });

          // Prepare for next step
          currentPayload = stepResult.payload || currentPayload;
          previousResult = stepResult.result;

          // Handle step-specific store updates
          if (stepResult.storeUpdates) {
            for (const update of stepResult.storeUpdates) {
              const store = update.storeName === 'users' ? userStore : profileStore;
              if (update.type === 'setValue') {
                store.setValue(update.value);
              } else if (update.type === 'update') {
                store.update(update.updater);
              }
            }
          }

        } catch (error) {
          // Add error to pipeline tracking
          currentContext.pipeline.push({
            stepName: step.name,
            stepIndex: i,
            input: currentPayload,
            error: error.message,
            timestamp: Date.now()
          });
          throw new Error(`Pipeline failed at step ${i} (${step.name}): ${error.message}`);
        }
      }

      return {
        finalPayload: currentPayload,
        finalResult: previousResult,
        context: currentContext
      };
    }, [actionName, steps, userStore, profileStore]);
  }, [userStore, profileStore]);

  // Define pipeline steps
  const userCreationSteps: PipelineStep[] = [
    {
      name: 'validation',
      execute: async (payload, context) => {
        const validationResult = await validateUser(payload.userData);
        return {
          payload: { ...payload, validatedData: validationResult.data },
          result: { isValid: validationResult.isValid, errors: validationResult.errors },
          duration: 50
        };
      }
    },
    {
      name: 'enrichment',
      execute: async (payload, context) => {
        const enrichedData = {
          ...payload.validatedData,
          id: generateId(),
          createdAt: Date.now(),
          // Use previous validation result
          validationScore: context.previousResult?.isValid ? 100 : 0
        };
        return {
          payload: { ...payload, enrichedData },
          result: { enrichedUser: enrichedData },
          duration: 30
        };
      }
    },
    {
      name: 'persistence',
      execute: async (payload, context) => {
        // Get latest users from store (delayed evaluation)
        const currentUsers = context.getLatestUsers();
        const newUser = payload.enrichedData;

        return {
          payload,
          result: { savedUser: newUser, totalUsers: currentUsers.length + 1 },
          storeUpdates: [{
            storeName: 'users',
            type: 'setValue',
            value: [...currentUsers, newUser]
          }],
          duration: 100
        };
      }
    }
  ];

  return {
    handlers: {
      createUser: createPipelineHandler('createUser', userCreationSteps),
      updateUser: createPipelineHandler('updateUser', userUpdateSteps),
      deleteUser: createPipelineHandler('deleteUser', userDeletionSteps)
    }
  };
}

### Type-Safe Empty Payload Pattern

```typescript
// Define empty payload type that gets filled step by step
interface CreateUserPayload {
  // Initial input (always present)
  userData: {
    name: string;
    email: string;
  };

  // Step-by-step filled properties (optional initially)
  validatedData?: {
    name: string;
    email: string;
    isValid: boolean;
    validationErrors?: string[];
  };

  enrichedData?: {
    id: string;
    name: string;
    email: string;
    isValid: boolean;
    validationErrors?: string[];
    createdAt: number;
    validationScore: number;
  };

  persistedData?: {
    id: string;
    name: string;
    email: string;
    isValid: boolean;
    validationErrors?: string[];
    createdAt: number;
    validationScore: number;
    savedAt: number;
    version: number;
  };
}

// Type-safe pipeline steps with progressive payload filling
const createUserPipeline: TypedPipelineStep<CreateUserPayload>[] = [
  {
    name: 'validation',
    execute: async (payload) => {
      const validatedData = await validateUser(payload.userData);

      return {
        // Fill validation step data
        payload: {
          ...payload,
          validatedData: {
            ...payload.userData,
            isValid: validatedData.isValid,
            validationErrors: validatedData.errors
          }
        } as CreateUserPayload & { validatedData: NonNullable<CreateUserPayload['validatedData']> },
        result: { validationComplete: true }
      };
    }
  },
  {
    name: 'enrichment',
    execute: async (payload) => {
      // TypeScript knows validatedData exists from previous step
      if (!payload.validatedData?.isValid) {
        throw new Error('Cannot enrich invalid user data');
      }

      return {
        // Fill enrichment step data
        payload: {
          ...payload,
          enrichedData: {
            ...payload.validatedData,
            id: generateId(),
            createdAt: Date.now(),
            validationScore: payload.validatedData.isValid ? 100 : 0
          }
        } as CreateUserPayload & {
          validatedData: NonNullable<CreateUserPayload['validatedData']>;
          enrichedData: NonNullable<CreateUserPayload['enrichedData']>;
        },
        result: { enrichmentComplete: true }
      };
    }
  },
  {
    name: 'persistence',
    execute: async (payload, context) => {
      // TypeScript knows enrichedData exists from previous step
      const userToSave = payload.enrichedData!;

      const currentUsers = context.getLatestUsers();

      return {
        // Fill persistence step data
        payload: {
          ...payload,
          persistedData: {
            ...userToSave,
            savedAt: Date.now(),
            version: 1
          }
        } as CreateUserPayload & {
          validatedData: NonNullable<CreateUserPayload['validatedData']>;
          enrichedData: NonNullable<CreateUserPayload['enrichedData']>;
          persistedData: NonNullable<CreateUserPayload['persistedData']>;
        },
        result: { persistenceComplete: true, totalUsers: currentUsers.length + 1 },
        storeUpdates: [{
          storeName: 'users',
          type: 'setValue',
          value: [...currentUsers, userToSave]
        }]
      };
    }
  }
];

// Usage with type safety
export function useTypedPipelineUserHandlers() {
  const createTypedPipelineHandler = <T extends Record<string, any>>(
    actionName: string,
    steps: TypedPipelineStep<T>[]
  ) => {
    return useCallback(async (initialPayload: T, initialContext = {}) => {
      let currentPayload = { ...initialPayload };
      let currentContext = { ...initialContext, actionName };

      for (const step of steps) {
        const stepResult = await step.execute(currentPayload, currentContext);
        currentPayload = stepResult.payload || currentPayload;

        // Handle store updates
        if (stepResult.storeUpdates) {
          for (const update of stepResult.storeUpdates) {
            // Apply store updates...
          }
        }
      }

      return currentPayload;
    }, [actionName, steps]);
  };

  return {
    handlers: {
      createUser: createTypedPipelineHandler('createUser', createUserPipeline)
    }
  };
}
```

// Pipeline interfaces
interface TypedPipelineStep<T> {
  name: string;
  execute: (payload: T, context: PipelineContext) => Promise<TypedPipelineStepResult<T>>;
}

interface PipelineContext {
  actionName: string;
  stepIndex?: number;
  stepName?: string;
  previousResult?: any;
  pipeline?: PipelineStepInfo[];
  getLatestUsers: () => any[];
  getLatestProfile: () => any;
}

interface TypedPipelineStepResult<T> {
  payload?: T;
  result?: any;
  storeUpdates?: StoreUpdate[];
  duration?: number;
}

interface StoreUpdate {
  storeName: string;
  type: 'setValue' | 'update';
  value?: any;
  updater?: (draft: any) => void;
}

interface PipelineStepInfo {
  stepName: string;
  stepIndex: number;
  input: any;
  output?: any;
  result?: any;
  error?: string;
  duration?: number;
  timestamp: number;
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
│   └── [feature-name]/     # Sub-feature with own 6-layer structure
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

### Import and Module Organization

#### Named Imports for Tree Shaking
**Always prefer named imports over namespace imports for better bundle optimization:**

```typescript
// ✅ Recommended: Named imports for optimal tree shaking
import { useUserStore, UserStoreData } from '../contexts/UserContext';
import { createValidationError, validateUserData } from '../handlers/userValidationHandlers';
import { formatUserDisplay, calculateUserStats } from '../utils/userUtils';

// ❌ Avoid: Namespace imports prevent efficient tree shaking
import * as UserContext from '../contexts/UserContext';
import * as UserValidation from '../handlers/userValidationHandlers';
import * as UserUtils from '../utils/userUtils';
```

#### Utility Functions Over Static Classes
**Use utility functions instead of static-only classes to improve tree shaking:**

```typescript
// ✅ Recommended: Pure utility functions
export function createUserValidationError(field: string, message: string): UserError {
  return {
    type: 'VALIDATION_ERROR',
    field,
    message,
    timestamp: Date.now()
  };
}

export function createUserNotFoundError(userId: string): UserError {
  return {
    type: 'NOT_FOUND_ERROR',
    message: `User ${userId} not found`,
    timestamp: Date.now()
  };
}

// Usage with clean imports
import { createUserValidationError, createUserNotFoundError } from './userErrorUtils';

// ❌ Avoid: Static-only classes (linting warnings)
export class UserErrorFactory {
  static createValidationError(field: string, message: string): UserError {
    // Implementation...
  }
  static createNotFoundError(userId: string): UserError {
    // Implementation...
  }
}
```

#### Systematic Import Organization
**Organize imports consistently across all hook layers:**

```typescript
// 1. React and external libraries
import React, { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

// 2. Framework imports
import { useStoreValue, useActionHandler } from '@context-action/react';

// 3. Context layer imports
import { useUserStore, useUserActionDispatch } from '../contexts/UserContext';

// 4. Other layer imports (same level or cross-layer)
import { useUserHandlerDefinitions } from '../handlers/useUserHandlerDefinitions';
import { formatUserStats, validateUserInput } from '../utils/userUtils';

// 5. Type-only imports
import type { UserProfile, UserValidationResult } from '../types/user.types';
```

#### Hook Layer Import Patterns
**Each layer should follow specific import patterns:**

```typescript
// contexts/ layer - Context resource definitions
import { createStoreContext, createActionContext } from '@context-action/react';
import type { UserActions, UserStoreData } from './types';

// handlers/ layer - Internal function definitions
import { useUserStore } from '../contexts/UserContext';
import { validateUserData, transformUserInput } from '../utils/userValidation';

// subscriptions/ layer - Selective state subscriptions
import { useUserStore } from '../contexts/UserContext';
import { useMemo } from 'react';

// registries/ layer - Handler registration
import { useUserActionHandler } from '../contexts/UserContext';
import { useUserHandlerDefinitions } from '../handlers/useUserHandlerDefinitions';

// dispatchers/ layer - on~ function generation
import { useUserActionDispatch } from '../contexts/UserContext';
import { useCallback } from 'react';

// views/ layer - UI components
import { useUserSubscriptions } from '../subscriptions/useUserSubscriptions';
import { useUserDispatchers } from '../dispatchers/useUserDispatchers';
```

**Benefits of This Import Strategy:**
- **Tree Shaking**: Eliminates unused code from bundles
- **Bundle Size**: Reduces final application size
- **Performance**: Faster build times and runtime performance
- **Maintainability**: Clear dependency relationships
- **Type Safety**: Better IDE support and error detection

---

## Quality & Performance

### React Compiler Integration

For optimal performance with the Context-Action Framework, integrate React Compiler for automatic memoization:

```tsx
// ✅ Optimized component with React Compiler
export function UserManagement() {
  "use memo";
  
  const [users, setUsers] = useState<User[]>([]);
  
  // Automatically memoized by React Compiler
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };
  
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

**Benefits:**
- **Automatic Memoization** - No manual `useCallback` or `useMemo` needed
- **Infinite Loop Prevention** - Prevents common React performance issues
- **Cleaner Code** - Reduces boilerplate optimization code
- **Better Performance** - Compile-time optimizations

> **For detailed React Compiler integration guide, see [React Compiler Integration](react-compiler-integration.md)**

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
1. **Atomic Context Structure** - Each context as independent top-level folder with complete 6-layer hook architecture
2. **6-Layer Hook Architecture** - Specialized hook layers with single responsibilities and delayed evaluation
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