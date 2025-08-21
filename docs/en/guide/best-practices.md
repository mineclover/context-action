# Best Practices

Follow these conventions and best practices when using the Context-Action framework.

<!-- Updated for sync-docs testing -->

## Naming Conventions

### Domain-Based Renaming Pattern

The core convention is **domain-specific renaming** for clear context separation.

#### Store Pattern Renaming
```tsx
// ✅ Recommended: Domain-specific renaming
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', {...});

// ❌ Avoid: Direct object access
const UserStores = createDeclarativeStorePattern('User', {...});
const userStore = UserStores.useStore('profile'); // Domain unclear
```

#### Action Pattern Renaming
```tsx
// ✅ Recommended: Domain-specific renaming with explicit types
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// ❌ Avoid: Generic names
const {
  Provider,
  useActionDispatch,
  useActionHandler
} = createActionContext<UserActions>('UserActions');
```

### Context Naming Rules

#### Domain-Based Naming
```tsx
// ✅ Recommended: Clear domain separation
'UserProfile'     // User profile related
'ShoppingCart'    // Shopping cart related  
'ProductCatalog'  // Product catalog related
'OrderManagement' // Order management related
'AuthSystem'      // Authentication system related

// ❌ Avoid: Ambiguous names
'Data'           // Too broad
'State'          // Not specific
'App'            // Unclear scope (use only at root level)
'Manager'        // Unclear role
```

#### Action vs Store Distinction
```tsx
// Action Context (behavior/event focused)
'UserActions'         // User actions
'PaymentActions'      // Payment actions
'NavigationActions'   // Navigation actions

// Store Context (data/state focused)  
'UserData'           // User data
'PaymentData'        // Payment data
'AppSettings'        // Application settings
```

## File Structure

### Recommended Directory Structure
```
src/
├── contexts/
│   ├── user/
│   │   ├── UserActions.tsx     # Action context
│   │   ├── UserStores.tsx      # Store context
│   │   └── types.ts            # User-related types
│   ├── payment/
│   │   ├── PaymentActions.tsx
│   │   ├── PaymentStores.tsx
│   │   └── types.ts
│   └── index.ts                # Export all contexts
├── components/
├── pages/
└── utils/
```

### Context File Organization
```tsx
// contexts/user/UserActions.tsx
import { createActionContext } from '@context-action/react';
import type { UserActions } from './types';

export const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// contexts/user/UserStores.tsx
import { createDeclarativeStorePattern } from '@context-action/react';
import type { UserStoreConfig } from './types';

export const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager
} = createDeclarativeStorePattern('User', userStoreConfig);
```

## Pattern Usage

### Action Pattern Best Practices

#### Handler Registration
```tsx
// ✅ Recommended: Use useCallback for stable handlers
function UserComponent() {
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      await updateUserProfile(payload);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, [])); // Empty deps for stable handler
}

// ❌ Avoid: Inline handlers (causes re-registration)
function UserComponent() {
  useUserActionHandler('updateProfile', async (payload) => {
    await updateUserProfile(payload); // Re-registers on every render
  });
}
```

#### Error Handling
```tsx
// ✅ Recommended: Use controller.abort for proper error handling
useActionHandler('riskyAction', (payload, controller) => {
  try {
    // Business logic that might fail
    processData(payload);
  } catch (error) {
    controller.abort('Processing failed', error);
  }
});
```

### Store Pattern Best Practices

#### Store Access
```tsx
// ✅ Recommended: Specific store subscriptions
function UserProfile() {
  const profileStore = useUserStore('profile');
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}

// ❌ Avoid: Unnecessary store access
function UserProfile() {
  const profileStore = useUserStore('profile');
  const settingsStore = useUserStore('settings'); // Not used
  const profile = useStoreValue(profileStore);
  
  return <div>{profile.name}</div>;
}
```

#### Store Updates
```tsx
// ✅ Recommended: Functional updates for complex changes
const { updateStore } = useUserStoreManager();

const updateProfile = (changes: Partial<UserProfile>) => {
  updateStore('profile', prevProfile => ({
    ...prevProfile,
    ...changes,
    updatedAt: Date.now()
  }));
};

// ✅ Acceptable: Direct updates for simple changes
const setUserName = (name: string) => {
  updateStore('profile', { ...currentProfile, name });
};
```

## Type Definitions

### Action Types
```tsx
// ✅ Recommended: Extend ActionPayloadMap
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  deleteAccount: { confirmationCode: string };
  logout: void; // For actions without payload
}

// ❌ Avoid: Plain interfaces
interface UserActions {
  updateProfile: { name: string; email: string }; // Missing ActionPayloadMap
}
```

