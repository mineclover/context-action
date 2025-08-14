# Main Patterns

Context-Action framework provides **two main patterns** that can be used independently or combined to build scalable React applications with clean separation of concerns.

## Pattern Overview

### 🎯 Action Only Pattern
**Import**: `createActionContext` from `@context-action/react`

**Use Case**: Pure action dispatching without state management
- Event systems and command patterns
- User interaction handling
- Business logic orchestration
- Cross-component communication

**Features**:
- Type-safe action dispatching
- Handler registration with priority
- Pipeline control (abort, modify payload)
- Lightweight (no store overhead)

### 🏪 Store Only Pattern (Recommended)
**Import**: `createDeclarativeStorePattern` from `@context-action/react`

**Use Case**: Pure state management without action dispatching
- Data layers and application state
- Component-level state
- Derived state management
- Reactive data flows

**Features**:
- Excellent type inference without manual annotations
- Simplified API focused on store management
- Direct value or configuration object support
- HOC pattern with `withProvider()`

## Action Only Pattern

### Basic Setup

```typescript
import { createActionContext } from '@context-action/react';

// 1. Define action types
interface EventActions extends ActionPayloadMap {
  trackEvent: { event: string; data: any };
  logError: { error: string; context: any };
  sendAnalytics: { category: string; action: string; value?: number };
}

// 2. Create action context
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<EventActions>('Events');
```

### Provider Setup

```typescript
function App() {
  return (
    <EventActionProvider>
      <AnalyticsComponent />
      <UserInteractionComponent />
    </EventActionProvider>
  );
}
```

### Handler Registration

```typescript
function AnalyticsComponent() {
  const dispatch = useEventAction();
  
  // Register event tracking handler
  useEventActionHandler('trackEvent', async (payload) => {
    await analytics.track(payload.event, payload.data);
    console.log(`Event tracked: ${payload.event}`);
  }, { priority: 100 });
  
  // Register error logging handler
  useEventActionHandler('logError', async (payload) => {
    await logger.error(payload.error, payload.context);
    // Send to error reporting service
  }, { priority: 90 });
  
  return null; // This component only handles events
}
```

### Action Dispatching

```typescript
function UserInteractionComponent() {
  const dispatch = useEventAction();
  
  const handleButtonClick = () => {
    dispatch('trackEvent', {
      event: 'button_click',
      data: { button: 'cta', page: 'home' }
    });
  };
  
  const handleError = (error: Error) => {
    dispatch('logError', {
      error: error.message,
      context: { component: 'UserInteraction', timestamp: Date.now() }
    });
  };
  
  return (
    <div>
      <button onClick={handleButtonClick}>
        Click me
      </button>
    </div>
  );
}
```

### Advanced Pipeline Control

```typescript
function AdvancedEventHandler() {
  useEventActionHandler('sendAnalytics', async (payload, controller) => {
    // 1. Validate input
    if (!payload.category || !payload.action) {
      controller.abort('Missing required fields');
      return;
    }
    
    // 2. Modify payload for subsequent handlers
    controller.modifyPayload(current => ({
      ...current,
      timestamp: Date.now(),
      sessionId: getSessionId()
    }));
    
    // 3. Set intermediate result
    controller.setResult({ step: 'validation', success: true });
    
    // 4. Process analytics
    await analytics.send({
      category: payload.category,
      action: payload.action,
      value: payload.value || 0
    });
    
    return { sent: true, provider: 'google-analytics' };
  }, { priority: 100 });
  
  return null;
}
```

## Store Only Pattern

### Basic Setup

```typescript
import { createDeclarativeStorePattern } from '@context-action/react';

// 1. Create store pattern with type inference
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', {
  // Direct value support
  profile: { name: '', email: '', avatar: '' },
  
  // Configuration object support
  preferences: {
    initialValue: { theme: 'light', language: 'en', notifications: true },
    validator: (value) => typeof value === 'object' && 'theme' in value
  },
  
  // Complex state with derivations
  settings: {
    initialValue: { privacy: 'public', twoFactor: false },
    derived: {
      isSecure: (settings) => settings.twoFactor && settings.privacy === 'private'
    }
  }
});
```

### Provider Setup Options

#### Option 1: Manual Provider
```typescript
function App() {
  return (
    <UserStoreProvider>
      <UserProfileComponent />
      <UserSettingsComponent />
    </UserStoreProvider>
  );
}
```

#### Option 2: HOC Pattern (Recommended)
```typescript
// Automatically wrap component with provider
const App = withUserStoreProvider(() => (
  <div>
    <UserProfileComponent />
    <UserSettingsComponent />
  </div>
));
```

### Store Usage

