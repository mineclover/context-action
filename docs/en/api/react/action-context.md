# Action Context API

The Action Context provides React integration for the Action Only pattern, enabling type-safe action dispatching and handler registration within React components.

## Import

```typescript
import { createActionContext, type ActionPayloadMap } from '@context-action/react';
```

## createActionContext

### `createActionContext<T>(name)`

Creates a complete Action Context with Provider, hooks, and dispatch capabilities.

**Type Parameters:**
- `T extends ActionPayloadMap` - Action type definitions

**Parameters:**
- `name: string` - Context name for debugging and identification

**Returns:** `ActionContextResult<T>`

```typescript
interface ActionContextResult<T extends ActionPayloadMap> {
  Provider: React.ComponentType<{ children: React.ReactNode }>;
  useActionDispatch: () => (action: keyof T, payload: T[keyof T]) => Promise<any>;
  useActionHandler: (
    action: keyof T, 
    handler: ActionHandler<T[keyof T]>, 
    config?: HandlerConfig
  ) => void;
}
```

**Example:**
```typescript
interface AppActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  logout: void;
  trackEvent: { event: string; data: any };
}

const {
  Provider: AppActionProvider,
  useActionDispatch: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContext<AppActions>('AppActions');
```

## Provider Component

### `<Provider>`

Context provider that manages the ActionRegister instance and provides action capabilities to child components.

**Props:**
- `children: React.ReactNode` - Child components

```typescript
function App() {
  return (
    <AppActionProvider>
      <LoginComponent />
      <DashboardComponent />
    </AppActionProvider>
  );
}
```

**Features:**
- Automatic ActionRegister instance creation
- Context provision to all child components
- Cleanup on unmount

## Hooks

### `useActionDispatch()`

Returns a dispatch function for triggering actions.

**Returns:** `DispatchFunction<T>`

```typescript
type DispatchFunction<T> = <K extends keyof T>(
  action: K,
  payload: T[K]
) => Promise<any>;
```

**Example:**
```typescript
function LoginComponent() {
  const dispatch = useAppAction();
  
  const handleLogin = async () => {
    try {
      const result = await dispatch('authenticate', {
        username: 'john',
        password: 'secret123'
      });
      console.log('Login result:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

### `useActionHandler(action, handler, config?)`

Register an action handler within a React component with automatic cleanup.

**Parameters:**
- `action: keyof T` - Action name to handle
- `handler: ActionHandler<T[action]>` - Handler function
- `config?: HandlerConfig` - Optional handler configuration

**Returns:** `void`

```typescript
interface HandlerConfig {
  id?: string;                     // Unique handler identifier
  priority?: number;               // Execution priority (default: 1000)
  once?: boolean;                  // Execute only once (default: false)
  blocking?: boolean;              // Block until completion (default: true)
  condition?: (payload) => boolean; // Conditional execution
  metadata?: Record<string, any>;  // Custom metadata
}
```

**Example:**
```typescript
function AuthHandler() {
  const dispatch = useAppAction();
  
  // Register authentication handler
  useAppActionHandler('authenticate', useCallback(async (payload, controller) => {
    try {
      // Validate credentials
      if (!payload.username || !payload.password) {
        controller.abort('Missing credentials');
        return;
      }
      
      // Perform authentication
      const user = await authService.login(payload.username, payload.password);
      
      // Track successful login
      dispatch('trackEvent', { 
        event: 'user_login', 
        data: { userId: user.id, timestamp: Date.now() } 
      });
      
      return { success: true, user };
      
    } catch (error) {
      controller.abort(`Authentication failed: ${(error as Error).message}`);
    }
  }, [dispatch]), { 
    priority: 100, 
    id: 'auth-handler' 
  });
  
  return null; // Handler-only component
}
```

### Handler Registration Best Practices

#### Use useCallback for Performance
```typescript
useAppActionHandler('processData', useCallback(async (payload, controller) => {
  // Handler logic here
}, [dependency1, dependency2]), { priority: 80 });
```

#### Conditional Registration
```typescript
function ConditionalHandler({ shouldHandle }: { shouldHandle: boolean }) {
  useAppActionHandler('processData', useCallback(async (payload) => {
    // Handler logic
  }, []), { 
    priority: 50,
    condition: () => shouldHandle 
  });
  
  return null;
}
```

#### One-Time Handlers
```typescript
useAppActionHandler('initializeApp', useCallback(async (payload) => {
  // Initialization logic that should only run once
  await initializeServices();
  await loadConfiguration();
}, []), { 
  once: true, 
  priority: 100 
});
```

## TypeScript Integration

### Type Safety

The Action Context provides full TypeScript support with compile-time type checking:

```typescript
interface MyActions extends ActionPayloadMap {
  // Void action
  logout: void;
  