### Store Types
```tsx
// ✅ Recommended: Clear type definitions
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

const userStoreConfig = {
  profile: { 
    initialValue: {
      id: '',
      name: '',
      email: '',
      createdAt: 0,
      updatedAt: 0
    } as UserProfile
  },
  settings: { 
    initialValue: {
      theme: 'light',
      notifications: true,
      language: 'en'
    } as UserSettings
  }
};
```

## Performance Guidelines

### Handler Optimization
```tsx
// ✅ Recommended: Memoized handlers
const optimizedHandler = useCallback(async (payload: UserActions['updateProfile']) => {
  await updateUserProfile(payload);
}, []);

useUserActionHandler('updateProfile', optimizedHandler);
```

### Store Subscription Optimization
```tsx
// ✅ Recommended: Subscribe to specific values
const userName = useStoreValue(profileStore)?.name;

// ❌ Avoid: Unnecessary full object subscriptions when only partial data needed
const fullProfile = useStoreValue(profileStore);
const userName = fullProfile.name; // Re-renders on any profile change
```

## Pattern Composition

### Provider Hierarchy
```tsx
// ✅ Recommended: Logical provider ordering
function App() {
  return (
    <UserStoreProvider>      {/* Data layer first */}
      <UserActionProvider>   {/* Action layer second */}
        <PaymentStoreProvider>
          <PaymentActionProvider>
            <AppContent />
          </PaymentActionProvider>
        </PaymentStoreProvider>
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

### Cross-Pattern Communication
```tsx
// ✅ Recommended: Actions update stores
function UserComponent() {
  const { updateStore } = useUserStoreManager();
  
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    try {
      const updatedProfile = await updateUserProfile(payload);
      updateStore('profile', updatedProfile); // Update store after API call
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  }, [updateStore]));
}
```

## Common Pitfalls

### Avoid These Patterns
```tsx
// ❌ Don't: Mix action dispatch with direct store updates
function BadComponent() {
  const dispatch = useUserAction();
  const { updateStore } = useUserStoreManager();
  
  const handleUpdate = () => {
    updateStore('profile', newProfile);  // Direct store update
    dispatch('updateProfile', newProfile); // AND action dispatch - redundant!
  };
}

// ❌ Don't: Create contexts inside components
function BadComponent() {
  const { Provider } = createActionContext<UserActions>('User'); // Wrong!
  return <Provider>...</Provider>;
}

// ❌ Don't: Register handlers with dependencies that change frequently
function BadComponent({ userId }: { userId: string }) {
  useUserActionHandler('updateProfile', async (payload) => {
    await updateUserProfile(userId, payload); // userId closure changes frequently
  }); // Missing useCallback and userId in deps
}
```

## Advanced Best Practices

### Action Handler State Access

#### ⚠️ Critical: Avoid Closure Traps with Store Values

When accessing store values inside action handlers, **never use values from component scope** as they create closure traps:

```tsx
// ❌ WRONG: Using component scope values in handlers
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // This value gets trapped in closure!
  
  useUserActionHandler('updateUser', async (payload) => {
    // 🚨 BUG: This 'user' is from handler registration time, not current time!
    if (user.isActive) {  // Stale value!
      await updateUserAPI(payload);
    }
  });
}

// ✅ CORRECT: Access store values directly inside handlers
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // For component rendering only
  
  useUserActionHandler('updateUser', useCallback(async (payload) => {
    // ✅ Always get fresh state from store
    const currentUser = userStore.getValue(); // Real-time value!
    
    if (currentUser.isActive) {
      await updateUserAPI(payload);
    }
  }, [userStore])); // Only store reference in deps
}
```

#### Real-time State Access Patterns

```tsx
// ✅ Pattern 1: Direct store getValue() for simple checks
useActionHandler('conditionalAction', async (payload) => {
  const currentState = someStore.getValue();
  
  if (currentState.isReady) {
    // Proceed with action
  }
});

// ✅ Pattern 2: Multiple store coordination
useActionHandler('complexAction', async (payload) => {
  const userState = userStore.getValue();
  const settingsState = settingsStore.getValue();
  const uiState = uiStore.getValue();
  
  // Use all current states for decision making
  if (userState.isLoggedIn && settingsState.apiEnabled && !uiState.isLoading) {
    // Execute complex logic
  }
});

