# createActionContext Function Guide

Action-Only pattern context for type-safe action dispatching and handler registration.

## Purpose
Create Action-Only pattern context for pure action dispatching without state management, ideal for command patterns and event systems.

## Function Signatures

### Standard Usage
```typescript
createActionContext<T extends ActionPayloadMap>(contextName: string, config?: ActionContextConfig): ActionContextReturn<T>
```
- **Purpose**: Create named action context with configuration
- **Returns**: Provider, hooks, and utility functions

### Config-Only Usage
```typescript
createActionContext<T extends ActionPayloadMap>(config: ActionContextConfig): ActionContextReturn<T>
```
- **Purpose**: Create action context using configuration object only
- **Returns**: Same as standard usage

## Return Value

### Provider Component
```typescript
Provider: React.ComponentType<{ children: React.ReactNode }>
```
- **Purpose**: Context provider for action dispatch access

### Core Hooks
```typescript
useActionDispatch: () => <K extends keyof T>(action: K, payload?: T[K]) => Promise<void>
useActionHandler: (action: K, handler: ActionHandler<T[K], R>, config?: HandlerConfig) => void
useActionRegister: () => ActionRegister<T>
```

### Utility Functions
```typescript
withProvider: <P extends object>(Component: ComponentType<P>) => ComponentType<P>
```

## Usage Patterns

### Basic Action Context Setup
```typescript
interface AppActions extends ActionPayloadMap {
  showNotification: { message: string; type: 'info' | 'error' | 'success' };
  trackEvent: { event: string; data: Record<string, any> };
  logout: void;
}

const {
  Provider: AppActionProvider,
  useActionDispatch: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContext<AppActions>('AppActions', {
  defaultExecutionMode: 'sequential',
  debug: true
});
```

### Handler Registration Pattern
```typescript
function ActionHandlers({ children }: { children: React.ReactNode }) {
  // Register notification handler
  useAppActionHandler('showNotification', useCallback(async (payload) => {
    const toast = document.createElement('div');
    toast.textContent = payload.message;
    toast.className = `toast toast-${payload.type}`;
    document.body.appendChild(toast);
    
    setTimeout(() => document.body.removeChild(toast), 3000);
  }, []));
  
  // Register analytics handler
  useAppActionHandler('trackEvent', useCallback(async (payload) => {
    await analytics.track(payload.event, payload.data);
    console.log('Event tracked:', payload.event);
  }, []));
  
  // Register logout handler
  useAppActionHandler('logout', useCallback(async () => {
    await clearSession();
    window.location.href = '/login';
  }, []));
  
  return children;
}
```

### Component Usage
```typescript
function NotificationButton() {
  const dispatch = useAppAction();
  
  const showSuccess = () => {
    dispatch('showNotification', {
      message: 'Action completed successfully!',
      type: 'success'
    });
  };
  
  const trackClick = () => {
    dispatch('trackEvent', {
      event: 'button_click',
      data: { component: 'NotificationButton' }
    });
  };
  
  return (
    <button onClick={() => { trackClick(); showSuccess(); }}>
      Show Success
    </button>
  );
}
```

### Complete Application Structure
```typescript
function App() {
  return (
    <AppActionProvider>
      <ActionHandlers>
        <NotificationButton />
        <EventTracker />
        <LogoutButton />
      </ActionHandlers>
    </AppActionProvider>
  );
}
```

## Advanced Configuration

### Execution Modes
```typescript
const { Provider } = createActionContext<MyActions>('App', {
  defaultExecutionMode: 'parallel', // 'sequential' | 'parallel' | 'race'
  maxHandlers: 50,
  debug: true,
  errorHandler: (error, action, payload) => {
    console.error(`Action ${action} failed:`, error);
  }
});
```

### Priority-Based Handlers
```typescript
function PriorityHandlers() {
  const dispatch = useAppAction();
  
  // High priority validation
  useAppActionHandler('submitForm', async (payload, controller) => {
    if (!payload.email.includes('@')) {
      controller.abort('Invalid email');
      return;
    }
  }, { priority: 100 });
  
  // Medium priority processing
  useAppActionHandler('submitForm', async (payload) => {
    await saveToDatabase(payload);
  }, { priority: 50 });
  
  // Low priority analytics
  useAppActionHandler('submitForm', async (payload) => {
    await trackSubmission(payload);
  }, { priority: 10 });
  
  return null;
}
```

### Handler with Pipeline Control
```typescript
function ValidationHandlers() {
  useAppActionHandler('processPayment', async (payload, controller) => {
    // Validate payment data
    if (!payload.amount || payload.amount <= 0) {
      controller.abort('Invalid payment amount');
      return;
    }
    
    // Modify payload for next handlers
    controller.modifyPayload(current => ({
      ...current,
      processedAt: Date.now(),
      currency: current.currency || 'USD'
    }));
    
    // Set intermediate result
    controller.setResult({ validated: true });
  }, { priority: 100 });
  
  useAppActionHandler('processPayment', async (payload, controller) => {
    // Get modified payload
    const modifiedPayload = controller.getPayload();
    
    // Process payment
    const result = await paymentProcessor.charge(modifiedPayload);
    
    if (result.success) {
      controller.setResult({ charged: true, transactionId: result.id });
    } else {
      controller.abort('Payment processing failed');
    }
  }, { priority: 50 });
  
  return null;
}
```

## Integration with Store Pattern