```typescript
function UserProfileComponent() {
  const profileStore = useUserStore('profile');
  const preferencesStore = useUserStore('preferences');
  
  // Subscribe to store values
  const profile = useStoreValue(profileStore);
  const preferences = useStoreValue(preferencesStore);
  
  const updateProfile = () => {
    // Direct value update
    profileStore.setValue({
      ...profile,
      name: 'John Doe',
      email: 'john@example.com'
    });
  };
  
  const toggleTheme = () => {
    // Update function
    preferencesStore.update(current => ({
      ...current,
      theme: current.theme === 'light' ? 'dark' : 'light'
    }));
  };
  
  return (
    <div>
      <h1>{profile.name}</h1>
      <p>Theme: {preferences.theme}</p>
      <button onClick={updateProfile}>Update Profile</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Store Manager

```typescript
function UserManagerComponent() {
  const storeManager = useUserStoreManager();
  
  const resetAllStores = () => {
    // Reset all stores to initial values
    storeManager.resetAll();
  };
  
  const resetSpecificStore = () => {
    // Reset specific store
    storeManager.reset('profile');
  };
  
  const getAllValues = () => {
    // Get all current values
    const values = storeManager.getAllValues();
    console.log(values);
    // {
    //   profile: { name: '', email: '', avatar: '' },
    //   preferences: { theme: 'light', language: 'en', notifications: true },
    //   settings: { privacy: 'public', twoFactor: false }
    // }
  };
  
  return (
    <div>
      <button onClick={resetAllStores}>Reset All</button>
      <button onClick={resetSpecificStore}>Reset Profile</button>
      <button onClick={getAllValues}>Log All Values</button>
    </div>
  );
}
```

## Pattern Composition

Combine both patterns for complex applications:

```typescript
// 1. Create Action Context
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventAction,
  useActionHandler: useEventActionHandler
} = createActionContext<{
  userLogin: { username: string; password: string };
  userLogout: void;
  trackEvent: { event: string; data: any };
}>('UserEvents');

// 2. Create Store Pattern  
const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  withProvider: withAppStoreProvider
} = createDeclarativeStorePattern('App', {
  user: { id: '', name: '', email: '', isAuthenticated: false },
  ui: { loading: false, error: null },
  analytics: { sessionId: '', events: [] }
});

// 3. Compose Providers
const App = withAppStoreProvider(() => (
  <EventActionProvider>
    <AuthComponent />
    <UserDashboard />
  </EventActionProvider>
));

// 4. Use Both Patterns Together
function AuthComponent() {
  const dispatch = useEventAction();
  const userStore = useAppStore('user');
  const uiStore = useAppStore('ui');
  
  // Action handler that updates stores
  useEventActionHandler('userLogin', async (payload, controller) => {
    try {
      // Set loading state
      uiStore.update(ui => ({ ...ui, loading: true, error: null }));
      
      // Perform authentication
      const user = await authService.login(payload.username, payload.password);
      
      // Update user store
      userStore.setValue({
        id: user.id,
        name: user.name,
        email: user.email,
        isAuthenticated: true
      });
      
      // Track login event
      dispatch('trackEvent', { event: 'user_login', data: { userId: user.id } });
      
    } catch (error) {
      // Handle error
      uiStore.update(ui => ({ 
        ...ui, 
        loading: false, 
        error: (error as Error).message 
      }));
      controller.abort('Login failed');
    } finally {
      uiStore.update(ui => ({ ...ui, loading: false }));
    }
  });
  
  const user = useStoreValue(userStore);
  const ui = useStoreValue(uiStore);
  
  const handleLogin = () => {
    dispatch('userLogin', { username: 'john', password: 'secret' });
  };
  
  return (
    <div>
      {ui.loading && <p>Logging in...</p>}
      {ui.error && <p>Error: {ui.error}</p>}
      {user.isAuthenticated ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## MVVM Architecture Integration

### View Layer (Components)
- React components that render UI
- Dispatch actions for user interactions
- Subscribe to store changes for reactive updates

### ViewModel Layer (Action Handlers)
- Business logic in action handlers
- Coordinate between different stores
- Handle side effects and API calls

### Model Layer (Stores)
- Application state management
- Data persistence and retrieval
- Derived state computations

```typescript
// View Layer - Component
function TodoComponent() {
  const dispatch = useEventAction();           // ViewModel interaction
  const todosStore = useAppStore('todos');     // Model subscription
  const todos = useStoreValue(todosStore);
  
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          {todo.text}
          <button onClick={() => dispatch('toggleTodo', { id: todo.id })}>
            Toggle
          </button>
        </div>
      ))}
    </div>
  );
}

// ViewModel Layer - Action Handler
useEventActionHandler('toggleTodo', async (payload) => {
  const todosStore = stores.getStore('todos');
  const currentTodos = todosStore.getValue();
  
  // Business logic
  const updatedTodos = currentTodos.map(todo =>
    todo.id === payload.id 
      ? { ...todo, completed: !todo.completed }
      : todo
  );
  
  // Update model
  todosStore.setValue(updatedTodos);
  
  // Side effects
  await api.updateTodo(payload.id, { completed: !todo.completed });
});
```

## Best Practices

### When to Use Action Only Pattern
- ✅ Event systems and analytics
- ✅ Command patterns and business logic orchestration
- ✅ Cross-component communication
- ✅ Side effects and API calls

### When to Use Store Only Pattern
- ✅ Application state management
- ✅ Form state and UI state
- ✅ Derived state and computed values
- ✅ Data caching and persistence

### Pattern Composition Guidelines
- Use **Action Only** for business logic and side effects
- Use **Store Only** for state management and data
- Combine both for complex applications with clear separation
- Keep actions focused on orchestration, stores focused on data

## Next Steps

- **[Examples](../examples/pattern-composition)** - See complete pattern composition examples
- **[API Reference](../api/react/action-context)** - Detailed API documentation
- **[MVVM Architecture](./mvvm-architecture)** - Deep dive into architectural principles