// ✅ Pattern 3: State validation and updates
useActionHandler('validateAndUpdate', async (payload) => {
  const current = dataStore.getValue();
  
  // Validate current state
  if (current.version !== payload.expectedVersion) {
    throw new Error('Version mismatch');
  }
  
  // Update with current state as base
  dataStore.setValue({
    ...current,
    ...payload.updates,
    version: current.version + 1
  });
});
```

### useEffect Dependencies Best Practices

#### Store and Dispatch References are Stable

Context-Action framework ensures that store instances and dispatch functions have stable references:

```tsx
// ✅ These are safe to omit from useEffect dependencies
function MyComponent() {
  const userStore = useUserStore('profile');  // Stable reference
  const dispatch = useUserAction();           // Stable reference
  const user = useStoreValue(userStore);
  
  useEffect(() => {
    if (user.needsSync) {
      dispatch('syncUser', { id: user.id });
      userStore.setValue({ ...user, lastSyncAttempt: Date.now() });
    }
  }, [user.needsSync, user.id]); // Don't include userStore or dispatch
  
  // Alternative: Include them if you prefer explicitness (no harm)
  useEffect(() => {
    if (user.needsSync) {
      dispatch('syncUser', { id: user.id });
    }
  }, [user.needsSync, user.id, dispatch, userStore]); // Also fine
}
```

#### Dependency Array Guidelines

```tsx
// ✅ Include: Values that actually change and affect behavior
useEffect(() => {
  if (user.isActive) {
    startPolling();
  }
}, [user.isActive]); // Include derived values

// ✅ Omit: Stable references (but including them doesn't hurt)
const stableRef = userStore;
const stableDispatch = dispatch;

useEffect(() => {
  // These don't need to be in deps, but you can include them
  stableRef.setValue(newValue);
  stableDispatch('action', payload);
}, []); // Empty deps is fine

// ❌ Avoid: Including whole objects when only specific properties matter
useEffect(() => {
  updateUI();
}, [user]); // Re-runs on any user change

// ✅ Better: Include only relevant properties
useEffect(() => {
  updateUI();
}, [user.theme, user.language]); // Only re-runs when these change
```

### Debugging State Issues

#### State Monitoring Techniques

```tsx
// ✅ Add debug logging to track state changes
useActionHandler('debugAction', async (payload) => {
  const beforeState = store.getValue();
  console.log('Before:', beforeState);
  
  // Perform updates
  store.setValue(newValue);
  
  const afterState = store.getValue();
  console.log('After:', afterState);
  
  // Verify state change
  if (beforeState === afterState) {
    console.warn('State did not change as expected!');
  }
});

// ✅ Create debug utilities for complex state tracking
const createStateLogger = (storeName: string, store: Store<any>) => ({
  logCurrent: () => console.log(`${storeName}:`, store.getValue()),
  logChange: (action: string) => {
    const before = store.getValue();
    return (after: any) => {
      console.log(`${storeName} ${action}:`, { before, after });
    };
  }
});
```

#### Common Debugging Scenarios

```tsx
// 🔍 Debug: Component not re-rendering on state change
function DebuggingComponent() {
  const store = useStore('data');
  const value = useStoreValue(store);
  
  // Add logging to verify subscription
  useEffect(() => {
    console.log('Component re-rendered, value:', value);
  });
  
  // Verify store updates are working
  const testUpdate = () => {
    console.log('Before update:', store.getValue());
    store.setValue({ ...store.getValue(), timestamp: Date.now() });
    console.log('After update:', store.getValue());
  };
  
  return (
    <div>
      <div>Current value: {JSON.stringify(value)}</div>
      <button onClick={testUpdate}>Test Update</button>
    </div>
  );
}

// 🔍 Debug: Action handler not executing
function DebuggingActions() {
  useActionHandler('testAction', useCallback(async (payload) => {
    console.log('Handler executed with payload:', payload);
    
    // Add try-catch to catch errors
    try {
      // Your logic here
    } catch (error) {
      console.error('Handler error:', error);
      throw error; // Re-throw to maintain error propagation
    }
  }, []));
  
  const dispatch = useActionDispatch();
  
  const testDispatch = () => {
    console.log('Dispatching testAction...');
    dispatch('testAction', { test: true });
  };
  
  return <button onClick={testDispatch}>Test Action</button>;
}
```

### Production Debugging & Component Lifecycle Management

#### Critical Issue: Duplicate Action Handler Registration

**Problem**: Accidentally registering the same action handler multiple times causes unpredictable behavior.

```tsx
// ❌ WRONG: Duplicate handler registration
useActionHandler('updateResults', async (payload) => {
  store.setValue(payload.data);
});
useActionHandler('updateResults', async (payload) => {  // Duplicate!
  store.setValue(payload.data);  // This overrides the first handler
});