### Combined Action + Store Pattern
```typescript
// Action context for commands
const {
  Provider: ActionProvider,
  useActionDispatch: useAction,
  useActionHandler: useActionHandler
} = createActionContext<UserActions>('UserActions');

// Store context for state
const {
  Provider: StoreProvider,
  useStore: useStore
} = createStoreContext('UserStores', {
  profile: { name: '', email: '' },
  settings: { theme: 'light' }
});

function UserLogic({ children }: { children: React.ReactNode }) {
  const profileStore = useStore('profile');
  
  useActionHandler('updateProfile', async (payload) => {
    // Store Integration Pattern: Read → Logic → Update
    const current = profileStore.getValue();
    const updated = { ...current, ...payload };
    profileStore.setValue(updated);
  });
  
  return children;
}

function App() {
  return (
    <ActionProvider>
      <StoreProvider>
        <UserLogic>
          <UserInterface />
        </UserLogic>
      </StoreProvider>
    </ActionProvider>
  );
}
```

### Event System Pattern
```typescript
interface EventActions extends ActionPayloadMap {
  windowResize: { width: number; height: number };
  userInteraction: { type: string; target: string };
  dataLoaded: { source: string; count: number };
}

const EventSystem = createActionContext<EventActions>('Events');

function EventListeners() {
  const dispatch = EventSystem.useActionDispatch();
  
  useEffect(() => {
    const handleResize = () => {
      dispatch('windowResize', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);
  
  return null;
}

function EventHandlers() {
  EventSystem.useActionHandler('windowResize', async (payload) => {
    console.log('Window resized:', payload);
    // Handle responsive layout changes
  });
  
  EventSystem.useActionHandler('userInteraction', async (payload) => {
    await analytics.track('user_interaction', payload);
  });
  
  return null;
}
```

## HOC Pattern

### Automatic Provider Wrapping
```typescript
const EventActions = createActionContext<MyEvents>('Events');

// Wrap component with provider automatically
const App = EventActions.withProvider(() => (
  <div>
    <EventHandlers />
    <UserInterface />
  </div>
));
```

## Performance Considerations

### Handler Registration
```typescript
// ✅ Wrap handlers with useCallback
const optimizedHandler = useCallback(async (payload) => {
  await processPayload(payload);
}, []);

useActionHandler('myAction', optimizedHandler);

// ❌ Avoid inline handlers (cause re-registration)
useActionHandler('myAction', async (payload) => {
  await processPayload(payload);
});
```

### Conditional Handlers
```typescript
function ConditionalHandlers({ isEnabled }: { isEnabled: boolean }) {
  const handler = useCallback(async (payload) => {
    await handlePayload(payload);
  }, []);
  
  // Handler only registered when enabled
  useEffect(() => {
    if (!isEnabled) return;
    
    const register = getActionRegister();
    const unregister = register.register('conditionalAction', handler);
    return unregister;
  }, [isEnabled, handler]);
  
  return null;
}
```

## Error Handling

### Global Error Handler
```typescript
const { Provider } = createActionContext<MyActions>('App', {
  errorHandler: (error, action, payload) => {
    console.error(`Action "${action}" failed:`, error);
    
    // Send to error reporting service
    errorReporting.captureException(error, {
      extra: { action, payload }
    });
    
    // Show user notification
    showErrorNotification('Action failed. Please try again.');
  }
});
```

### Handler-Level Error Handling
```typescript
useActionHandler('riskyAction', async (payload, controller) => {
  try {
    await riskyOperation(payload);
  } catch (error) {
    // Log error but don't abort pipeline
    console.error('Risky operation failed:', error);
    
    // Set error result for downstream handlers
    controller.setResult({ error: true, message: error.message });
  }
});
```

## Best Practices

### Type Safety
```typescript
// ✅ Define comprehensive action interface
interface AppActions extends ActionPayloadMap {
  // Specific payload types
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  
  // Void actions
  refresh: void;
  logout: void;
  
  // Union types for variants
  showDialog: 
    | { type: 'confirm'; message: string; onConfirm: () => void }
    | { type: 'alert'; message: string };
}
```

### Handler Organization
```typescript
// ✅ Group related handlers
function UserActionHandlers() {
  useUserActionHandler('updateUser', updateUserHandler);
  useUserActionHandler('deleteUser', deleteUserHandler);
  useUserActionHandler('refreshUser', refreshUserHandler);
  return null;
}

function UIActionHandlers() {
  useUIActionHandler('showModal', showModalHandler);
  useUIActionHandler('hideModal', hideModalHandler);
  return null;
}
```

### Component Structure
```typescript
function App() {
  return (
    <ActionProvider>          {/* Action Context */}
      <UserActionHandlers />  {/* Business Logic */}
      <UIActionHandlers />    {/* UI Logic */}
      <UserInterface />       {/* Pure UI Components */}
    </ActionProvider>
  );
}
```

## Integration

- **Pattern Type**: Action-Only pattern for pure command dispatching
- **ActionRegister**: Core pipeline management with type safety
- **React Context**: Provider/hook pattern for dependency injection
- **Type Safety**: Full TypeScript support with ActionPayloadMap
- **Pipeline Control**: Advanced handler execution with PipelineController

## Links

- **TypeDoc**: [createActionContext.md](./react/src/functions/createActionContext.md)
- **ActionRegister Guide**: [ActionRegister Guide](./actionregister-guide.md)
- **Pattern Guide**: [Action Patterns](/en/guide/patterns/action/)