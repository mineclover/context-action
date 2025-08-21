# Dispatch Access Patterns

Two main approaches for accessing action dispatch functionality in the Context-Action framework: register-based access and hook-based access.

## Hook-Based Dispatch (Recommended)

Use React hooks from `createActionContext` to access dispatch functionality within components. This is the recommended approach for React applications.

### Setup Action Context

First, create an action context with your action definitions:

```typescript
import { createActionContext } from '@context-action/react'

interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string }
  deleteUser: { id: string }
  saveUser: { name: string; email: string }
  refreshData: void
}

const {
  Provider: AppActionProvider,
  useActionDispatch,
  useActionDispatchWithResult,
  useActionRegister
} = createActionContext<AppActions>('App')
```

### Basic Hook Usage

```typescript
function UserComponent() {
  const dispatch = useActionDispatch()
  
  const handleUpdate = () => {
    dispatch('updateUser', { id: '123', name: 'John', email: 'john@example.com' })
  }
  
  return <button onClick={handleUpdate}>Update User</button>
}
```

### Hook with Result Collection

```typescript
function UserProfile() {
  const { dispatch } = useActionDispatchWithResult()
  const [loading, setLoading] = useState(false)
  
  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await dispatch('saveUser', userData)
      if (result.success) {
        console.log('User saved successfully')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button onClick={handleSave} disabled={loading}>
      {loading ? 'Saving...' : 'Save User'}
    </button>
  )
}
```

### Complete Setup with Provider

```typescript
function App() {
  return (
    <AppActionProvider>
      <UserManagement />
    </AppActionProvider>
  )
}

function UserManagement() {
  const dispatch = useActionDispatch()
  
  const updateProfile = (data: { name: string; email: string }) => {
    // Fully type-safe dispatch
    dispatch('updateUser', { id: '123', ...data })
  }
  
  const deleteAccount = () => {
    dispatch('deleteUser', { id: '123' })
  }
  
  const refreshData = () => {
    dispatch('refreshData')  // No payload needed for void actions
  }
  
  return (
    <div>
      <button onClick={() => updateProfile({ name: 'John', email: 'john@example.com' })}>
        Update Profile
      </button>
      <button onClick={deleteAccount}>Delete Account</button>
      <button onClick={refreshData}>Refresh</button>
    </div>
  )
}
```

## Register-Based Dispatch

Direct access to the ActionRegister instance for advanced use cases and non-React environments.

### Basic Register Access

```typescript
import { ActionRegister } from '@context-action/core'

// Create register instance
const register = new ActionRegister<AppActions>('MyApp')

// Register handlers
register.register('updateUser', async (payload, controller) => {
  const user = await userService.update(payload.id, payload)
  controller.setResult(user)
})

// Dispatch actions
await register.dispatch('updateUser', { id: '123', name: 'John' })
```

### Register with Result Collection

```typescript
// Dispatch with detailed result information
const result = await register.dispatchWithResult('updateUser', payload)

if (result.success) {
  console.log('Execution details:', {
    duration: result.execution.duration,
    handlersExecuted: result.execution.handlersExecuted,
    results: result.results
  })
} else {
  console.error('Action failed:', result.error)
}
```

### Advanced Register Configuration

```typescript
const register = new ActionRegister<AppActions>('MyApp', {
  debug: true,
  maxHandlers: 10,
  defaultExecutionMode: 'sequential',
  enableMetrics: true
})

// Register with advanced options
register.register('complexAction', handler, {
  priority: 100,
  tags: ['business', 'critical'],
  timeout: 5000,
  debounce: 300
})
```

## React Integration with Register Access

Access the underlying register instance within React components when needed.

### Using Context-Generated useActionRegister Hook

```typescript
function AdvancedComponent() {
  const register = useActionRegister()  // From createActionContext
  
  const handleComplexOperation = async () => {
    if (!register) return
    
    // Direct register access for advanced operations
    const result = await register.dispatchWithResult('updateUser', payload, {
      executionMode: 'parallel',
      filter: {
        tags: ['critical'],
        excludeTags: ['analytics']
      }
    })
    
    console.log('Advanced result:', result)
  }
  
  return <button onClick={handleComplexOperation}>Complex Operation</button>
}
```

### Register Information Access