  // Object payload
  updateUser: { id: string; name: string; email: string };
  
  // Union type payload
  setTheme: 'light' | 'dark';
  
  // Optional properties
  trackEvent: { event: string; data?: any };
}

const { useActionDispatch } = createActionContext<MyActions>('MyApp');

function Component() {
  const dispatch = useActionDispatch();
  
  // ✅ Valid dispatches
  dispatch('logout');
  dispatch('updateUser', { id: '1', name: 'John', email: 'john@example.com' });
  dispatch('setTheme', 'dark');
  dispatch('trackEvent', { event: 'click' });
  
  // ❌ TypeScript errors
  dispatch('logout', {}); // logout expects void
  dispatch('updateUser', { id: '1' }); // missing name and email
  dispatch('setTheme', 'blue'); // invalid theme value
}
```

### Handler Type Inference

```typescript
useAppActionHandler('updateUser', (payload, controller) => {
  // payload is automatically typed as { id: string; name: string; email: string }
  console.log(payload.id);    // ✅ string
  console.log(payload.name);  // ✅ string
  console.log(payload.email); // ✅ string
  console.log(payload.age);   // ❌ TypeScript error - property doesn't exist
});
```

## Error Handling

### Handler Error Recovery

```typescript
function ErrorHandlingComponent() {
  useAppActionHandler('riskyOperation', useCallback(async (payload, controller) => {
    try {
      const result = await riskyApiCall(payload.data);
      return { success: true, result };
      
    } catch (error) {
      // Log error for monitoring
      console.error('Operation failed:', error);
      
      // Set error result for other handlers
      controller.setResult({ 
        step: 'primary', 
        success: false, 
        error: (error as Error).message 
      });
      
      // Don't abort - let fallback handlers try
      return { success: false, primaryFailed: true };
    }
  }, []), { priority: 100, id: 'primary-handler' });
  
  // Fallback handler
  useAppActionHandler('riskyOperation', useCallback(async (payload, controller) => {
    const results = controller.getResults();
    const primaryFailed = results.some(r => r.primaryFailed);
    
    if (primaryFailed) {
      // Try alternative approach
      const fallbackResult = await alternativeApiCall(payload.data);
      return { success: true, result: fallbackResult, fallbackUsed: true };
    }
    
    // Primary succeeded, skip fallback
    return { success: true, fallbackSkipped: true };
  }, []), { priority: 50, id: 'fallback-handler' });
  
  return null;
}
```

### Dispatch Error Handling

```typescript
function ComponentWithErrorHandling() {
  const dispatch = useAppAction();
  
  const handleAction = async () => {
    try {
      const result = await dispatch('authenticate', {
        username: 'john',
        password: 'secret'
      });
      
      if (result.success) {
        // Handle success
      }
    } catch (error) {
      // Handle pipeline abort or other errors
      console.error('Action failed:', error);
    }
  };
  
  return <button onClick={handleAction}>Authenticate</button>;
}
```

## Advanced Usage Patterns

### Handler Coordination

```typescript
function CoordinatedHandlers() {
  const dispatch = useAppAction();
  
  // Step 1: Preparation
  useAppActionHandler('processOrder', useCallback(async (payload, controller) => {
    controller.modifyPayload(current => ({
      ...current,
      sessionId: getSessionId(),
      timestamp: Date.now()
    }));
    
    controller.setResult({ step: 'preparation', ready: true });
    return { prepared: true };
  }, []), { priority: 100, id: 'preparer' });
  
  // Step 2: Validation
  useAppActionHandler('processOrder', useCallback(async (payload, controller) => {
    const validation = await validateOrder(payload);
    
    if (!validation.isValid) {
      controller.abort(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    controller.setResult({ step: 'validation', valid: true });
    return validation;
  }, []), { priority: 90, id: 'validator' });
  
  // Step 3: Processing
  useAppActionHandler('processOrder', useCallback(async (payload, controller) => {
    const results = controller.getResults();
    const validation = results.find(r => r.step === 'validation');
    
    if (validation?.valid) {
      const processResult = await processOrder(payload);
      
      // Trigger follow-up action
      dispatch('trackEvent', { 
        event: 'order_processed', 
        data: { orderId: processResult.id } 
      });
      
      return processResult;
    }
  }, [dispatch]), { priority: 80, id: 'processor' });
  
  return null;
}
```

## Examples

See the [Action Only Pattern Example](../../examples/action-only) for complete working examples.

## Related

- **[ActionRegister API](../core/action-register)** - Core action pipeline system
- **[PipelineController API](../core/pipeline-controller)** - Pipeline control methods
- **[Store Pattern API](./store-pattern)** - Store Only pattern for state management
- **[Action Pipeline Guide](../../guide/action-pipeline)** - Usage guide and patterns