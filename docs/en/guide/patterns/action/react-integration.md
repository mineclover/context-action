# React Integration Helpers

React-specific utilities and patterns for seamless Context-Action integration.

## 🔧 Core React Helpers

### useActionHandler Hook

Enhanced React hook for action handler registration with automatic cleanup and HMR support:

```typescript
import { useActionHandler } from '@context-action/core';

function MyComponent() {
  const registry = useActionRegister();
  
  // Auto-cleanup on unmount, HMR support
  const handlerConfig = useActionHandler(
    registry,
    'userAction', 
    async (payload) => {
      // Handler logic here
      console.log('Processing:', payload);
    },
    { 
      priority: 10,
      id: 'user-handler',
      replaceExisting: true  // 🆕 Perfect for React HMR
    },
    [] // Dependencies array (like useCallback)
  );
  
  return <div>Component with action handler</div>;
}
```

**Key Features**:
- **Automatic Cleanup**: Handlers are cleaned up on component unmount
- **HMR Support**: `replaceExisting: true` prevents handler duplication during hot reload
- **Dependency Management**: Re-registers handlers when dependencies change
- **Error Handling**: Built-in error boundaries integration

### Direct Registry Usage

For custom dispatch patterns, use the ActionRegister directly:

```typescript
function UserProfile() {
  const registry = useActionRegister();
  
  const handleUpdate = async () => {
    try {
      await registry.dispatch('updateUser', { 
        id: '123', 
        name: 'John Doe' 
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      
      // Optional: Show user-friendly error
      toast.error('Failed to update user. Please try again.');
      
      // Optional: Send to error tracking
      errorTracking.captureException(error, {
        action: 'updateUser',
        component: 'UserProfile'
      });
    }
  };
  
  return (
    <button onClick={handleUpdate}>
      Update Profile
    </button>
  );
}
```

### ReactDevUtils

Development utilities for debugging and monitoring:

```typescript
import { ReactDevUtils } from '@context-action/core';

// Enable debug mode for all registries
ReactDevUtils.enableDebugMode();

// Get comprehensive statistics
function DevPanel() {
  const registry = useActionRegister();
  const stats = ReactDevUtils.getStats(registry);
  
  return (
    <div className="dev-panel">
      <h3>Action Registry Stats</h3>
      <p>Total Actions: {stats.totalActions}</p>
      <p>Total Handlers: {stats.totalHandlers}</p>
      <p>Average Execution Time: {stats.averageExecutionTime}ms</p>
      
      {Object.entries(stats.actionStats).map(([action, actionStat]) => (
        <div key={action}>
          <h4>{action}</h4>
          <p>Handlers: {actionStat.handlerCount}</p>
          <p>Success Rate: {actionStat.successRate}%</p>
        </div>
      ))}
    </div>
  );
}
```

## 🏗️ Integration Patterns

### Complete React Component Pattern

```typescript
interface UserActions {
  updateProfile: { name: string; email: string };
  deleteProfile: { id: string };
  resetProfile: void;
}

function UserComponent() {
  const registry = useActionRegister<UserActions>();
  const userStore = useUserStore('profile');
  
  // Handler registrations with proper React integration
  useActionHandler(
    registry,
    'updateProfile',
    async (payload) => {
      const current = userStore.getValue();
      userStore.setValue({ ...current, ...payload });
    },
    { 
      priority: 10, 
      id: 'update-profile',
      replaceExisting: true 
    },
    [userStore]
  );
  
  useActionHandler(
    registry,
    'deleteProfile',
    async (payload) => {
      await api.deleteUser(payload.id);
      userStore.setValue(null);
    },
    { 
      priority: 20, 
      id: 'delete-profile',
      blocking: true 
    },
    []
  );
  
  // Error handling wrapper for dispatch
  const safeDispatch = useCallback(async (action, payload) => {
    try {
      await registry.dispatch(action, payload);
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      toast.error(`Action ${action} failed: ${error.message}`);
    }
  }, [registry]);
  
  const user = useStoreValue(userStore);
  
  return (
    <div>
      <h1>{user?.name || 'No User'}</h1>
      <button onClick={() => safeDispatch('updateProfile', {
        name: 'Updated Name',
        email: 'updated@example.com'
      })}>
        Update Profile
      </button>
      <button onClick={() => safeDispatch('deleteProfile', { id: user?.id || '' })}>
        Delete Profile
      </button>
    </div>
  );
}
```

### Error Boundary Integration