```typescript
function DebugPanel() {
  const register = useActionRegister()  // From createActionContext
  
  const showRegistryInfo = () => {
    if (!register) return
    
    const info = register.getRegistryInfo()
    console.log('Registry information:', {
      name: info.name,
      totalActions: info.totalActions,
      totalHandlers: info.totalHandlers,
      registeredActions: info.registeredActions
    })
  }
  
  return <button onClick={showRegistryInfo}>Show Registry Info</button>
}
```

## Comparison: Hook vs Register

### Hook-Based Dispatch (Recommended)

**Pros:**
- React-optimized with automatic context management
- Cleaner component code with less boilerplate
- Automatic provider dependency injection
- Type-safe with excellent TypeScript integration
- Follows React patterns and conventions

**Cons:**
- React-specific, not usable outside React components
- Less control over advanced dispatch options
- Requires React Context setup

**Use Cases:**
- Standard React component interactions
- Form submissions and user events
- Component-level business logic
- Most React application scenarios

### Register-Based Dispatch

**Pros:**
- Framework-agnostic, works in any JavaScript environment
- Full control over dispatch options and configuration
- Direct access to all ActionRegister features
- Advanced debugging and monitoring capabilities
- Suitable for utility functions and services

**Cons:**
- More verbose setup and usage
- Manual dependency management
- Requires explicit register instance passing
- More complex error handling

**Use Cases:**
- Non-React environments (Node.js, vanilla JS)
- Advanced dispatch configurations
- Testing and debugging scenarios
- Service layer implementations
- Complex business logic requiring register metadata

## Best Practices

### When to Use Hooks

```typescript
// ✅ Standard component interactions
function UserForm() {
  const dispatch = useActionDispatch()  // From createActionContext
  
  const handleSubmit = (formData) => {
    dispatch('updateUser', formData)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### When to Use Register

```typescript
// ✅ Service layer or utility functions
class UserService {
  constructor(private register: ActionRegister<UserActions>) {}
  
  async batchUpdateUsers(users: User[]) {
    const results = await Promise.all(
      users.map(user => 
        this.register.dispatchWithResult('updateUser', user, {
          executionMode: 'parallel',
          timeout: 10000
        })
      )
    )
    
    return results.filter(r => r.success)
  }
}
```

### Hybrid Approach

```typescript
// ✅ Component uses hook, calls service with register
function UserManagement() {
  const dispatch = useActionDispatch()  // From createActionContext
  const register = useActionRegister()  // From createActionContext
  const userService = useMemo(() => 
    register ? new UserService(register) : null, 
    [register]
  )
  
  const handleBatchUpdate = async () => {
    if (!userService) return
    
    const results = await userService.batchUpdateUsers(selectedUsers)
    dispatch('updateUser', { 
      id: 'notification',
      message: `Updated ${results.length} users` 
    })
  }
  
  return <button onClick={handleBatchUpdate}>Batch Update</button>
}
```

## Error Handling Patterns

### Hook Error Handling

```typescript
function SafeComponent() {
  const dispatch = useActionDispatch()  // From createActionContext
  
  const handleAction = async () => {
    try {
      await dispatch('updateUser', payload)
    } catch (error) {
      // Handle dispatch errors - use an action that exists in AppActions
      console.error('Action failed:', error.message)
    }
  }
  
  return <button onClick={handleAction}>Safe Action</button>
}
```

### Register Error Handling

```typescript
async function handleWithRegister(register: ActionRegister<AppActions>) {
  try {
    const result = await register.dispatchWithResult('updateUser', payload)
    
    if (!result.success) {
      console.error('Action failed:', result.error)
      // Handle specific failure scenarios
      return { success: false, error: result.error }
    }
    
    return { success: true, data: result.results }
  } catch (error) {
    console.error('Unexpected error:', error)
    throw error
  }
}
```

## Real-World Examples

- [Todo List Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - Hook-based dispatch patterns
- [Chat Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - Mixed hook and register usage
- [User Profile Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - Advanced dispatch patterns

## Related Patterns

- [Dispatch Patterns](./dispatch-patterns.md) - Basic dispatching techniques
- [Register Patterns](./register-patterns.md) - Handler registration patterns
- [Action Basic Usage](./basic-usage.md) - Fundamental action concepts
- [Type System](./type-system.md) - TypeScript integration