// ✅ CORRECT: Single handler registration
const updateResultsHandler = useCallback(async (payload) => {
  store.setValue(payload.data);
}, [store]);
useActionHandler('updateResults', updateResultsHandler);
```

**Debug tip**: `grep -n "useActionHandler.*'actionName'" src/**/*.tsx`

#### Preventing Race Conditions with Processing State

**Problem**: Rapid button clicks cause race conditions and state inconsistencies.

```tsx
// ✅ Add processing state to prevent race conditions
const stores = createDeclarativeStorePattern('Demo', {
  data: initialData,
  isProcessing: false  // Add processing state
});

const criticalActionHandler = useCallback(async (payload) => {
  const currentProcessing = isProcessingStore.getValue();
  
  if (currentProcessing) {
    console.warn('Action already in progress, ignoring request');
    return; // Early return prevents race condition
  }
  
  isProcessingStore.setValue(true);
  try {
    await performCriticalOperation(payload);
  } finally {
    isProcessingStore.setValue(false); // Always clear processing state
  }
}, [isProcessingStore]);

useActionHandler('criticalAction', criticalActionHandler);

// ✅ UI reflects processing state
function ActionButton() {
  const isProcessing = useStoreValue(isProcessingStore);
  const dispatch = useActionDispatch();
  
  return (
    <button
      onClick={() => dispatch('criticalAction', payload)}
      disabled={isProcessing}
    >
      {isProcessing ? '⏳ Processing...' : 'Execute Action'}
    </button>
  );
}
```

#### Safe Component Unmounting with RefContext

**Problem**: Component unmounting conflicts with manual ref cleanup.

```tsx
// ❌ WRONG: Manual ref cleanup in component useEffect
function Component() {
  const elementRef = useRefHandler('element');
  
  useEffect(() => {
    return () => {
      elementRef.setRef(null); // This conflicts with action handler cleanup
    };
  }, []);
  
  return <div ref={elementRef.setRef} />;
}

// ✅ CORRECT: Separate concerns - React handles DOM, actions handle state
function Component() {
  const elementRef = useRefHandler('element');
  
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounting');
    // Let React handle DOM cleanup automatically
  }, []);
  
  return <div ref={elementRef.setRef} />;
}

// ✅ Action handler manages state and ref coordination
const unmountElementHandler = useCallback(async () => {
  const isCurrentlyMounted = isMountedStore.getValue();
  
  if (isCurrentlyMounted) {
    isMountedStore.setValue(false); // Update state first
    
    // Let React unmount component, then check ref state
    setTimeout(() => {
      const currentRef = elementRef.target;
      if (currentRef) {
        elementRef.setRef(null); // Only manual cleanup if needed
      }
    }, 50);
  }
}, [isMountedStore, elementRef]);

useActionHandler('unmountElement', unmountElementHandler);
```

#### Production Debugging Techniques

**State Monitoring**: Create comprehensive state monitoring for production issues:

```tsx
// ✅ Multi-dimensional state monitoring
const debugStores = createDeclarativeStorePattern('Debug', {
  actionLog: [] as string[],
  errorCount: 0,
  operationTimes: {} as Record<string, number>
});

const addLogHandler = useCallback(async ({ message }) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  
  actionLogStore.update(prev => [
    ...prev.slice(-49), // Keep last 50 entries
    logEntry
  ]);
}, [actionLogStore]);

useActionHandler('addLog', addLogHandler);
```

**Error Recovery**: Implement graceful error recovery with automatic retry:

```tsx
// ✅ Automatic retry with exponential backoff
const reliableActionHandler = useCallback(async (payload) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await performOperation(payload);
      return; // Success
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error; // Final failure
      
      const delay = 100 * Math.pow(2, attempt - 1); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}, []);

useActionHandler('reliableAction', reliableActionHandler);
```

**Stress Testing**: Simulate production conditions to reproduce intermittent issues:

```tsx
// ✅ Simple stress testing helper
function StressTester({ children }: { children: ReactNode }) {
  const [isStressTesting, setIsStressTesting] = useState(false);
  
  useEffect(() => {
    if (!isStressTesting) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance per cycle
        // Trigger random actions to simulate rapid user behavior
        const actions = ['mount', 'unmount', 'waitForRef'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        console.log(`🎯 Stress test: ${randomAction}`);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isStressTesting]);
  
  return (
    <div>
      <button onClick={() => setIsStressTesting(!isStressTesting)}>
        {isStressTesting ? '🛑 Stop' : '🎯 Start'} Stress Test
      </button>
      {children}
    </div>
  );
}
```# Test change