```typescript
import { ReactActionError } from '@context-action/core';

class ActionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    // Handle React Action Errors specifically
    if (error instanceof ReactActionError) {
      console.error('Action Error:', {
        action: error.action,
        payload: error.payload,
        handlerId: error.handlerId
      });
    }
    
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong with action execution.</h1>;
    }
    
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ActionErrorBoundary>
      <UserComponent />
    </ActionErrorBoundary>
  );
}
```

## ⚡ Performance Optimization

### Handler Registration Optimization

```typescript
// ✅ OPTIMIZED: Stable handler with proper dependencies
function OptimizedComponent() {
  const registry = useActionRegister();
  const userStore = useUserStore('profile');
  
  // Stable handler function with minimal dependencies
  const stableHandler = useCallback(async (payload) => {
    // Always get fresh state inside handler
    const currentUser = userStore.getValue();
    const updatedUser = { ...currentUser, ...payload };
    userStore.setValue(updatedUser);
  }, [userStore]); // Only userStore in dependencies
  
  useActionHandler(
    registry,
    'updateUser',
    stableHandler,
    { 
      priority: 10,
      id: 'user-updater',
      replaceExisting: true // Prevents accumulation during HMR
    },
    [stableHandler] // Handler as dependency
  );
  
  return <div>Optimized Component</div>;
}
```

### Conditional Handler Registration

```typescript
// ✅ CONDITIONAL: Register handlers based on props/state
function ConditionalComponent({ enableAdvancedFeatures }) {
  const registry = useActionRegister();
  
  // Basic handler (always registered)
  useActionHandler(
    registry,
    'basicAction',
    basicHandler,
    { priority: 10, id: 'basic' },
    []
  );
  
  // Advanced handler (conditionally registered)
  useActionHandler(
    registry,
    'advancedAction',
    enableAdvancedFeatures ? advancedHandler : () => {
      console.warn('Advanced features disabled');
    },
    { 
      priority: 20, 
      id: 'advanced',
      replaceExisting: true 
    },
    [enableAdvancedFeatures]
  );
  
  return <div>Conditional handlers based on props</div>;
}
```

## 🧪 Testing Patterns

### Mock React Helpers

```typescript
// Test utility for mocking React helpers
const mockReactHelpers = {
  useActionHandler: jest.fn(),
  ReactDevUtils: {
    enableDebugMode: jest.fn(),
    getStats: jest.fn(() => ({
      totalActions: 0,
      totalHandlers: 0,
      averageExecutionTime: 0,
      actionStats: {}
    }))
  }
};

// Test component with mocked registry
test('UserComponent handles actions correctly', async () => {
  const mockRegistry = new ActionRegister<UserActions>();
  const mockDispatch = jest.fn();
  
  // Mock registry dispatch method
  mockRegistry.dispatch = mockDispatch;
  
  render(<UserComponent />);
  
  fireEvent.click(screen.getByText('Update Profile'));
  
  expect(mockDispatch).toHaveBeenCalledWith('updateProfile', {
    name: 'Updated Name',
    email: 'updated@example.com'
  });
});
```

## 🔗 Integration with Store Patterns

### Combined Action and Store Pattern

```typescript
// Complete integration pattern
function UserManagementComponent() {
  // Action context
  const dispatch = useActionDispatch();
  
  // Store context  
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore);
  
  // Handler registration with store integration
  useActionHandler('updateUser', useCallback(async (payload) => {
    // Step 1: Read current state
    const currentUser = userStore.getValue();
    
    // Step 2: Execute business logic
    const updatedUser = {
      ...currentUser,
      ...payload,
      lastModified: new Date()
    };
    
    // Step 3: Update store
    userStore.setValue(updatedUser);
    
    // Optional: API call
    await api.updateUser(updatedUser);
  }, [userStore]));
  
  return (
    <div>
      <h1>User: {user.name}</h1>
      <button onClick={() => dispatch('updateUser', {
        name: 'New Name',
        email: 'new@example.com'
      })}>
        Update User
      </button>
    </div>
  );
}
```

## 📚 Migration Guide

### From Manual Registration to React Helpers

```typescript
// Before: Manual registration with useEffect
function OldComponent() {
  const registry = useActionRegister();
  
  useEffect(() => {
    const unregister = registry.register('myAction', handler, {
      priority: 10,
      id: 'my-handler'
    });
    
    return unregister; // Cleanup
  }, [registry]);
}

// After: Using useActionHandler
function NewComponent() {
  const registry = useActionRegister();
  
  useActionHandler(
    registry,
    'myAction',
    handler,
    { 
      priority: 10, 
      id: 'my-handler',
      replaceExisting: true // 🆕 HMR support
    },
    []
  );
}
```

The React Integration Helpers provide a robust foundation for building React applications with the Context-Action framework, ensuring proper lifecycle management, performance optimization, and development experience.